/**
 * リポジトリと同様、外部プロバイダもインターフェースを domain 側に定義する（設計書③、DIP）。
 * 実装は infrastructure/external/llm 配下（OpenAiChatCompletionProvider）。
 * 設計書⑤ POST /api/v1/ai/chat のSSEストリーミング・設計書⑥ RAGパイプラインで利用する
 * （次コミットのchat API実装で使用、本コミットではプロバイダ層のみ）。
 */
export const CHAT_COMPLETION_PROVIDER = Symbol("CHAT_COMPLETION_PROVIDER");

export type ChatCompletionRole = "system" | "user" | "assistant";

export interface ChatCompletionMessage {
  role: ChatCompletionRole;
  content: string;
}

export interface ChatCompletionProvider {
  /**
   * ストリーミング生成。トークンを受信するたびにonTokenを呼び、完了時に組み立てた全文を返す。
   * SSEレスポンス（設計書⑤）はusecase側でonTokenの呼び出しをそのままイベントとして中継する想定。
   */
  streamComplete(
    messages: ChatCompletionMessage[],
    onToken: (token: string) => void,
  ): Promise<string>;
}
