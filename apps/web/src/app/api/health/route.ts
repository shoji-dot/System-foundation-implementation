import { NextResponse } from "next/server";

import { healthResponseSchema } from "@yakuji/shared";

/**
 * Vercel 側 (BFF) 起動確認用ヘルスチェック。
 * Phase 0 「初回起動確認」の対象エンドポイント。
 */
export function GET() {
  const body = healthResponseSchema.parse({
    status: "ok",
    service: "web",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(body);
}
