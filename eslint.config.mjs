import eslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    files: ['**/*.ts'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/logs/**', '**/entity.ts'], // Ignore build and dependency folders
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
      // General Code Quality Rules
      'no-unused-vars': 'warn', // Disable base rule in favor of @typescript-eslint/no-unused-vars
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], // Allow unused variables starting with `_`
      '@typescript-eslint/no-explicit-any': 'warn', // Warn against using `any` type
      // '@typescript-eslint/explicit-function-return-type': 'warn', // Encourage explicit return types for functions
      // '@typescript-eslint/no-inferrable-types': 'warn', // Disallow explicit type declarations when they can be inferred
      // '@typescript-eslint/no-empty-function': 'warn', // Warn against empty functions

      // Style and Formatting Rules
      indent: ['error', 2], // Enforce 2-space indentation
      quotes: ['error', 'single'] // Enforce single quotes
      // 'object-curly-spacing': ['error', 'always'], // Enforce spaces inside curly braces
      // 'array-bracket-spacing': ['error', 'never'], // Disallow spaces inside array brackets
      // 'space-before-function-paren': ['error', 'never'], // No space before function parentheses
    }
  }
]
