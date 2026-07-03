// @ts-check
const base = require("./base");

/**
 * apps/api (NestJS) 用 ESLint Flat Config。
 *
 * NestJS は `emitDecoratorMetadata` (design:paramtypes) によるコンストラクタ注入(DI)を
 * 多用するため、注入対象クラスは値としてインポートされている必要がある。
 * `@typescript-eslint/consistent-type-imports` の自動修正で `import type`化されると
 * 実行時にメタデータが失われ DI が壊れるため、本パッケージでは無効化する。
 */
module.exports = [
  ...base,
  {
    rules: {
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];
