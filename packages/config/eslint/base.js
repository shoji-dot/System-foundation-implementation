// @ts-check
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

/**
 * ワークスペース共通の ESLint Flat Config ベース。
 * Next.js / NestJS 用の設定はこれを拡張する。
 *
 * NOTE: eslint-plugin-import は "local-import" キーで登録する。
 * "import" キーで登録すると、apps/web が利用する next/core-web-vitals
 * （内部で eslint-plugin-import を "import" キーで登録済み）と衝突し
 * ConfigError: Cannot redefine plugin "import" が発生するため。
 */
module.exports = tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.config.cjs",
      "**/*.config.js",
      "**/playwright-report/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  // NOTE: strict/stylistic プリセットは型情報依存ルールで誤検知・クラッシュが
  // 確認されたため、安定性を優先し recommended を採用する。
  ...tseslint.configs.recommended,
  {
    plugins: { "local-import": importPlugin },
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // @typescript-eslint/no-unused-vars と重複するため無効化（TS未対応の型検出漏れを防ぐ）
      "no-unused-vars": "off",
      "local-import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // NOTE: consistent-type-imports は型情報(parserOptions.project)を要求し、
      // ワークスペース全体(config/testファイル含む)への適用がPhase0の範囲を超えるため
      // 現時点では導入しない。型チェック済みlintの導入はPhase1以降で再検討する。
    },
  },
  prettier,
);
