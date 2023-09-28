module.exports = {
  proseWrap: 'always',
  singleQuote: true,
  trailingComma: 'all',
  semi: false,
  overrides: [
    {
      files: 'packages/@uppy/angular/**',
      options: {
        semi: true,
      },
    },
  ],
}
