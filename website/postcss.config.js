module.exports = {
  plugins: {
    'postcss-inline-svg': {
      paths: ['src/images'],
    },
    cssnano: { safe: true },
  },
}
