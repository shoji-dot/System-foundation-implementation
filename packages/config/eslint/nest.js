// @ts-check
const base = require("./base");

/**
 * apps/api (NestJS) 用 ESLint Flat Config。
 */
module.exports = [
  ...base,
  {
    rules: {
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
];
