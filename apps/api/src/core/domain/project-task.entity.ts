/**
 * プロジェクトタスクドメインエンティティ（設計書④ project_tasks 準拠、⑫ S16 チェックリスト・タスク・期限）。
 * フレームワーク非依存（Prisma型に直接依存しない、設計書③の依存方向ルール）。
 * checklists マスタ（届出/認証/承認等の審査項目内容）は薬事の専門知識を要し、AIによる推測実装は誤った
 * 規制情報を生むリスクがあるため今回は作らず、title をユーザー自由入力の表示ラベルとして保持する
 * （ユーザー承認済み）。checklistItemRef は将来 checklists マスタと連携する際の参照用に予約する。
 */
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  checklistItemRef: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  assignee: string | null;
  createdAt: Date;
  updatedAt: Date;
}
