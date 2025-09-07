module.exports = {
    root: true,
    extends: [
      '@typescript-eslint/recommended',
      'prettier'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
    ignorePatterns: [
      'dist/',
      '.next/',
      'node_modules/',
      '*.js'
    ],
    env: {
      browser: true,
      node: true,
      es6: true,
    },
  };