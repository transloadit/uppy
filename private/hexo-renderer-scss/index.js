var renderer = require('./lib/renderer');
// associate the Sass renderer with .scss AND .sass extensions
hexo.extend.renderer.register('scss', 'css', renderer);
hexo.extend.renderer.register('sass', 'css', renderer);
