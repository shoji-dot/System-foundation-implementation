import { OpenAiChatCompletionProvider } from "./openai-chat-completion.provider";

/** OpenAIのSSEレスポンス本文を模したReadableStreamを作る（1チャンクにまとめて渡す）。 */
function createMockSseStream(sse: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let consumed = false;

  return {
    getReader: () => ({
      read: () => {
        if (consumed) {
          return Promise.resolve({ done: true, value: undefined });
        }
        consumed = true;
        return Promise.resolve({ done: false, value: encoder.encode(sse) });
      },
    }),
  } as unknown as ReadableStream<Uint8Array>;
}

describe("OpenAiChatCompletionProvider", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  let provider: OpenAiChatCompletionProvider;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-api-key";
    provider = new OpenAiChatCompletionProvider();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    jest.restoreAllMocks();
  });

  it("streams tokens via onToken and returns the assembled full text", async () => {
    const sse = [
      'data: {"choices":[{"delta":{"content":"こん"}}]}',
      "",
      'data: {"choices":[{"delta":{"content":"にちは"}}]}',
      "",
      "data: [DONE]",
      "",
    ].join("\n");
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      body: createMockSseStream(sse),
    } as unknown as Response);

    const tokens: string[] = [];
    const result = await provider.streamComplete(
      [{ role: "user", content: "薬機法とは？" }],
      (token) => tokens.push(token),
    );

    expect(tokens).toEqual(["こん", "にちは"]);
    expect(result).toBe("こんにちは");
  });

  it("sends the configured model, messages, and stream flag to the API", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      body: createMockSseStream("data: [DONE]\n"),
    } as unknown as Response);
    const messages = [{ role: "user" as const, content: "薬機法とは？" }];

    await provider.streamComplete(messages, () => {});

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-api-key" }),
        body: JSON.stringify({ model: "gpt-4o-mini", messages, stream: true }),
      }),
    );
  });

  it("throws when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      provider.streamComplete([{ role: "user", content: "薬機法とは？" }], () => {}),
    ).rejects.toThrow("OPENAI_API_KEY");
  });

  it("throws when the API responds with a non-ok status", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
      text: () => Promise.resolve("internal error"),
    } as unknown as Response);

    await expect(
      provider.streamComplete([{ role: "user", content: "薬機法とは？" }], () => {}),
    ).rejects.toThrow(/status: 500/);
  });
});
