import type {
  AiChatCitationResponse,
  AiChatMessageListResponse,
  AiChatRequest,
  AiChatSessionListResponse,
} from "@yakuji/shared";
import { aiChatMessageListResponseSchema, aiChatSessionListResponseSchema } from "@yakuji/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

interface ProblemDetails {
  detail?: string;
}

/**
 * AIチャット（設計書⑤ POST /api/v1/ai/chat・GET /api/v1/ai/chat/sessions{,/:id/messages}、S14）向けAPIクライアント。
 * サーバーコンポーネント・クライアントコンポーネントの両方から使えるよう、
 * Reactに依存しない純粋関数として実装する（accessTokenは呼び出し側から渡す、他featureと同方針）。
 */
export class ChatApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseProblemOrThrow(response: Response, fallbackMessage: string): Promise<never> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null;
  throw new ChatApiError(problem?.detail ?? fallbackMessage, response.status);
}

export interface ListAiChatSessionsParams {
  cursor?: string;
  limit?: number;
}

/** GET /api/v1/ai/chat/sessions（S14「履歴」一覧、id降順=作成順）。 */
export async function listChatSessions(
  accessToken: string,
  params: ListAiChatSessionsParams = {},
): Promise<AiChatSessionListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/ai/chat/sessions${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "チャット履歴の取得に失敗しました。");
  }

  return aiChatSessionListResponseSchema.parse(await response.json());
}

export interface ListAiChatMessagesParams {
  cursor?: string;
  limit?: number;
}

/**
 * GET /api/v1/ai/chat/sessions/:id/messages（id降順=新しい順で返るため、
 * 会話として表示する際は呼び出し側で古い順に並べ替える）。
 */
export async function listChatMessages(
  accessToken: string,
  sessionId: string,
  params: ListAiChatMessagesParams = {},
): Promise<AiChatMessageListResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  const queryString = query.toString();

  const response = await fetch(
    `${API_BASE_URL}/ai/chat/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await parseProblemOrThrow(response, "チャットメッセージの取得に失敗しました。");
  }

  return aiChatMessageListResponseSchema.parse(await response.json());
}

export interface ChatStreamHandlers {
  onCitations: (citations: AiChatCitationResponse[]) => void;
  onToken: (token: string) => void;
  onDone: (sessionId: string, messageId: string) => void;
}

/**
 * POST /api/v1/ai/chat（SSEストリーミング）。ブラウザ標準のEventSourceはAuthorizationヘッダを
 * 付与できないため、fetch + ReadableStreamで手動パースする
 * （apps/api の OpenAiChatCompletionProvider.consumeStream と同じ方式）。
 * @throws {ChatApiError} レスポンス開始前（ヘッダ受信時点、quota超過等）・開始後（SSEの`error`イベント、
 *   サーバー側でLLM呼び出し等が失敗した場合）のいずれも同じChatApiErrorとしてthrowする。
 *   呼び出し側はtry/catchで一箇所にエラー表示処理をまとめられる。
 */
export async function streamChat(
  accessToken: string,
  request: AiChatRequest,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok || !response.body) {
    await parseProblemOrThrow(response, "AIチャットの応答取得に失敗しました。");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const rawEvents = buffer.split("\n\n");
    buffer = rawEvents.pop() ?? "";

    for (const rawEvent of rawEvents) {
      handleSseEvent(rawEvent, handlers);
    }
  }
}

function handleSseEvent(rawEvent: string, handlers: ChatStreamHandlers): void {
  let eventName: string | undefined;
  let data: string | undefined;

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      data = line.slice("data:".length).trim();
    }
  }

  if (!eventName || !data) {
    return;
  }

  const payload = JSON.parse(data) as Record<string, unknown>;

  switch (eventName) {
    case "citations":
      handlers.onCitations(payload.citations as AiChatCitationResponse[]);
      break;
    case "token":
      handlers.onToken(payload.token as string);
      break;
    case "done":
      handlers.onDone(payload.sessionId as string, payload.messageId as string);
      break;
    case "error":
      throw new ChatApiError((payload.detail as string) ?? "回答の生成中にエラーが発生しました。", 500);
    default:
      break;
  }
}
