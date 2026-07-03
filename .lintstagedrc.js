const path = require("node:path");

/**
 * ESLint Flat Config はカレントディレクトリ基準で eslint.config.js を解決するため、
 * lint-staged がリポジトリルートから実行しても各 apps/packages 配下の設定を
 * 正しく使えるよう、対象ファイルを所属パッケージ (apps/<name> または packages/<name>)
 * ごとにグルーピングし、`pnpm --dir <pkg>` 経由で ESLint を実行する。
 */
function eslintByPackage(filenames) {
  const groups = new Map();

  for (const file of filenames) {
    const rel = path.relative(process.cwd(), file);
    const parts = rel.split(path.sep);
    if (parts.length < 2 || (parts[0] !== "apps" && parts[0] !== "packages")) continue;

    const pkgDir = path.join(parts[0], parts[1]);
    if (!groups.has(pkgDir)) groups.set(pkgDir, []);
    groups.get(pkgDir).push(file);
  }

  return Array.from(groups.entries()).map(([pkgDir, files]) => {
    const quoted = files.map((f) => JSON.stringify(f)).join(" ");
    return `pnpm --dir ${pkgDir} exec eslint --fix --max-warnings=0 ${quoted}`;
  });
}

/** @type {import('lint-staged').Config} */
module.exports = {
  "apps/web/**/*.{ts,tsx}": eslintByPackage,
  "apps/api/**/*.ts": eslintByPackage,
  "packages/**/*.{ts,tsx}": eslintByPackage,
  "**/*.{json,md,yml,yaml}": ["prettier --write"],
};
