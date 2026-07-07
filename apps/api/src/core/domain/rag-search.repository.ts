import type { AiChatCitation } from "./ai-chat.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaRagSearchRepository）。
 * 設計書⑥ RAGパイプライン「ハイブリッド検索（pgvector cos類似 + pg全文検索、RRF融合）」に対応する。
 * 日本語のあいまい全文検索は schema.prisma 記載の方針（pg_trgm）に準拠し、to_tsvector系は用いない。
 */
export const RAG_SEARCH_REPOSITORY = Symbol("RAG_SEARCH_REPOSITORY");

export interface RagSearchHit {
  sectionId: string;
  body: string;
  citation: AiChatCitation;
}

export interface RagSearchRepository {
  /**
   * PUBLISHED版のregulation_sectionsのみを対象に、ベクトル類似検索とpg_trgmあいまい検索を
   * それぞれ実行しRRF（Reciprocal Rank Fusion）で統合した上位topK件を返す。
   */
  hybridSearch(query: string, queryEmbedding: number[], topK: number): Promise<RagSearchHit[]>;
}
