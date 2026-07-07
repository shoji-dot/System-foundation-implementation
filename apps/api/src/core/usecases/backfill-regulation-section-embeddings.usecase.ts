import { Inject, Injectable, Logger } from "@nestjs/common";

import type { EmbeddingProvider } from "../domain/embedding-provider";
import { EMBEDDING_PROVIDER } from "../domain/embedding-provider";
import type { RegulationSectionEmbeddingRepository } from "../domain/regulation-section-embedding.repository";
import { REGULATION_SECTION_EMBEDDING_REPOSITORY } from "../domain/regulation-section-embedding.repository";

export interface BackfillRegulationSectionEmbeddingsResult {
  processedCount: number;
  failedCount: number;
}

/**
 * regulation_sectionsの埋め込みバックフィル（設計書⑥ RAGパイプライン準備、Workerのcronジョブ本体）。
 * 1回の実行で最大batchSize件のみ処理する（OpenAI APIのレート制限・ジョブタイムアウトを避けるため、
 * IngestionProcessorのような全件一括処理は行わない）。
 * 個別セクションの埋め込み生成が失敗しても他のセクション処理は継続し、失敗したセクションは
 * embeddingがnullのまま残るため次回cronで自動的に再試行対象になる（冪等でリトライ可能な設計）。
 */
@Injectable()
export class BackfillRegulationSectionEmbeddingsUsecase {
  private readonly logger = new Logger(BackfillRegulationSectionEmbeddingsUsecase.name);

  constructor(
    @Inject(REGULATION_SECTION_EMBEDDING_REPOSITORY)
    private readonly repository: RegulationSectionEmbeddingRepository,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async execute(batchSize: number): Promise<BackfillRegulationSectionEmbeddingsResult> {
    const sections = await this.repository.findManyWithoutEmbedding(batchSize);

    let processedCount = 0;
    const failedIds: string[] = [];

    for (const section of sections) {
      try {
        const embedding = await this.embeddingProvider.embed(section.body);
        if (embedding.length !== this.embeddingProvider.dimensions) {
          throw new Error(
            `embedding次元数が不正です（期待: ${this.embeddingProvider.dimensions}, 実際: ${embedding.length}）`,
          );
        }

        await this.repository.saveEmbedding(section.id, embedding);
        processedCount += 1;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        this.logger.warn(`セクション${section.id}の埋め込み生成に失敗しました: ${message}`);
        failedIds.push(section.id);
      }
    }

    if (failedIds.length > 0) {
      this.logger.warn(
        `埋め込みバックフィル: ${failedIds.length}件失敗（次回cronで自動的に再試行されます）: ${failedIds.join(", ")}`,
      );
    }

    return { processedCount, failedCount: failedIds.length };
  }
}
