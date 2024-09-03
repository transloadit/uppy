import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import preprocess from 'svelte-preprocess'
import svelteDts from 'rollup-plugin-svelte-types';

export default {
  external: [
    /^@uppy\//,
    /node_modules/,
  ],
  input: 'src/index.ts',
  output: [
    {
      file: 'lib/index.js',
      format: 'es',
      sourcemap: 'inline',
    },
  ],
  plugins: [
    svelte({
      include: 'src/**/*.svelte',
      preprocess: preprocess(),
    }),
    resolve({
      browser: true,
      exportConditions: ['svelte'],
      extensions: ['.svelte']
    }),
    svelteDts.default({
      declarationDir: './lib/'
    })
  ],
}
