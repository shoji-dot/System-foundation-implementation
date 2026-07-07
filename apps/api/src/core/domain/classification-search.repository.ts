import type {
  ClassificationJurisdictionSummary,
  ClassificationScheme,
} from "./classification.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaClassificationSearchRepository）。
 * 設計書⑥「分類支援: 機器説明→JMDN/クラス候補提示（検索+LLM再ランク）」の「検索」段階に対応する。
 * device_classifications にembedding列は無いため、ClassificationRepository.findMany の
 * ?q=（部分一致）とは別に、pg_trgmのあいまい類似度で機器説明文とのshortlistを作る専用リポジトリとする
 * （RagSearchRepositoryがRegulationRepositoryと分離されているのと同じ方針）。
 */
export const CLASSIFICATION_SEARCH_REPOSITORY = Symbol("CLASSIFICATION_SEARCH_REPOSITORY");

export interface ClassificationSearchCandidate {
  id: string;
  scheme: ClassificationScheme;
  jurisdiction: ClassificationJurisdictionSummary;
  code: string;
  name: string;
  class: string | null;
  definition: string | null;
}

export interface ClassificationSearchRepository {
  /** 機器説明文とname/definitionのpg_trgm類似度順にshortlistを返す（LLM再ランク前の候補母集団）。 */
  searchByDeviceDescription(
    description: string,
    limit: number,
  ): Promise<ClassificationSearchCandidate[]>;
}
