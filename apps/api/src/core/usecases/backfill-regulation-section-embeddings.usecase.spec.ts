import type { EmbeddingProvider } from "../domain/embedding-provider";
import type { RegulationSectionEmbeddingRepository } from "../domain/regulation-section-embedding.repository";

import { BackfillRegulationSectionEmbeddingsUsecase } from "./backfill-regulation-section-embeddings.usecase";

describe("BackfillRegulationSectionEmbeddingsUsecase", () => {
  function setup() {
    const repository: jest.Mocked<RegulationSectionEmbeddingRepository> = {
      findManyWithoutEmbedding: jest.fn(),
      saveEmbedding: jest.fn(),
    };
    const embeddingProvider: jest.Mocked<EmbeddingProvider> = {
      dimensions: 3,
      embed: jest.fn(),
    };
    const usecase = new BackfillRegulationSectionEmbeddingsUsecase(repository, embeddingProvider);
    return { usecase, repository, embeddingProvider };
  }

  it("embeds and saves every section without an existing embedding", async () => {
    const { usecase, repository, embeddingProvider } = setup();
    repository.findManyWithoutEmbedding.mockResolvedValue([
      { id: "section-1", body: "第1条 本文" },
      { id: "section-2", body: "第2条 本文" },
    ]);
    embeddingProvider.embed.mockResolvedValue([0.1, 0.2, 0.3]);

    const result = await usecase.execute(50);

    expect(repository.findManyWithoutEmbedding).toHaveBeenCalledWith(50);
    expect(embeddingProvider.embed).toHaveBeenCalledWith("第1条 本文");
    expect(embeddingProvider.embed).toHaveBeenCalledWith("第2条 本文");
    expect(repository.saveEmbedding).toHaveBeenCalledWith("section-1", [0.1, 0.2, 0.3]);
    expect(repository.saveEmbedding).toHaveBeenCalledWith("section-2", [0.1, 0.2, 0.3]);
    expect(result).toEqual({ processedCount: 2, failedCount: 0 });
  });

  it("continues processing remaining sections when one embedding call fails", async () => {
    const { usecase, repository, embeddingProvider } = setup();
    repository.findManyWithoutEmbedding.mockResolvedValue([
      { id: "section-1", body: "第1条 本文" },
      { id: "section-2", body: "第2条 本文" },
    ]);
    embeddingProvider.embed
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValueOnce([0.1, 0.2, 0.3]);

    const result = await usecase.execute(50);

    expect(repository.saveEmbedding).toHaveBeenCalledTimes(1);
    expect(repository.saveEmbedding).toHaveBeenCalledWith("section-2", [0.1, 0.2, 0.3]);
    expect(result).toEqual({ processedCount: 1, failedCount: 1 });
  });

  it("treats a dimension mismatch as a failure and does not save it", async () => {
    const { usecase, repository, embeddingProvider } = setup();
    repository.findManyWithoutEmbedding.mockResolvedValue([
      { id: "section-1", body: "第1条 本文" },
    ]);
    embeddingProvider.embed.mockResolvedValue([0.1, 0.2]); // dimensions=3 expected

    const result = await usecase.execute(50);

    expect(repository.saveEmbedding).not.toHaveBeenCalled();
    expect(result).toEqual({ processedCount: 0, failedCount: 1 });
  });

  it("returns zero counts when there is nothing to backfill", async () => {
    const { usecase, repository, embeddingProvider } = setup();
    repository.findManyWithoutEmbedding.mockResolvedValue([]);

    const result = await usecase.execute(50);

    expect(embeddingProvider.embed).not.toHaveBeenCalled();
    expect(result).toEqual({ processedCount: 0, failedCount: 0 });
  });
});
