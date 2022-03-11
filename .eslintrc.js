/* eslint-disable quote-props */

'use strict'

const svgPresentationAttributes = [
  'alignment-baseline', 'baseline-shift', 'class', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolatio', 'color-interpolatio-filters', 'color-profile', 'color-rendering', 'cursor', 'direction', 'display', 'dominant-baseline', 'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering', 'kerning', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'opacity', 'overflow', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'transform', 'transform-origin', 'unicode-bidi', 'vector-effect', 'visibility', 'word-spacing', 'writing-mod',
]

module.exports = {
  root: true,
  extends: ['transloadit'],
  env: {
    es6: true,
    jest: true,
    node: true,
    // extra:
    browser: true,
  },
  globals: {
    globalThis: true,
    hexo: true,
    window: true,
  },
  plugins: [
    '@babel/eslint-plugin',
    'jest',
    'markdown',
    'node',
    'prefer-import',
    'promise',
    'react',
    // extra:
    'compat',
    'jsdoc',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // transloadit rules we are actually ok with in the uppy repo
    'import/extensions': 'off',
    'object-shorthand': ['error', 'always'],
    'strict': 'off',
    'key-spacing': 'off',

    // rules we want to enforce
    'array-callback-return': 'error',
    'implicit-arrow-linebreak': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-extraneous-dependencies': 'error',
    'max-len': 'error',
    'no-empty': 'error',
    'no-bitwise': 'error',
    'no-continue': 'error',
    'no-lonely-if': 'error',
    'no-nested-ternary': 'error',
    'no-restricted-properties': 'error',
    'no-return-assign': 'error',
    'no-underscore-dangle': 'error',
    'no-unused-expressions': 'error',
    'no-unused-vars': 'error',
    'no-useless-concat': 'error',
    'no-var': 'error',
    'node/handle-callback-err': 'error',
    'prefer-destructuring': 'error',
    'prefer-spread': 'error',

    // transloadit rules we would like to enforce in the future
    // but will require separate PRs to gradually get there
    // and so the meantime: just warn
    'class-methods-use-this': ['warn'],
    'consistent-return': ['warn'],
    'default-case': ['warn'],
    'global-require': ['warn'],
    'import/no-unresolved': ['warn'],
    'import/order': ['warn'],
    'max-classes-per-file': ['warn'],
    'no-mixed-operators': ['warn'],
    'no-param-reassign': ['warn'],
    'no-redeclare': ['warn'],
    'no-shadow': ['warn'],
    'no-use-before-define': ['warn', { 'functions': false }],
    'radix': ['warn'],
    'react/button-has-type': 'error',
    'react/destructuring-assignment': ['warn'],
    'react/forbid-prop-types': 'error',
    'react/jsx-props-no-spreading': ['warn'],
    'react/no-access-state-in-setstate': 'error',
    'react/no-array-index-key': 'error',
    'react/no-deprecated': 'error',
    'react/no-this-in-sfc': 'error',
    'react/no-will-update-set-state': 'error',
    'react/prefer-stateless-function': 'error',
    'react/sort-comp': 'error',
    'react/style-prop-object': 'error',
    'react/no-unknown-property': ['error', {
      ignore: svgPresentationAttributes,
    }],

    // accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/control-has-associated-label': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/media-has-caption': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',

    // compat
    'compat/compat': ['error'],

    // jsdoc
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-examples': 'off', // cannot yet be supported for ESLint 8, see https://github.com/eslint/eslint/issues/14745
    'jsdoc/check-param-names': ['warn'],
    'jsdoc/check-syntax': ['warn'],
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/newline-after-description': 'error',
    'jsdoc/valid-types': 'error',
    'jsdoc/check-indentation': ['off'],
  },

  settings: {
    'import/core-modules': ['tsd'],
    react: {
      pragma: 'h',
    },
    jsdoc: {
      mode: 'typescript',
    },
    polyfills: [
      'Promise',
      'fetch',
      'Object.assign',
      'document.querySelector',
    ],
  },

  overrides: [
    {
      files: [
        '*.mjs',
        'examples/aws-presigned-url/*.js',
        'private/dev/*.js',
        'private/release/*.js',
        'private/remark-lint-uppy/*.js',
      ],
      parserOptions: {
        sourceType: 'module',
      },
    },
    {
      files: [
        'packages/@uppy/*/src/**/*.jsx',
        'packages/uppy/src/**/*.jsx',
      ],
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      files: [
        // Packages that have switched to ESM sources:
        'packages/@uppy/audio/src/**/*.js',
        'packages/@uppy/compressor/src/**/*.js',
        'packages/@uppy/vue/src/**/*.js',
      ],
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          jsx: false,
        },
      },
      rules: {
        'no-restricted-globals': [
          'error',
          {
            name: '__filename',
            message: 'Use import.meta.url instead',
          },
          {
            name: '__dirname',
            message: 'Not available in ESM',
          },
          {
            name: 'exports',
            message: 'Not available in ESM',
          },
          {
            name: 'module',
            message: 'Not available in ESM',
          },
          {
            name: 'require',
            message: 'Use import instead',
          },
        ],
        'import/extensions': ['error', 'ignorePackages'],
      },
    },
    {
      files: ['./packages/@uppy/companion/**/*.js'],
      rules: {
        'no-restricted-syntax': 'warn',
        'no-underscore-dangle': 'off',
      },
    },
    {
      files: [
        'website/src/examples/*/*.es6',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'no-console': 'off',
      },
    },
    {
      files: [
        '*.test.js',
        'test/endtoend/*.js',
        'website/*.js',
        'bin/**.js',
      ],
      rules: {
        'compat/compat': ['off'],
      },
    },
    {
      files: [
        'bin/**.js',
        'bin/**.mjs',
        'examples/**/*.js',
        'packages/@uppy/companion/test/**/*.js',
        'test/**/*.js',
        'test/**/*.ts',
        '*.test.js',
        '*.test-d.ts',
        'postcss.config.js',
        '.eslintrc.js',
        'website/*.js',
        'website/**/*.js',
        'private/**/*.js',
      ],
      rules: {
        'no-console': 'off',
        'import/no-extraneous-dependencies': ['error', {
          devDependencies: true,
        }],
      },
    },

    {
      files: [
        'packages/@uppy/locales/src/*.js',
        'packages/@uppy/locales/template.js',
      ],
      rules: {
        camelcase: ['off'],
        'quote-props': ['error', 'as-needed', { 'numbers': true }],
      },
    },

    {
      files: [
        'website/themes/uppy/source/js/*.js',
      ],
      rules: {
        'prefer-const': ['off'],
      },
    },

    {
      files: ['test/endtoend/*/*.mjs', 'test/endtoend/*/*.ts'],
      rules: {
        // we mostly import @uppy stuff in these files.
        'import/no-extraneous-dependencies': ['off'],
      },
    },
    {
      files: ['test/endtoend/*/*.js'],
      env: {
        mocha: true,
      },
    },

    {
      files: ['packages/@uppy/react/src/**/*.js'],
      rules: {
        'import/no-extraneous-dependencies': ['error', {
          peerDependencies: true,
        }],
      },
    },

    {
      files: ['**/*.md', '*.md'],
      processor: 'markdown/markdown',
    },
    {
      files: ['**/*.md/*.js', '**/*.md/*.javascript'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'react/destructuring-assignment': 'off',
        'no-restricted-globals': [
          'error',
          {
            name: '__filename',
            message: 'Use import.meta.url instead',
          },
          {
            name: '__dirname',
            message: 'Not available in ESM',
          },
          {
            name: 'exports',
            message: 'Not available in ESM',
          },
          {
            name: 'module',
            message: 'Not available in ESM',
          },
          {
            name: 'require',
            message: 'Use import instead',
          },
        ],
      },
    },
    {
      files: ['**/*.ts', '**/*.md/*.ts', '**/*.md/*.typescript'],
      excludedFiles: ['examples/angular-example/**/*.ts', 'packages/@uppy/angular/**/*.ts'],
      parser: '@typescript-eslint/parser',
      settings: {
        'import/resolver': {
          node: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
          },
        },
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'import/prefer-default-export': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
      },
    },
    {
      files: ['**/*.md/*.*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'off',
        'no-console': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['**/react/*.md/*.js', '**/react.md/*.js', '**/react-*.md/*.js'],
      settings: {
        react: { pragma: 'React' },
      },
    },
    {
      files: ['e2e/**/*.ts'],
      extends: ['plugin:cypress/recommended'],
    },
    {
      files: ['e2e/**/*.ts', 'e2e/**/*.js'],
      rules: { 'import/no-extraneous-dependencies': 'off' },
    },
  ],
}
