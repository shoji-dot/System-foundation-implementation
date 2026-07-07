import type { ProjectResponse } from "@yakuji/shared";
import Link from "next/link";

interface ProjectsOverviewWidgetProps {
  items: ProjectResponse[];
  errorMessage: string | null;
}

/**
 * S04「プロジェクト概況」ウィジェット（設計書⑫、GET /api/v1/projects の最新n件）。
 * S15（プロジェクト一覧）実装済みのため「すべて見る」導線を持つ。項目タップでS16（プロジェクト詳細）へ
 * 遷移する（設計書⑬「S15 ─ S16」、ProjectListと同じ方針）。
 */
export function ProjectsOverviewWidget({ items, errorMessage }: ProjectsOverviewWidgetProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text">プロジェクト概況</h2>
        <Link
          href="/projects"
          className="min-h-[44px] content-center text-[14px] font-medium text-accent"
        >
          すべて見る
        </Link>
      </div>
      {errorMessage ? (
        <p className="text-[14px] text-danger">{errorMessage}</p>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-text-secondary">プロジェクトはまだ作成されていません。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((project) => (
            <li key={project.id} className="border-b border-border pb-3 last:border-none">
              <Link href={`/projects/${project.id}`} className="block min-h-[44px]">
                <p className="text-[14px] font-medium text-text">{project.name}</p>
                <p className="text-[13px] text-text-secondary">
                  {project.deviceClass ?? "未分類"}
                  {project.targetJurisdictions.length > 0
                    ? ` ・ ${project.targetJurisdictions.join(", ")}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
