module.exports = (api) => {
  const targets = {}
  if (api.env('test')) {
    targets.node = 'current'
  }

  return {
    presets: [
      ['@babel/preset-env', {
        modules: false,
        loose: true,
        targets
      }]
    ],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      '@babel/plugin-transform-object-assign',
      ['@babel/plugin-transform-react-jsx', { pragma: 'h' }],
      process.env.IS_RELEASE_BUILD && 'babel-plugin-inline-package-json'
    ].filter(Boolean)
  }
}
