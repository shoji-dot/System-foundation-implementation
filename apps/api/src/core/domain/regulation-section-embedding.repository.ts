export const REGULATION_SECTION_EMBEDDING_REPOSITORY = Symbol(
  "REGULATION_SECTION_EMBEDDING_REPOSITORY",
);

export interface RegulationSectionForEmbedding {
  id: string;
  body: string;
}

/**
 * regulation_sections.embedding（設計書④ RAG・全文検索の単位、設計書⑥ RAGパイプライン）の
 * 読み書きに特化したリポジトリ。embedding列はPrisma schema上 Unsupported("vector(1536)") のため、
 * 通常のCourseRepository等とは分離し、実装はraw SQLで行う（PrismaRegulationSectionEmbeddingRepository）。
 */
export interface RegulationSectionEmbeddingRepository {
  /** embeddingが未生成のセクションを最大limit件返す（Worker cronでのバックフィル向け）。 */
  findManyWithoutEmbedding(limit: number): Promise<RegulationSectionForEmbedding[]>;
  /** 生成済み埋め込みベクトルを保存する。 */
  saveEmbedding(sectionId: string, embedding: number[]): Promise<void>;
}
