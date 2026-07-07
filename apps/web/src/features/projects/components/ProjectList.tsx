import type { ProjectResponse } from "@yakuji/shared";
import { JURISDICTION_LABELS } from "@yakuji/shared";
import Link from "next/link";

interface ProjectListProps {
  items: ProjectResponse[];
  nextCursor: string | null;
}

/** S15（プロジェクト一覧）の一覧表示部分。項目タップでS16（プロジェクト詳細）へ遷移する（設計書⑬）。 */
export function ProjectList({ items, nextCursor }: ProjectListProps) {
  if (items.length === 0) {
    return (
      <p className="text-[14px] text-text-secondary">プロジェクトはまだ作成されていません。</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {items.map((project) => (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              className="block min-h-[44px] rounded-lg bg-surface p-4 hover:opacity-90"
            >
              <p className="text-[16px] font-medium text-text">{project.name}</p>
              <p className="mt-1 text-[14px] text-text-secondary">
                {project.deviceClass ?? "未分類"}
                {project.targetJurisdictions.length > 0
                  ? ` ・ ${project.targetJurisdictions.map((code) => JURISDICTION_LABELS[code]).join("、")}`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <Link
          href={`/projects?cursor=${encodeURIComponent(nextCursor)}`}
          className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          次のページ
        </Link>
      ) : null}
    </div>
  );
}
