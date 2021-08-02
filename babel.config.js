module.exports = (api) => {
  const targets = {}
  if (api.env('test')) {
    targets.node = 'current'
  }

  return {
    presets: [
      ['@babel/preset-env', {
        include: ['@babel/plugin-proposal-nullish-coalescing-operator'],
        loose: true,
        targets,
        useBuiltIns: false, // Don't add polyfills automatically.
        // We can uncomment the following line if we start adding polyfills to the non-legacy dist files.
        // corejs: { version: '3.15', proposals: true },
      }],
    ],
    plugins: [
      ['@babel/plugin-transform-react-jsx', { pragma: 'h' }],
      process.env.IS_RELEASE_BUILD && 'babel-plugin-inline-package-json',
    ].filter(Boolean),
  }
}
