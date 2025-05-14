module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // Allow both JS and TS files
    '@typescript-eslint/no-var-requires': 'off',
    // Allow empty functions (useful for mocks)
    '@typescript-eslint/no-empty-function': 'off',
    // Allow any type for compatibility with existing code
    '@typescript-eslint/no-explicit-any': 'off',
    // Enforce consistent indentation
    'indent': ['error', 2],
    // Enforce semicolons
    'semi': ['error', 'always'],
    // Enforce single quotes
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
  },
  overrides: [
    {
      // Enable the rule specifically for TypeScript files
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['warn'],
      },
    },
  ],
};