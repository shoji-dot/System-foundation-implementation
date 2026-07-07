import type { ClassificationJurisdictionSummary, ClassificationScheme } from "./classification.entity";

/**
 * 分類候補ドメインエンティティ（設計書⑤⑥ POST /api/v1/ai/classify「機器概要→候補分類提示」）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * pg_trgmによる候補絞り込み結果をLLMが再ランクした最終結果を表す（設計書⑥「検索+LLM再ランク」）。
 */
export interface ClassificationCandidate {
  classificationId: string;
  scheme: ClassificationScheme;
  jurisdiction: ClassificationJurisdictionSummary;
  code: string;
  name: string;
  class: string | null;
  definition: string | null;
  /** LLMによる確信度（0.0〜1.0）。 */
  confidence: number;
  /** LLMによる選定理由（根拠の明示、chatの出典表示と同じ「根拠なき断定を避ける」方針）。 */
  reasoning: string;
}
