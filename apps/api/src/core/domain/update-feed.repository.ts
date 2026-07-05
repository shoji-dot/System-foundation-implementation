import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationType } from "./regulation.entity";
import type { UpdateFeedItem } from "./update-feed-item.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaUpdateFeedRepository）。
 */
export const UPDATE_FEED_REPOSITORY = Symbol("UPDATE_FEED_REPOSITORY");

export interface UpdateFeedFilters {
  /** 指定日時より後に公開された版のみを対象とする（設計書⑤ ?since=）。未指定時は絞り込みなし。 */
  since?: Date;
  jurisdictionCode?: JurisdictionCode;
  type?: RegulationType;
  /** カーソルページネーション（設計書⑤）: 前回応答の nextCursor をそのまま渡す。 */
  cursor?: string;
  limit: number;
}

export interface UpdateFeedResult {
  items: UpdateFeedItem[];
  nextCursor: string | null;
}

/**
 * 設計書⑤ GET /api/v1/updates。PUBLISHED済みのregulation_versionsのみを対象とする
 * （draft/review中の版は取込レビューS20専用、一般公開しない。既存RegulationRepositoryと同じ方針）。
 */
export interface UpdateFeedRepository {
  /**
   * カーソルはid（UUIDv7、生成順に単調増加）によるキーセット方式（既存RegulationRepositoryと同じ方式）。
   * 取込〜レビュー〜公開までの所要時間は短い運用を想定するため、id生成順とpublishedAt順はほぼ一致する
   * 前提の簡易実装（公開までの遅延が大きくなる運用が生じた場合は、publishedAtベースの複合カーソルへの
   * 切替を将来検討する）。
   */
  findMany(filters: UpdateFeedFilters): Promise<UpdateFeedResult>;
}
