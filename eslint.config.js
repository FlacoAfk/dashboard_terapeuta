const globals = require('globals');

module.exports = [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/dist-electron/**',
            '**/dist-web/**',
            '**/coverage/**',
            '**/.git/**'
        ]
    },
    {
        files: ['backend/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-undef': 'error'
        }
    },
    {
        files: ['frontend/**/*.js', 'frontend/**/*.jsx'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        rules: {
            'no-unused-vars': 'off',
            'no-undef': 'error'
        }
    }
];
