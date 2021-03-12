import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import preprocess from 'svelte-preprocess'
import pkg from './package.json'

const name = pkg.name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
  .replace(/^\w/, m => m.toUpperCase())
  .replace(/-\w/g, m => m[1].toUpperCase())

const globals = {
  '@uppy/dashboard': 'Dashboard',
  '@uppy/drag-drop': 'DragDrop',
  '@uppy/progress-bar': 'ProgressBar',
  '@uppy/status-bar': 'StatusBar'
}

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.module,
      format: 'es',
      globals
    },
    {
      file: pkg.main,
      format: 'umd',
      name,
      globals
    }
  ],
  plugins: [
    svelte({
      include: 'src/**/*.svelte',
      preprocess: preprocess()
    }),
    resolve({
      resolveOnly: ['svelte']
    })
  ]
}
