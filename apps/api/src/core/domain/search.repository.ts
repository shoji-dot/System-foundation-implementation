import type { SearchResultItem } from "./search-result.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaSearchRepository）。
 * 設計書⑩「将来必要時のみ検索エンジンを差替可能なよう search モジュールにリポジトリ抽象を置く」に対応する専用抽象。
 * regulations/classifications 個別のRepositoryは再利用せず、検索用途に特化した独自クエリを持つ。
 */
export const SEARCH_REPOSITORY = Symbol("SEARCH_REPOSITORY");

export type SearchScope = "all" | "regulation" | "jmdn" | "generic-name" | "learning";

export interface SearchFilters {
  /** 未指定時はscope内の全件（法令一覧等と同様、qは任意）。 */
  q?: string;
  scope: SearchScope;
  /** カーソルページネーション。scope=all では複数ソース横断の統一カーソルが未実装のため無視される（常にnextCursor: null）。 */
  cursor?: string;
  limit: number;
}

export interface SearchResult {
  items: SearchResultItem[];
  /** scope=all の場合は常に null（設計書⑩のRRF融合等の高度化実装時に対応予定）。 */
  nextCursor: string | null;
}

export interface SearchRepository {
  search(filters: SearchFilters): Promise<SearchResult>;
}
