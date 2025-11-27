import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { dts } from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';

const terserMin = terser({
  module: true,
  ecma: 2020,
  compress: {
    passes: 3,
    unsafe: true,
    unsafe_arrows: true,
    unsafe_methods: true,
    unsafe_proto: true,
    unsafe_math: true,
    pure_getters: true,
    drop_console: true,
  },
  mangle: {
    properties: { regex: /^_/ },
  },
  format: { comments: false },
});

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/s3mini.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/s3mini.min.js',
        format: 'esm',
        sourcemap: true,
        plugins: [terserMin],
      },
    ],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
      }),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/s3mini.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];
