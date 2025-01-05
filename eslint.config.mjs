import eslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    files: ['**/*.ts', '**/*.tsx'], // Specify which files to lint
    plugins: {
      '@typescript-eslint': eslint
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
