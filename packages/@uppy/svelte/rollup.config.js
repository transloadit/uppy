import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import preprocess from 'svelte-preprocess'

const globals = {
  '@uppy/dashboard': 'Dashboard',
  '@uppy/drag-drop': 'DragDrop',
  '@uppy/progress-bar': 'ProgressBar',
  '@uppy/status-bar': 'StatusBar',
}

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'lib/index.js',
      format: 'es',
      globals,
    },
  ],
  plugins: [
    svelte({
      include: 'src/**/*.svelte',
      preprocess: preprocess(),
    }),
    resolve({
      resolveOnly: ['svelte'],
    }),
  ],
}
