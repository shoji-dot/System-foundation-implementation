import type { SystemRole } from "@yakuji/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CourseTable } from "@/features/courses/components/CourseTable";
import { CreateCourseForm } from "@/features/courses/components/CreateCourseForm";
import { listCourses } from "@/features/learning/api/courses";
import { listTags } from "@/features/tags/api/admin-tags";
import { CreateTagForm } from "@/features/tags/components/CreateTagForm";
import { TagTable } from "@/features/tags/components/TagTable";
import { auth } from "@/shared/auth/auth";

export const metadata: Metadata = {
  title: "コンテンツ管理 | 医療機器薬事承認支援アプリ",
};

/**
 * 設計書⑫ S21「管理: コンテンツ管理」のうちコース・タグ管理画面。ユーザー管理（/admin/users、ADMIN限定）
 * とは異なり editor/admin 限定とする（設計書⑦ RBAC、apps/api側 AdminCoursesController/TagsController と
 * 同方針）。コース一覧取得はS10と同一のGET /api/v1/coursesを再利用する（DRY）。
 */
const ALLOWED_ROLES: SystemRole[] = ["ADMIN", "EDITOR"];

interface AdminContentPageProps {
  searchParams: Promise<{ courseCursor?: string; tagCursor?: string }>;
}

export default async function AdminContentPage({ searchParams }: AdminContentPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (!ALLOWED_ROLES.includes(session.user.systemRole)) {
    notFound();
  }

  const { courseCursor, tagCursor } = await searchParams;
  const [courses, tags] = await Promise.all([
    listCourses(session.accessToken, { cursor: courseCursor }),
    listTags(session.accessToken, { cursor: tagCursor }),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-text">コンテンツ管理</h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          学習コースとタグの作成・編集・削除ができます。
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] font-semibold text-text">コース管理</h2>
        <CreateCourseForm />
        <CourseTable items={courses.items} />
        {courses.nextCursor ? (
          <Link
            href={`/admin/content?courseCursor=${encodeURIComponent(courses.nextCursor)}${
              tagCursor ? `&tagCursor=${encodeURIComponent(tagCursor)}` : ""
            }`}
            className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
          >
            次のページ
          </Link>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] font-semibold text-text">タグ管理</h2>
        <CreateTagForm />
        <TagTable items={tags.items} />
        {tags.nextCursor ? (
          <Link
            href={`/admin/content?tagCursor=${encodeURIComponent(tags.nextCursor)}${
              courseCursor ? `&courseCursor=${encodeURIComponent(courseCursor)}` : ""
            }`}
            className="inline-flex min-h-[44px] w-fit items-center rounded-sm border border-border px-4 text-[16px] font-medium text-text"
          >
            次のページ
          </Link>
        ) : null}
      </section>
    </main>
  );
}
