/**
 * タグ付け対象種別（設計書④ taggings のpolymorphic対象）。管理画面(S21)から編集可能な
 * lessonのみ今回実装する（regulation/classificationは編集画面が未実装のため対象外、ユーザー承認済み）。
 * LIFECYCLE_TEMPLATE は Phase7 7-2再設計（2026-07-10）で追加。工程マスタの「機器特性」
 * （SaMD/能動植込み等）をenum固定化せずtags/taggingsで表現するため（ユーザー承認済み）。
 */
export type TaggableType = "LESSON" | "LIFECYCLE_TEMPLATE";

/**
 * タグ付け（設計書④ taggings 準拠、polymorphic: regulation/lesson/classification）。
 */
export interface Tagging {
  id: string;
  tagId: string;
  taggableType: TaggableType;
  taggableId: string;
  createdAt: Date;
}
