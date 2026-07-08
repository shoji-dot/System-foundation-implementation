import { Inject, Injectable, Logger } from "@nestjs/common";

import type { IngestionJob } from "../domain/ingestion-job.entity";
import type { IngestionJobRepository } from "../domain/ingestion-job.repository";
import { INGESTION_JOB_REPOSITORY } from "../domain/ingestion-job.repository";
import type { RegulationIngestionRepository } from "../domain/regulation-ingestion.repository";
import { REGULATION_INGESTION_REPOSITORY } from "../domain/regulation-ingestion.repository";
import type { RegulatorySource, SourceListItem } from "../domain/regulatory-source";

type ItemOutcome = "created" | "updated" | "unchanged" | "skipped";

/** fetchDocument呼び出し間の待機時間（ミリ秒）。取込先サーバーへの配慮として最小限のポリテネスを設ける。 */
const FETCH_INTERVAL_MS = 500;

/**
 * 薬事情報取込パイプライン ユースケース（設計書⑨）。
 * fetchList → (発出年月日が解釈できた項目のみ) fetchDocument → normalize →
 * doc_number+ハッシュ比較 → 新規ならcreateWithDraftVersion、変更ありならappendDraftVersion、
 * 変更なしならスキップ、という設計書⑨の逐次パイプラインをそのまま実装する。
 *
 * AI差分要約（設計書⑥）はPhase3として保留中のため、changeSummaryは非AIの簡易生成
 * （行数・文字数の差分）で代用する（要ユーザー確認済み）。
 *
 * 既知の制約: fetchListが返す全項目を毎回fetchDocumentする（設計書⑨の記述に忠実な実装）。
 * PMDA一覧は現状120件程度だが、件数増加時は取込元サーバーへの負荷を考慮し、
 * 既知sourceDocIdのスキップ等の最適化を別コミットで検討すること。
 *
 * 2026-07-08: 複数Adapter対応（US Adapter追加）にあわせ、対象のRegulatorySourceを
 * コンストラクタ注入からexecute()の引数に変更した（1つのusecaseインスタンスを
 * IngestionProcessorが全Adapterで使い回せるようにするため。設計書⑨「国追加=Adapter追加のみ」）。
 */
@Injectable()
export class RunIngestionJobUsecase {
  private readonly logger = new Logger(RunIngestionJobUsecase.name);

  constructor(
    @Inject(INGESTION_JOB_REPOSITORY)
    private readonly ingestionJobRepository: IngestionJobRepository,
    @Inject(REGULATION_INGESTION_REPOSITORY)
    private readonly regulationIngestionRepository: RegulationIngestionRepository,
  ) {}

  async execute(source: RegulatorySource): Promise<IngestionJob> {
    const job = await this.ingestionJobRepository.create({
      source: source.sourceId,
      status: "RUNNING",
      runAt: new Date(),
    });

    try {
      const items = await source.fetchList();
      const counters: Record<ItemOutcome, number> = {
        created: 0,
        updated: 0,
        unchanged: 0,
        skipped: 0,
      };

      for (const item of items) {
        const outcome = await this.processItem(source, item);
        counters[outcome] += 1;
        await this.sleep(FETCH_INTERVAL_MS);
      }

      const diffSummary =
        `新規: ${counters.created}件、更新: ${counters.updated}件、` +
        `変更なし: ${counters.unchanged}件、スキップ: ${counters.skipped}件`;

      return await this.ingestionJobRepository.update(job.id, {
        status: "SUCCEEDED",
        diffSummary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`取込ジョブが失敗しました（source: ${source.sourceId}）: ${message}`);
      return this.ingestionJobRepository.update(job.id, {
        status: "FAILED",
        errorMessage: message,
      });
    }
  }

  private async processItem(source: RegulatorySource, item: SourceListItem): Promise<ItemOutcome> {
    if (!item.issuedAt) {
      this.logger.warn(`発出年月日を解釈できなかったためスキップします: ${item.sourceUrl}`);
      return "skipped";
    }

    const document = await source.fetchDocument(item);
    const normalized = await source.normalize(item, document);

    const existing = await this.regulationIngestionRepository.findLatestByDocNumber(
      normalized.jurisdiction,
      normalized.docNumber,
    );

    if (!existing) {
      await this.regulationIngestionRepository.createWithDraftVersion({
        jurisdictionCode: normalized.jurisdiction,
        type: normalized.type,
        subtype: normalized.subtype,
        title: normalized.title,
        docNumber: normalized.docNumber,
        effectiveDate: item.issuedAt,
        sourceUrl: normalized.sourceUrl,
        fullText: normalized.fullText,
      });
      return "created";
    }

    if (existing.latestFullText === normalized.fullText) {
      return "unchanged";
    }

    await this.regulationIngestionRepository.appendDraftVersion({
      regulationId: existing.regulationId,
      versionNo: existing.latestVersionNo + 1,
      title: normalized.title,
      subtype: normalized.subtype,
      type: normalized.type,
      effectiveDate: item.issuedAt,
      sourceUrl: normalized.sourceUrl,
      fullText: normalized.fullText,
      changeSummary: this.buildChangeSummary(existing.latestFullText, normalized.fullText),
    });
    return "updated";
  }

  /** 非AIの簡易差分要約（設計書⑥のAI要約はPhase3として保留中のため代用、要ユーザー確認済み）。 */
  private buildChangeSummary(oldText: string, newText: string): string {
    const countLines = (text: string): number =>
      text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;

    return (
      `本文の変更を検出しました（行数: ${countLines(oldText)}→${countLines(newText)}、` +
      `文字数: ${oldText.length}→${newText.length}）。`
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
