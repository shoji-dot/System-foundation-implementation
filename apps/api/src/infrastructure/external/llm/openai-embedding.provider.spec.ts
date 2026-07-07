import { OpenAiEmbeddingProvider } from "./openai-embedding.provider";

describe("OpenAiEmbeddingProvider", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  let provider: OpenAiEmbeddingProvider;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-api-key";
    provider = new OpenAiEmbeddingProvider();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    jest.restoreAllMocks();
  });

  it("declares 1536 dimensions to match the Prisma vector(1536) column", () => {
    expect(provider.dimensions).toBe(1536);
  });

  it("returns the embedding vector from the OpenAI response", async () => {
    const embedding = [0.1, 0.2, 0.3];
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [{ embedding }] }),
    } as unknown as Response);

    const result = await provider.embed("医療機器の製造販売承認について");

    expect(result).toEqual(embedding);
  });

  it("sends the configured model and input text to the OpenAI Embeddings API", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [{ embedding: [0.1] }] }),
    } as unknown as Response);

    await provider.embed("薬機法");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/embeddings",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-api-key" }),
        body: JSON.stringify({ model: "text-embedding-3-small", input: "薬機法" }),
      }),
    );
  });

  it("throws when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(provider.embed("薬機法")).rejects.toThrow("OPENAI_API_KEY");
  });

  it("throws when the API responds with a non-ok status", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("invalid api key"),
    } as unknown as Response);

    await expect(provider.embed("薬機法")).rejects.toThrow(/status: 401/);
  });

  it("throws when the response does not contain an embedding", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
    } as unknown as Response);

    await expect(provider.embed("薬機法")).rejects.toThrow("embedding");
  });
});
