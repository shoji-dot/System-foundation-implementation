import type { Tag } from "./tag.entity";
import type { Tagging, TaggableType } from "./tagging.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaTaggingRepository）。
 */
export const TAGGING_REPOSITORY = Symbol("TAGGING_REPOSITORY");

export interface CreateTaggingInput {
  tagId: string;
  taggableType: TaggableType;
  taggableId: string;
}

export interface TaggingRepository {
  create(input: CreateTaggingInput): Promise<Tagging>;
  exists(tagId: string, taggableType: TaggableType, taggableId: string): Promise<boolean>;
  delete(tagId: string, taggableType: TaggableType, taggableId: string): Promise<void>;
  /**
   * 対象に付与されているタグの一覧をTag実体として返す（一覧画面ではタグ名が必要なため、
   * taggingsとtagsのJOINをリポジトリ内で行う。取込レビュー一覧のjurisdiction同梱と同様の方針）。
   */
  listTagsForTaggable(taggableType: TaggableType, taggableId: string): Promise<Tag[]>;
}
