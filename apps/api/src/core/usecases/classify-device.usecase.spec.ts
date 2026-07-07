import type { AiChatQuotaLimiter } from "../domain/ai-chat-quota-limiter";
import type { ChatCompletionProvider } from "../domain/chat-completion-provider";
import type {
  ClassificationSearchCandidate,
  ClassificationSearchRepository,
} from "../domain/classification-search.repository";

import { ClassifyDeviceUsecase } from "./classify-device.usecase";

describe("ClassifyDeviceUsecase", () => {
  // shortlist[n] という添字アクセスは noUncheckedIndexedAccess 下では `| undefined` になるため、
  // テスト内では名前付き定数（destructuring由来、添字アクセスの対象外）で参照する。
  const endoscope: ClassificationSearchCandidate = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e01",
    scheme: "JMDN",
    jurisdiction: { code: "JP", name: "日本" },
    code: "35282000",
    name: "汎用電子内視鏡",
    class: "III",
    definition: "体腔内を観察するための電子内視鏡。",
  };
  const bloodPressureMonitor: ClassificationSearchCandidate = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e02",
    scheme: "JMDN",
    jurisdiction: { code: "JP", name: "日本" },
    code: "70260000",
    name: "汎用血圧計",
    class: "I",
    definition: "血圧を測定する機器。",
  };
  const shortlist: ClassificationSearchCandidate[] = [endoscope, bloodPressureMonitor];

  function setup() {
    const quotaLimiter: jest.Mocked<AiChatQuotaLimiter> = { consume: jest.fn() };
    const classificationSearchRepository: jest.Mocked<ClassificationSearchRepository> = {
      searchByDeviceDescription: jest.fn(),
    };
    const chatCompletionProvider: jest.Mocked<ChatCompletionProvider> = {
      streamComplete: jest.fn(),
    };

    quotaLimiter.consume.mockResolvedValue({ allowed: true, limit: 10, remaining: 9 });
    classificationSearchRepository.searchByDeviceDescription.mockResolvedValue(shortlist);

    const usecase = new ClassifyDeviceUsecase(
      quotaLimiter,
      classificationSearchRepository,
      chatCompletionProvider,
    );

    return { usecase, quotaLimiter, classificationSearchRepository, chatCompletionProvider };
  }

  it("throws 429 before searching/calling the LLM when the daily quota is exceeded", async () => {
    const { usecase, quotaLimiter, classificationSearchRepository, chatCompletionProvider } =
      setup();
    quotaLimiter.consume.mockResolvedValue({ allowed: false, limit: 10, remaining: 0 });

    await expect(
      usecase.execute({ userId: "u1", plan: "FREE", description: "内視鏡です" }),
    ).rejects.toMatchObject({ status: 429 });

    expect(classificationSearchRepository.searchByDeviceDescription).not.toHaveBeenCalled();
    expect(chatCompletionProvider.streamComplete).not.toHaveBeenCalled();
  });

  it("returns an empty array without calling the LLM when the pg_trgm shortlist is empty", async () => {
    const { usecase, classificationSearchRepository, chatCompletionProvider } = setup();
    classificationSearchRepository.searchByDeviceDescription.mockResolvedValue([]);

    const result = await usecase.execute({
      userId: "u1",
      plan: "FREE",
      description: "全く無関係な説明",
    });

    expect(result).toEqual([]);
    expect(chatCompletionProvider.streamComplete).not.toHaveBeenCalled();
  });

  it("maps the LLM's ranked indices back to the shortlisted classifications", async () => {
    const { usecase, chatCompletionProvider } = setup();
    chatCompletionProvider.streamComplete.mockImplementation(async (_messages, onToken) => {
      const json = JSON.stringify({
        candidates: [
          { index: 1, confidence: 0.9, reasoning: "内視鏡の説明と一致する。" },
          { index: 2, confidence: 1.5, reasoning: "血圧計の可能性も低いがある。" },
        ],
      });
      onToken(json);
      return json;
    });

    const result = await usecase.execute({
      userId: "u1",
      plan: "PRO",
      description: "体腔内を観察する機器",
    });

    expect(result).toEqual([
      {
        classificationId: endoscope.id,
        scheme: "JMDN",
        jurisdiction: { code: "JP", name: "日本" },
        code: "35282000",
        name: "汎用電子内視鏡",
        class: "III",
        definition: "体腔内を観察するための電子内視鏡。",
        confidence: 0.9,
        reasoning: "内視鏡の説明と一致する。",
      },
      {
        classificationId: bloodPressureMonitor.id,
        scheme: "JMDN",
        jurisdiction: { code: "JP", name: "日本" },
        code: "70260000",
        name: "汎用血圧計",
        class: "I",
        definition: "血圧を測定する機器。",
        confidence: 1, // 1.5はclampされ1.0になる
        reasoning: "血圧計の可能性も低いがある。",
      },
    ]);
  });

  it("strips a markdown code fence before parsing the LLM's JSON response", async () => {
    const { usecase, chatCompletionProvider } = setup();
    chatCompletionProvider.streamComplete.mockImplementation(async (_messages, onToken) => {
      const fenced = [
        "```json",
        JSON.stringify({
          candidates: [{ index: 1, confidence: 0.8, reasoning: "一致する。" }],
        }),
        "```",
      ].join("\n");
      onToken(fenced);
      return fenced;
    });

    const result = await usecase.execute({ userId: "u1", plan: "FREE", description: "内視鏡" });

    expect(result).toHaveLength(1);
    const [firstResult] = result;
    expect(firstResult?.classificationId).toBe(endoscope.id);
  });

  it("filters out invalid entries (out-of-range index, missing reasoning) while keeping valid ones", async () => {
    const { usecase, chatCompletionProvider } = setup();
    chatCompletionProvider.streamComplete.mockImplementation(async (_messages, onToken) => {
      const json = JSON.stringify({
        candidates: [
          { index: 99, confidence: 0.5, reasoning: "範囲外" },
          { index: 1, confidence: 0.7, reasoning: "" },
          { index: 2, confidence: 0.6, reasoning: "妥当な理由" },
        ],
      });
      onToken(json);
      return json;
    });

    const result = await usecase.execute({ userId: "u1", plan: "FREE", description: "説明" });

    expect(result).toEqual([
      expect.objectContaining({ classificationId: bloodPressureMonitor.id, confidence: 0.6 }),
    ]);
  });

  it("throws when the LLM response is not valid JSON", async () => {
    const { usecase, chatCompletionProvider } = setup();
    chatCompletionProvider.streamComplete.mockImplementation(async (_messages, onToken) => {
      onToken("これはJSONではありません");
      return "これはJSONではありません";
    });

    await expect(
      usecase.execute({ userId: "u1", plan: "FREE", description: "説明" }),
    ).rejects.toThrow("LLMの分類結果の解析に失敗しました");
  });
});
