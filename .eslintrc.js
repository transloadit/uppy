'use strict'

const glob = require('glob')

// Configure import/no-extraneous-dependencies for test files in
// each package, which are allowed to import dependencies from their
// own package.json as well as the root package.json.
const importRules = []
for (const dir of glob.sync('packages/@uppy/*')) {
  importRules.push({
    files: [
      `${dir}/**/*.test.js`,
      `${dir}/test/**/*.js`,
      `${dir}/rollup.config.js`,
    ],
    rules: {
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: true,
        packageDir: [dir, '.'],
      }],
    },
  })
}

module.exports = {
  extends: ['transloadit'],
  env: {
    es6: true,
    jest: true,
    node: true,
    // extra:
    browser: true,
  },
  globals: {
    window: true,
    hexo: true,
  },
  plugins: [
    '@babel/eslint-plugin',
    'jest',
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
    'guard-for-in': ['off'],
    'import/extensions': ['off'],
    strict: ['off'],
    'key-spacing': ['off'],

    // transloadit rules we would like to enforce in the future
    // but will require separate PRs to gradually get there
    // and so the meantime: just warn
    'array-callback-return': ['warn'],
    'block-scoped-var': ['warn'],
    'class-methods-use-this': ['warn'],
    'consistent-return': ['warn'],
    'default-case': ['warn'],
    'global-require': ['warn'],
    'implicit-arrow-linebreak': ['warn'],
    'import/no-dynamic-require': ['warn'],
    'import/no-unresolved': ['warn'],
    'import/order': ['warn'],
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
    'no-await-in-loop': ['warn'],
    'no-bitwise': ['warn'],
    'no-continue': ['warn'],
    'no-empty': ['warn'],
    'no-lonely-if': ['warn'],
    'no-mixed-operators': ['warn'],
    'no-nested-ternary': ['warn'],
    'no-param-reassign': ['warn'],
    'no-redeclare': ['warn'],
    'no-restricted-globals': ['warn'],
    'no-restricted-properties': ['warn'],
    'no-restricted-syntax': ['warn'],
    'no-return-assign': ['warn'],
    'no-shadow': ['warn'],
    'no-underscore-dangle': ['warn'],
    'no-unused-expressions': ['warn'],
    'no-unused-vars': ['warn'],
    'no-use-before-define': ['warn'],
    'no-useless-concat': ['warn'],
    'no-var': ['warn'],
    'node/handle-callback-err': ['warn'],
    'prefer-destructuring': ['warn'],
    'prefer-spread': ['warn'],
    radix: ['warn'],
    'react/button-has-type': ['warn'],
    'react/destructuring-assignment': ['warn'],
    'react/forbid-prop-types': ['warn'],
    'react/jsx-props-no-spreading': ['warn'],
    'react/no-access-state-in-setstate': ['warn'],
    'react/no-array-index-key': ['warn'],
    'react/no-deprecated': ['warn'],
    'react/no-this-in-sfc': ['warn'],
    'react/no-will-update-set-state': ['warn'],
    'react/prefer-stateless-function': ['warn'],
    'react/sort-comp': ['warn'],
    'react/style-prop-object': ['warn'],
    'vars-on-top': ['warn'],
    'import/no-extraneous-dependencies': ['error'],

    // compat
    'compat/compat': ['error'],

    // jsdoc
    'jsdoc/check-alignment': ['warn'],
    'jsdoc/check-examples': ['warn'],
    'jsdoc/check-param-names': ['warn'],
    'jsdoc/check-syntax': ['warn'],
    'jsdoc/check-tag-names': ['warn'],
    'jsdoc/check-types': ['warn'],
    'jsdoc/newline-after-description': ['warn'],
    'jsdoc/valid-types': ['warn'],
    'jsdoc/check-indentation': ['off'],
  },

  settings: {
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
        '.eslintrc.js',
      ],
      rules: {
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

    ...importRules,
  ],
}
