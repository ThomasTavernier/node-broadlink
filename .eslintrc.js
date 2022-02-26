module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: ['eslint-plugin-import', '@typescript-eslint', 'prettier'],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'class-methods-use-this': 'off',
        'lines-between-class-members': 'off',
        'no-bitwise': 'off',
        'no-non-null-assertion': 'off',
        'prettier/prettier': 'error',
      },
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    {
      files: ['*.test.ts'],
      parserOptions: {
        project: ['./tsconfig.test.json'],
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
