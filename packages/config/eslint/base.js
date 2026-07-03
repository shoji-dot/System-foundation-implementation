// @ts-check
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

/**
 * ワークスペース共通の ESLint Flat Config ベース。
 * Next.js / NestJS 用の設定はこれを拡張する。
 */
module.exports = tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: { import: importPlugin },
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "import/order": [
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
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  prettier,
);
