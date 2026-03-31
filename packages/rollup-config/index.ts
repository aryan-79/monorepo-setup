import path from 'node:path';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { globSync } from 'glob';
import type { Plugin, RollupOptions } from 'rollup';
import postcss from 'rollup-plugin-postcss';
import preserveDirectives from 'rollup-preserve-directives';
import commonjs from '@rollup/plugin-commonjs';

export interface LibraryConfigOptions {
  /**
   * Root directory containing source files
   * @default 'src'
   */
  srcDir?: string;

  /**
   * Output directory
   * @default 'dist'
   */
  outDir?: string;

  /**
   * Entry file patterns
   * @default ['src/**\/*.tsx', 'src/**\/*.ts']
   */
  entryPatterns?: string[];

  /**
   * External dependencies (won't be bundled)
   * @default ['react', 'react-dom', 'react/jsx-runtime']
   */
  external?: string[];

  /**
   * Path to tsconfig.json
   * @default './tsconfig.json'
   */
  tsconfig?: string;

  /**
   * TypeScript compiler options override
   */
  tsCompilerOptions?: Record<string, any>;

  /**
   * Whether to minify output
   * @default true
   */
  minify?: boolean;

  /**
   * Whether to generate sourcemaps
   * @default true
   */
  sourcemap?: boolean;

  /**
   * Additional rollup plugins
   */
  additionalPlugins?: Plugin[];
}

/**
 *@default creates config for react library if options are not provided
 */
export function createLibraryConfig(options: LibraryConfigOptions = {}) {
  const {
    srcDir = 'src',
    outDir = 'dist',
    entryPatterns = [`${srcDir}/**/*.tsx`, `${srcDir}/**/*.ts`],
    external = ['react', 'react-dom', 'react/jsx-runtime'],
    tsconfig = './tsconfig.json',
    tsCompilerOptions = {},
    minify = true,
    sourcemap = true,
    additionalPlugins = [],
  } = options;

  const config: RollupOptions = {
    input: Object.fromEntries(
      globSync(entryPatterns, { ignore: ['**/*.test.*', '**/*.spec.*'] }).map((file) => [
        path.relative(srcDir, file.slice(0, file.length - path.extname(file).length)),
        path.resolve(process.cwd(), file),
      ]),
    ),
    external,
    output: {
      dir: outDir,
      format: 'esm',
      sourcemap,
      preserveModules: true,
    },
    plugins: [
      commonjs(),
      resolve(),
      typescript({
        tsconfig,
        declaration: true,
        declarationMap: true,
        compilerOptions: tsCompilerOptions,
      }),
      preserveDirectives(),
      ...(minify
        ? [
            terser({
              ecma: 2020,
              compress: {
                directives: false,
              },
            }),
          ]
        : []),
      ...additionalPlugins,
    ],
  };

  return config;
}

export interface CssBundleConfigOptions {
  src?: string;
  output?: string;
  additionalPlugins?: Plugin[];
  extract?: boolean;
  minimize?: boolean;
}

export function createCssBundleConfig(options: CssBundleConfigOptions = {}): RollupOptions {
  const {
    src = './src/styles/styles.css',
    output = 'dist/index.css',
    extract = true,
    minimize = false,
    additionalPlugins = [],
  } = options;
  return {
    input: src,
    output: [{ file: output }],
    plugins: [
      postcss({
        extract,
        minimize,
      }),
      ...additionalPlugins,
    ],
  };
}
