module.exports = (api) => {
  const targets = {}
  if (api.env('test')) {
    targets.node = 'current'
  }

  return {
    presets: [
      ['@babel/preset-env', {
        include: [
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-numeric-separator',
        ],
        loose: true,
        targets,
        useBuiltIns: false, // Don't add polyfills automatically.
        // We can uncomment the following line if we start adding polyfills to the non-legacy dist files.
        // corejs: { version: '3.24', proposals: true },
        modules: false,
      }],
    ],
    plugins: [
      ['@babel/plugin-transform-react-jsx', { pragma: 'h', pragmaFrag: 'Fragment' }],
      process.env.NODE_ENV !== 'dev' && 'babel-plugin-inline-package-json',
    ].filter(Boolean),
  }
}
