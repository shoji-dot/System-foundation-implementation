import Link from "next/link";

import { LearningProgressWidget } from "@/features/dashboard/components/LearningProgressWidget";
import { ProjectsOverviewWidget } from "@/features/dashboard/components/ProjectsOverviewWidget";
import { UpdateFeedWidget } from "@/features/dashboard/components/UpdateFeedWidget";
import { getLearningProgressSummary } from "@/features/learning/api/progress";
import { listUpdateFeed } from "@/features/notifications/api/updates";
import { listProjects } from "@/features/projects/api/projects";
import { auth } from "@/shared/auth/auth";

/** 設計書⑫ S01（ランディング）: 価値提案・登録導線。未ログイン時に表示する。 */
function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-text">医療機器薬事承認支援アプリ</h1>
      <p className="max-w-md text-center text-text-secondary">
        医療機器の薬事承認業務を、法規制の検索・学習・実務支援で一気通貫にサポートします。
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-accent px-4 text-[16px] font-medium text-white"
        >
          新規登録
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
        >
          ログイン
        </Link>
      </div>
    </main>
  );
}

const DASHBOARD_WIDGET_LIMIT = 5;

/**
 * 設計書⑫ S04（ホーム/ダッシュボード）: 更新フィード・学習進捗・プロジェクト概況。
 * 3ウィジェットは互いに独立して取得し、1つが失敗しても他のウィジェットは表示できるようにする。
 */
async function HomeDashboard({ accessToken }: { accessToken: string }) {
  const [updatesResult, progressResult, projectsResult] = await Promise.allSettled([
    listUpdateFeed(accessToken, { limit: DASHBOARD_WIDGET_LIMIT }),
    getLearningProgressSummary(accessToken),
    listProjects(accessToken, { limit: DASHBOARD_WIDGET_LIMIT }),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-text">ホーム</h1>

      <UpdateFeedWidget
        items={updatesResult.status === "fulfilled" ? updatesResult.value.items : []}
        errorMessage={
          updatesResult.status === "rejected" ? "更新フィードの取得に失敗しました。" : null
        }
      />

      <LearningProgressWidget
        summary={progressResult.status === "fulfilled" ? progressResult.value : null}
        errorMessage={
          progressResult.status === "rejected" ? "学習進捗の取得に失敗しました。" : null
        }
      />

      <ProjectsOverviewWidget
        items={projectsResult.status === "fulfilled" ? projectsResult.value.items : []}
        errorMessage={
          projectsResult.status === "rejected" ? "プロジェクト概況の取得に失敗しました。" : null
        }
      />
    </main>
  );
}

/** 設計書⑬画面遷移: S01 ─ S02 ─ S03 ─ S04(ホーム)。ログイン済みならS04、未ログインならS01を表示する。 */
export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <LandingPage />;
  }

  return <HomeDashboard accessToken={session.accessToken} />;
}
