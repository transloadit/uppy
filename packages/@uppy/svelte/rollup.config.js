import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import preprocess from 'svelte-preprocess'
import svelteDts from 'rollup-plugin-svelte-types';

const globals = {
  '@uppy/dashboard': 'Dashboard',
  '@uppy/drag-drop': 'DragDrop',
  '@uppy/progress-bar': 'ProgressBar',
  '@uppy/status-bar': 'StatusBar',
}

export default {
  input: 'src/index',
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
    svelteDts.default({
      declarationDir: './lib/'
    })
  ],
}
