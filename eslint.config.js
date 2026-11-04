export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { impliedStrict: true },
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // Core correctness / hygiene
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-implicit-coercion': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-unused-expressions': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': 'error',
      'dot-notation': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'no-useless-catch': 'error',
      'no-async-promise-executor': 'error',
      'spaced-comment': ['error', 'always', { exceptions: ['#'] }],
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      'no-irregular-whitespace': 'error',
      'no-prototype-builtins': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'event', message: 'Use the request object instead.' },
      ],
    },
  },
  {
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      '.git',
      'prisma/migrations/**',
      'vitest.config.*',
    ],
  },
];
