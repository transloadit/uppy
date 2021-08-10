/* eslint-disable quote-props */

'use strict'

const path = require('path')

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
    'no-await-in-loop': 'off',
    'object-shorthand': ['error', 'always'],
    'strict': 'off',
    'key-spacing': 'off',

    // rules we want to enforce
    'implicit-arrow-linebreak': 'error',
    'import/no-extraneous-dependencies': 'error',
    'max-len': 'error',
    'no-empty': 'error',
    'no-underscore-dangle': 'error',
    'no-useless-concat': 'error',
    'no-var': 'error',

    // transloadit rules we would like to enforce in the future
    // but will require separate PRs to gradually get there
    // and so the meantime: just warn
    'array-callback-return': ['warn'],
    'class-methods-use-this': ['warn'],
    'consistent-return': ['warn'],
    'default-case': ['warn'],
    'global-require': ['warn'],
    'import/no-dynamic-require': ['warn'],
    'import/no-unresolved': ['warn'],
    'import/order': ['warn'],
    'no-bitwise': ['warn'],
    'no-continue': ['warn'],
    'no-lonely-if': ['warn'],
    'no-mixed-operators': ['warn'],
    'no-nested-ternary': ['warn'],
    'no-param-reassign': ['warn'],
    'no-redeclare': ['warn'],
    'no-restricted-properties': ['warn'],
    'no-return-assign': ['warn'],
    'no-shadow': ['warn'],
    'no-unused-expressions': ['warn'],
    'no-unused-vars': ['warn'],
    'no-use-before-define': ['warn'],
    'node/handle-callback-err': ['warn'],
    'prefer-destructuring': ['warn'],
    'prefer-spread': ['warn'],
    'radix': ['warn'],
    'react/button-has-type': ['warn'],
    'react/destructuring-assignment': ['warn'],
    'react/forbid-prop-types': ['warn'],
    'react/jsx-props-no-spreading': ['warn'],
    'react/no-access-state-in-setstate': 'error',
    'react/no-array-index-key': ['warn'],
    'react/no-deprecated': ['warn'],
    'react/no-this-in-sfc': ['warn'],
    'react/no-will-update-set-state': ['warn'],
    'react/prefer-stateless-function': ['warn'],
    'react/sort-comp': ['warn'],
    'react/style-prop-object': ['warn'],
    'react/no-unknown-property': ['error', {
      ignore: svgPresentationAttributes,
    }],

    // accessibility
    'jsx-a11y/alt-text': ['warn'],
    'jsx-a11y/anchor-has-content': ['warn'],
    'jsx-a11y/click-events-have-key-events': ['warn'],
    'jsx-a11y/control-has-associated-label': ['warn'],
    'jsx-a11y/label-has-associated-control': ['warn'],
    'jsx-a11y/media-has-caption': ['warn'],
    'jsx-a11y/mouse-events-have-key-events': ['warn'],
    'jsx-a11y/no-interactive-element-to-noninteractive-role': ['warn'],
    'jsx-a11y/no-noninteractive-element-interactions': ['warn'],
    'jsx-a11y/no-static-element-interactions': ['warn'],

    // compat
    'compat/compat': ['error'],

    // jsdoc
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-examples': 'error',
    'jsdoc/check-param-names': ['warn'],
    'jsdoc/check-syntax': ['warn'],
    'jsdoc/check-tag-names': ['warn'],
    'jsdoc/check-types': 'error',
    'jsdoc/newline-after-description': 'error',
    'jsdoc/valid-types': ['warn'],
    'jsdoc/check-indentation': ['off'],
  },

  settings: {
    'import/resolver': {
      'eslint-import-resolver-lerna': {
        packages: path.resolve(__dirname, 'packages'),
      },
    },
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
      files: ['./packages/@uppy/companion/**/*.js'],
      rules: {
        'no-restricted-syntax': 'warn',
        'no-underscore-dangle': 'off',
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
        'quote-props': ['off'],
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
      files: ['test/endtoend/*/*.js'],
      rules: {
        // we mostly import @uppy stuff in these files.
        'import/no-extraneous-dependencies': ['off'],
      },
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
      plugins: [
        '@typescript-eslint',
      ],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'import/prefer-default-export': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
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
  ],
}
