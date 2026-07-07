/**
 * リポジトリと同様、外部プロバイダもインターフェースを domain 側に定義する（設計書③、DIP）。
 * 実装は infrastructure/external/llm 配下（OpenAiEmbeddingProvider）。
 * 設計書⑥「埋め込み: 多言語対応モデル…生成: LLM APIをプロバイダ抽象化層経由で利用し、モデル差替可能」に
 * 準拠し、usecase/repositoryは本インターフェースのみに依存する。
 */
export const EMBEDDING_PROVIDER = Symbol("EMBEDDING_PROVIDER");

export interface EmbeddingProvider {
  /** 埋め込みベクトルの次元数。Prisma schema の regulation_sections.embedding vector(1536) と一致させる。 */
  readonly dimensions: number;
  /** 指定テキストの埋め込みベクトルを取得する（設計書⑥ RAGパイプライン、regulation_sections単位）。 */
  embed(text: string): Promise<number[]>;
}
