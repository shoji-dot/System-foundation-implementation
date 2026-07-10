// 工程マスタ初期データ v0.2 投入スクリプト（ローカル開発環境向け）
// 使い方: 下記「実行手順」を参照。API_BASE/ADMIN_EMAIL/ADMIN_PASSWORD は環境変数で渡す。
//
//   $env:API_BASE="http://localhost:3001/api/v1"
//   $env:ADMIN_EMAIL="xxx@example.com"
//   $env:ADMIN_PASSWORD="xxxxxxxx"
//   node ingest-lifecycle-templates.mjs ./lifecycle-templates.json
//
// 動作: ログイン→ 未投入の9テンプレートのみPOST（既存の同一条件テンプレートはスキップ）→ 結果一覧を表示。
// publishは行わない（S22管理画面で目視確認の上、手動publishする設計）。

const API_BASE = process.env.API_BASE ?? "http://localhost:3001/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JSON_PATH = process.argv[2] ?? "./lifecycle-templates.json";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL / ADMIN_PASSWORD 環境変数が未設定です。");
  process.exit(1);
}

const fs = await import("node:fs/promises");

async function main() {
  const raw = await fs.readFile(JSON_PATH, "utf-8");
  const { templates } = JSON.parse(raw);

  console.log(`ログイン中... (${API_BASE})`);
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error(`ログイン失敗: ${loginRes.status} ${await loginRes.text()}`);
    process.exit(1);
  }
  const { accessToken } = await loginRes.json();
  console.log("ログイン成功。");

  console.log("既存の工程マスタを確認中...");
  const existingRes = await fetch(`${API_BASE}/admin/lifecycle-templates?limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!existingRes.ok) {
    console.error(`一覧取得失敗: ${existingRes.status} ${await existingRes.text()}`);
    process.exit(1);
  }
  const existing = await existingRes.json();
  const existingKeys = new Set(
    existing.items.map((t) =>
      [t.jurisdiction.code, t.framework, t.deviceClass, t.productNovelty, t.approvalRoute, [...t.characteristics].sort().join(",")].join("|"),
    ),
  );
  console.log(`既存テンプレート ${existing.items.length} 件。`);

  const results = [];
  for (const [i, t] of templates.entries()) {
    const key = [t.jurisdiction, t.framework, t.deviceClass, t.productNovelty, t.approvalRoute, [...t.characteristics].sort().join(",")].join("|");
    if (existingKeys.has(key)) {
      console.log(`[${i + 1}/9] SKIP（既存）: ${key}`);
      results.push({ index: i + 1, key, status: "skipped" });
      continue;
    }

    const res = await fetch(`${API_BASE}/admin/lifecycle-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(t),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[${i + 1}/9] FAILED: ${key}\n  ${res.status} ${body}`);
      results.push({ index: i + 1, key, status: "failed", detail: body });
      continue;
    }

    const created = await res.json();
    console.log(`[${i + 1}/9] OK: id=${created.id} ${key}`);
    results.push({ index: i + 1, key, status: "created", id: created.id });
  }

  console.log("\n=== 結果サマリ ===");
  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;
  console.log(`作成: ${created} / スキップ: ${skipped} / 失敗: ${failed}`);
  if (failed > 0) {
    console.log("失敗したテンプレート:");
    results.filter((r) => r.status === "failed").forEach((r) => console.log(`  - ${r.key}: ${r.detail}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
