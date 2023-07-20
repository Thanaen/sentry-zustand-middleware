module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest'],
  root: true,
  env: {
    node: true,
    amd: true,
  },
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
};
