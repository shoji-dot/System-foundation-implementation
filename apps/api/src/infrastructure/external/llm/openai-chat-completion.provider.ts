import { Injectable } from "@nestjs/common";

import type {
  ChatCompletionMessage,
  ChatCompletionProvider,
} from "../../../core/domain/chat-completion-provider";

interface OpenAiChatCompletionChunk {
  choices: { delta: { content?: string } }[];
}

/**
 * OpenAI Chat Completions APIによるChatCompletionProvider実装（設計書③ infrastructure/external/llm）。
 * モデルはgpt-4o-mini（コスト・レイテンシのバランス、ユーザー承認済みでOpenAI一本の構成を採用）。
 */
@Injectable()
export class OpenAiChatCompletionProvider implements ChatCompletionProvider {
  private static readonly API_URL = "https://api.openai.com/v1/chat/completions";
  private static readonly MODEL = "gpt-4o-mini";

  async streamComplete(
    messages: ChatCompletionMessage[],
    onToken: (token: string) => void,
  ): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY が設定されていません。");
    }

    const response = await fetch(OpenAiChatCompletionProvider.API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OpenAiChatCompletionProvider.MODEL,
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenAI Chat Completions APIの呼び出しに失敗しました（status: ${response.status}）: ${body}`,
      );
    }

    return this.consumeStream(response.body, onToken);
  }

  /**
   * OpenAIのSSE形式（`data: {...}\n\n`、終端`data: [DONE]`）をパースし、トークンごとに
   * onTokenを呼びながら全文を組み立てる。改行をまたぐ分割に備え、未確定行はbufferへ残す。
   */
  private async consumeStream(
    body: ReadableStream<Uint8Array>,
    onToken: (token: string) => void,
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const token = this.parseTokenFromLine(line);
        if (token) {
          fullText += token;
          onToken(token);
        }
      }
    }

    return fullText;
  }

  /** SSE1行から次トークンを抽出する。データ行でない/[DONE]/contentが無い場合はnullを返す。 */
  private parseTokenFromLine(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      return null;
    }

    const payload = trimmed.slice("data:".length).trim();
    if (payload === "[DONE]" || payload.length === 0) {
      return null;
    }

    const parsed = JSON.parse(payload) as OpenAiChatCompletionChunk;
    return parsed.choices[0]?.delta.content ?? null;
  }
}
