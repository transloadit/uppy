/** @type {import("prettier").Config} */
module.exports = {
  proseWrap: 'always',
  singleQuote: true,
  trailingComma: 'all',
  semi: false,
  experimentalTernaries: true,
  overrides: [
    {
      files: 'packages/@uppy/angular/**',
      options: {
        semi: true,
      },
    },
  ],
}
