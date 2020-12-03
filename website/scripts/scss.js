const sass = require('sass')

function scssRenderer (data) {
  const result = sass.renderSync({
    data: data.text,
    file: data.path,
    outputStyle: 'nested',
    sourceComments: false,
    indentedSyntax: data.path.endsWith('.sass'),
    ...this.theme.config.node_sass,
    ...this.config.node_sass
  })

  return result.css.toString()
}

hexo.extend.renderer.register('scss', 'css', scssRenderer)
hexo.extend.renderer.register('sass', 'css', scssRenderer)
