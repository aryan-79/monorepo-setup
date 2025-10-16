import path from 'node:path';
import { fileURLToPath } from 'node:url';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { globSync } from 'glob';
import type { RollupOptions } from 'rollup';
import postcss from 'rollup-plugin-postcss';
import preserveDirectives from 'rollup-preserve-directives';

export default [
  {
    input: Object.fromEntries(
      globSync(['src/**/*.tsx', 'src/**/*.ts']).map((file) => [
        path.relative('src', file.slice(0, file.length - path.extname(file).length)),
        fileURLToPath(new URL(file, import.meta.url)),
      ]),
    ),
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    output: [
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        preserveModules: true,
      },
    ],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: true,
        rootDir: 'src',
      }),
      preserveDirectives(),
      terser({
        ecma: 2020,
      }),
    ],
  },
  {
    input: './src/styles/styles.css',
    output: [{ file: 'dist/index.css' }],
    plugins: [
      postcss({
        extract: true,
        minimize: false,
      }),
    ],
  },
] satisfies RollupOptions[];
