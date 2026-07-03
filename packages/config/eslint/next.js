// @ts-check
const base = require("./base");

/**
 * apps/web (Next.js 15) 用 ESLint Flat Config。
 */
module.exports = [
  ...base,
  {
    rules: {
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
];
