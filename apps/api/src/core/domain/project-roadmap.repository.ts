import type {
  ProjectRoadmapDetail,
  ProjectRoadmapStep,
  ProjectRoadmapStepDetail,
  RoadmapStepStatus,
} from "./project-roadmap.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaProjectRoadmapRepository）。
 */
export const PROJECT_ROADMAP_REPOSITORY = Symbol("PROJECT_ROADMAP_REPOSITORY");

export interface GenerateProjectRoadmapInput {
  projectId: string;
  templateId: string;
  generatedAt: Date;
  /**
   * 複製元テンプレートのstep id一覧（順序保持）。呼び出し元usecaseが
   * LifecycleTemplateRepository.findPublishedDetailByIdで取得済みのstepsから渡す
   * （本リポジトリはlifecycle_templatesの公開判定を再度行わない、layer分担の維持）。
   */
  templateStepIds: string[];
}

/** PATCH /projects/:id/roadmap/steps/:stepId 入力（進捗・期日・担当更新）。undefinedのフィールドは更新しない。 */
export interface UpdateProjectRoadmapStepInput {
  status?: RoadmapStepStatus;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  assigneeId?: string | null;
}

export interface ProjectRoadmapRepository {
  /**
   * テンプレートの全stepをそのままprojectへ複製してロードマップを生成する（設計変更書③
   * POST /projects/:id/roadmap、AI補完はPR②-2で追加）。対象プロジェクトに既にロードマップが存在する場合
   * （projectIdのunique制約準拠、レース対策の防御的再チェック含む）はnullを返す。
   */
  create(input: GenerateProjectRoadmapInput): Promise<ProjectRoadmapDetail | null>;
  /**
   * 設計変更書③ GET /projects/:id/roadmap（工程一覧込み）。存在しない場合はnull。
   * プロジェクトの所有者確認は呼び出し元のユースケースでProjectRepository.findByIdForUserにより行う。
   */
  findDetailByProjectId(projectId: string): Promise<ProjectRoadmapDetail | null>;
  /**
   * 指定ロードマップに属するstepをidで取得する（PATCH /projects/:id/roadmap/steps/:stepId の所有権確認、
   * ProjectTaskRepository.findByIdForProjectと同じ方針）。他ロードマップのstep、または存在しない場合はnull。
   */
  findStepByIdForRoadmap(stepId: string, roadmapId: string): Promise<ProjectRoadmapStep | null>;
  /** 設計変更書③ PATCH /projects/:id/roadmap/steps/:stepId（進捗・期日・担当更新）。 */
  updateStep(
    stepId: string,
    input: UpdateProjectRoadmapStepInput,
  ): Promise<ProjectRoadmapStepDetail>;
  /**
   * ユーザーが所有するプロジェクトに紐づくロードマップの総数（設計変更書⑥エンタイトルメント:
   * PROプラン「生成・保存3件」上限の判定用）。
   */
  countForUser(userId: string): Promise<number>;
}
