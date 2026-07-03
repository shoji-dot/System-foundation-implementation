/** @type {import('lint-staged').Config} */
module.exports = {
  "apps/web/**/*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "apps/api/**/*.ts": ["eslint --fix --max-warnings=0", "prettier --write"],
  "packages/**/*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "**/*.{json,md,yml,yaml}": ["prettier --write"],
};
