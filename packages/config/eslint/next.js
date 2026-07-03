// @ts-check
const { FlatCompat } = require("@eslint/eslintrc");

const base = require("./base");

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * apps/web (Next.js 15) 用 ESLint Flat Config。
 * next/core-web-vitals（React Hooks / jsx-a11y / Next.js推奨ルール）を適用する。
 *
 * NOTE: compat.extends() の翻訳結果を先に、base（TS parser/rules）を後に置く。
 * 順序が逆だと base で設定した @typescript-eslint/parser が意図せず上書きされ、
 * 型注釈のみで使用する import が誤って unused 判定されることを確認したため。
 */
module.exports = [
  ...compat.extends("next/core-web-vitals"),
  ...base,
  {
    rules: {
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
];
