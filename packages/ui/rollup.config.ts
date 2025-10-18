import { createCssBundleConfig, createLibraryConfig } from '@repo/rollup-config';
import { defineConfig } from 'rollup';

const libraryConfig = createLibraryConfig();
const cssBundleConfig = createCssBundleConfig();

export default defineConfig([libraryConfig, cssBundleConfig]);
