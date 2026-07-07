import type { Tag } from "./tag.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaTagRepository）。
 */
export const TAG_REPOSITORY = Symbol("TAG_REPOSITORY");

export interface CreateTagInput {
  name: string;
}

export interface UpdateTagInput {
  name: string;
}

/** タグ一覧のカーソルページネーション入力（設計書⑫、他一覧APIと同様の方式）。 */
export interface ListTagsFilters {
  cursor?: string;
  limit: number;
}

export interface TagListResult {
  items: Tag[];
  nextCursor: string | null;
}

export interface TagRepository {
  create(input: CreateTagInput): Promise<Tag>;
  list(filters: ListTagsFilters): Promise<TagListResult>;
  findById(id: string): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  update(id: string, input: UpdateTagInput): Promise<Tag>;
  delete(id: string): Promise<void>;
}
