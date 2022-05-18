/* eslint-disable quote-props */

'use strict'

const svgPresentationAttributes = [
  'alignment-baseline', 'baseline-shift', 'class', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolatio', 'color-interpolatio-filters', 'color-profile', 'color-rendering', 'cursor', 'direction', 'display', 'dominant-baseline', 'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering', 'kerning', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'opacity', 'overflow', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'transform', 'transform-origin', 'unicode-bidi', 'vector-effect', 'visibility', 'word-spacing', 'writing-mod',
]

module.exports = {
  root: true,
  extends: ['transloadit'],
  env: {
    jest: false,
    node: false,
    // extra:
    browser: true,
  },
  globals: {
    globalThis: true,
    window: true,
  },
  plugins: [
    'jest',
    'markdown',
    'node',
    'prefer-import',
    'promise',
    'react',
    // extra:
    'compat',
    'jsdoc',
    'unicorn',
  ],
  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 2022,
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
    'max-classes-per-file': ['error', 2],
    'react/jsx-filename-extension': 'error',
    'react/no-unknown-property': ['error', {
      ignore: svgPresentationAttributes,
    }],

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
    'unicorn/prefer-node-protocol': 'error',

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
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-syntax': 'error',
    'jsdoc/check-tag-names': ['error', { jsxTags: true }],
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
  },

  overrides: [
    {
      files: [
        '.eslintrc.js',
        '.config.js',
        'babel.config.js',
        'bin/*.js',
        '*.cjs',
        'examples/angular-example/karma.conf.js',
        'examples/svelte-example/*.config.js',
        'examples/transloadit/server.js',
        'examples/uppy-with-companion/server/*.js',
      ],
      env: {
        node: true,
      },
    },
    {
      files: [
        '*.jsx',
        'packages/@uppy/react-native/**/*.js',
      ],
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'react/jsx-filename-extension': 'off',
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
      files: [
        '*.mjs',
        'e2e/clients/**/*.js',
        'examples/aws-companion/*.js',
        'examples/aws-presigned-url/*.js',
        'examples/bundled/*.js',
        'examples/custom-provider/client/*.js',
        'examples/digitalocean-spaces/*.js',
        'examples/multiple-instances/*.js',
        'examples/node-xhr/*.js',
        'examples/php-xhr/*.js',
        'examples/python-xhr/*.js',
        'examples/react-example/*.js',
        'examples/transloadit/*.js',
        'examples/transloadit-markdown-bin/*.js',
        'examples/xhr-bundle/*.js',
        'private/dev/*.js',
        'private/release/*.js',
        'private/remark-lint-uppy/*.js',

        // Packages that have switched to ESM sources:
        'packages/@uppy/audio/src/**/*.js',
        'packages/@uppy/aws-s3-multipart/src/**/*.js',
        'packages/@uppy/aws-s3/src/**/*.js',
        'packages/@uppy/box/src/**/*.js',
        'packages/@uppy/companion-client/src/**/*.js',
        'packages/@uppy/compressor/src/**/*.js',
        'packages/@uppy/core/src/**/*.js',
        'packages/@uppy/dashboard/src/**/*.js',
        'packages/@uppy/drag-drop/src/**/*.js',
        'packages/@uppy/drop-target/src/**/*.js',
        'packages/@uppy/dropbox/src/**/*.js',
        'packages/@uppy/facebook/src/**/*.js',
        'packages/@uppy/file-input/src/**/*.js',
        'packages/@uppy/form/src/**/*.js',
        'packages/@uppy/golden-retriever/src/**/*.js',
        'packages/@uppy/google-drive/src/**/*.js',
        'packages/@uppy/image-editor/src/**/*.js',
        'packages/@uppy/informer/src/**/*.js',
        'packages/@uppy/instagram/src/**/*.js',
        'packages/@uppy/locales/src/**/*.js',
        'packages/@uppy/locales/template.js',
        'packages/@uppy/onedrive/src/**/*.js',
        'packages/@uppy/progress-bar/src/**/*.js',
        'packages/@uppy/provider-views/src/**/*.js',
        'packages/@uppy/react/src/**/*.js',
        'packages/@uppy/redux-dev-tools/src/**/*.js',
        'packages/@uppy/remote-sources/src/**/*.js',
        'packages/@uppy/screen-capture/src/**/*.js',
        'packages/@uppy/status-bar/src/**/*.js',
        'packages/@uppy/store-default/src/**/*.js',
        'packages/@uppy/store-redux/src/**/*.js',
        'packages/@uppy/svelte/rollup.config.js',
        'packages/@uppy/svelte/src/**/*.js',
        'packages/@uppy/thumbnail-generator/src/**/*.js',
        'packages/@uppy/transloadit/src/**/*.js',
        'packages/@uppy/tus/src/**/*.js',
        'packages/@uppy/unsplash/src/**/*.js',
        'packages/@uppy/url/src/**/*.js',
        'packages/@uppy/utils/src/**/*.js',
        'packages/@uppy/vue/src/**/*.js',
        'packages/@uppy/webcam/src/**/*.js',
        'packages/@uppy/xhr-upload/src/**/*.js',
        'packages/@uppy/zoom/src/**/*.js',
        'website/src/examples/*/*.es6',
      ],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'import/named': 'off', // Disabled because that rule tries and fails to parse JSX dependencies.
        'import/no-named-as-default': 'off', // Disabled because that rule tries and fails to parse JSX dependencies.
        'import/no-named-as-default-member': 'off', // Disabled because that rule tries and fails to parse JSX dependencies.
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
      files: ['packages/uppy/*.mjs'],
      rules: {
        'import/first': 'off',
        'import/newline-after-import': 'off',
        'import/no-extraneous-dependencies': ['error', {
          devDependencies: true,
        }],
      },
    },
    {
      files: [
        'packages/@uppy/*/types/*.d.ts',
        'packages/@uppy/react/src/*.d.ts',
      ],
      rules : {
        'import/no-unresolved': 'off',
        'max-classes-per-file': 'off',
        'no-use-before-define': 'off',
      },
    },
    {
      files: [
        'packages/@uppy/dashboard/src/components/**/*.jsx',
      ],
      rules: {
        'react/destructuring-assignment': 'off',
      },
    },
    {
      files: [
        // Those need looser rules, and cannot be made part of the stricter rules above.
        // TODO: update those to more modern code when switch to ESM is complete
        'examples/react-native-expo/*.js',
        'examples/svelte-example/**/*.js',
        'examples/vue/**/*.js',
        'examples/vue3/**/*.js',
      ],
      parserOptions: {
        sourceType: 'module',
      },
    },
    {
      files: ['./packages/@uppy/companion/**/*.js'],
      env: { node: true },
      rules: {
        'no-underscore-dangle': 'off',

        // transloadit rules we would like to enforce in the future
        // but will require separate PRs to gradually get there
        // and so the meantime: just warn
        'class-methods-use-this': 'warn',
        'consistent-return': 'warn',
        'global-require': 'warn',
        'import/order': 'warn',
        'no-param-reassign': 'warn',
        'no-redeclare': 'warn',
        'no-shadow': 'warn',
        'no-use-before-define': 'warn',
      },
    },
    {
      files: ['./packages/@uppy/companion/test/**/*.js'],
      env: { jest: true },
    },
    {
      files: [
        'website/src/examples/*/*.es6',
      ],
      env: {
        node: true,
      },
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
        'examples/**/*.config.js',
        'examples/**/*.cjs',
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
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'react/destructuring-assignment': 'off',
        'react/jsx-filename-extension': 'off',
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
      rules: {
        'node/prefer-global/buffer': ['error', 'never'],
        'node/prefer-global/console': ['error', 'always'],
        'node/prefer-global/process': ['error', 'always'],
        'node/prefer-global/url-search-params': ['error', 'always'],
        'node/prefer-global/url': ['error', 'always'],
      },
    },
    {
      files: ['e2e/**/*.ts', 'e2e/**/*.js', 'e2e/**/*.jsx'],
      rules: { 'import/no-extraneous-dependencies': 'off', 'no-unused-expressions': 'off' },
      globals: {
        process: 'readable',
      },
    },
    {
      files: ['website/**/*.js'],
      env: { node: true },
      globals: {
        hexo: 'readable',
      },
    },
  ],
}
