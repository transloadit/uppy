module.exports = (api) => {
  let targets = {}
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
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-transform-object-assign',
      ['@babel/plugin-transform-react-jsx', { pragma: 'h' }]
    ]
  }
}
