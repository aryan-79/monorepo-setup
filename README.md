# Monorepo Setup Guide with Turborepo

This guide walks you through setting up a monorepo using Turborepo with pnpm and Biome for linting and formatting.

## Table of Contents

- [Creating the Starter Repository](#creating-the-starter-repository)
- [Understanding the Starter Structure](#understanding-the-starter-structure)
- [Configuring Biome for Linting and Formatting](#configuring-biome-for-linting-and-formatting)
- [Setting Up a Shared Component Library with shadcn](#setting-up-a-shared-component-library-with-shadcn)
- [Using the UI Package in Your Application](#using-the-ui-package-in-your-application)

## Creating the Starter Repository

Initialize a new Turborepo project using the following command:

```bash
pnpm dlx create-turbo@latest
```

**Important:** When prompted, select **pnpm** as your package manager.

## Understanding the Starter Structure

The generated starter repository includes:

- **Two deployable applications** – Located in the `apps/` directory (both are Next.js applications by default)
- **Three shared libraries** – Reusable packages for the rest of the monorepo

> **Note:** Packages are defined in the `pnpm-workspace.yaml` file.

You can remove the default Next.js applications and create your own using any framework you prefer.

## Configuring Biome for Linting and Formatting

We'll replace the default ESLint and Prettier setup with Biome for a faster, unified tooling experience.

### 1. Remove Prettier

Uninstall Prettier from the workspace:

```bash
pnpm remove prettier
```

### 2. Install Biome

Add Biome as a development dependency to the root workspace:

```bash
pnpm add -D -E -w @biomejs/biome
```

**Flag explanations:**
- `-D` – Installs as a dev dependency
- `-E` – Pins the exact version (recommended for Biome)
- `-w` – Adds the dependency to the root workspace

### 3. Remove ESLint Config Package

Since Biome handles both linting and formatting, remove the `eslint-config` package from the `packages/` directory.

### 4. Create Biome Configuration

Create a `biome.json` file in your root directory with the following configuration:

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "files": {
    "includes": ["**", "!node_modules", "!**/dist/*", "!pnpm-lock.yaml"]
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn"
      },
      "a11y": {
        "useButtonType": "warn",
        "useValidAnchor": "off",
        "useSemanticElements": "off",
        "noRedundantAlt": "off",
        "useFocusableInteractive": "warn",
        "noRedundantRoles": "warn",
        "useAriaPropsForRole": "warn",
        "useMediaCaption": "off"
      },
      "correctness": {
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noArrayIndexKey": "warn"
      },
      "security": {
        "noDangerouslySetInnerHtml": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "lineWidth": 120,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "single"
    }
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

> **Note:** This is an opinionated configuration. Adjust it according to your preferences. Check the [Biome configuration guide](https://biomejs.dev/guides/configure-biome/) for more options.

## Setting Up a Shared Component Library with shadcn

Remove the existing `ui` package from the `packages/` directory. We'll create a new shared shadcn component library from scratch.

### 1. Create Package Structure

Create a `ui/` directory inside `packages/` and add a `package.json` file. Every package requires its own `package.json` to define its name and dependencies.

```json
{
  "$schema": "https://json.schemastore.org/package",
  "name": "@repo/ui",
  "private": true,
  "type": "module",
  "peerDependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.1.14",
    "tw-animate-css": "^1.4.0"
  }
}
```

**Field Descriptions:**
- `name` – Package identifier used for installation in other packages
- `private` – Prevents accidental publishing to npm
- `type` – Setting to `"module"` enables modern ES modules syntax (`import`/`export`)
- `peerDependencies` – Dependencies that are expected to be installed by the consuming application. This ensures the UI package shares the same React instance with the app (critical for hooks and context) and allows the consumer to control versions. Tailwind CSS and its animate plugin are also peer dependencies since the consuming app needs them to generate styles for the component classes.

### 2. Install Dependencies

Add the required dependencies to your UI package:

```bash
pnpm --filter @repo/ui add -D react react-dom @types/react @types/react-dom typescript rollup @rollup/plugin-node-resolve @rollup/plugin-typescript @rollup/plugin-terser postcss rollup-plugin-postcss rollup-preserve-directives glob
```

**Package Explanations:**
- `react`, `react-dom` – Core React libraries for building UI components
- `@types/react`, `@types/react-dom` – TypeScript type definitions for React
- `typescript` – TypeScript compiler for type checking
- `rollup` – Module bundler for creating optimized builds
- `@rollup/plugin-node-resolve` – Resolves node_modules imports
- `@rollup/plugin-typescript` – Compiles TypeScript files
- `@rollup/plugin-terser` – Minifies the bundled output
- `postcss`, `rollup-plugin-postcss` – Processes CSS files
- `rollup-preserve-directives` - Preserve module level directives like "use client"
- `glob` – Pattern matching for file paths

### 3. Configure TypeScript

We'll use the existing TypeScript configuration from the `typescript-config` internal package with some modifications to support modern bundler workflows.

#### Update Base TypeScript Configuration

Make the following changes in `base.json` of the `typescript-config` package in the `packages/` directory:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "incremental": false,
    "isolatedModules": true,
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "module": "es2022",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022"
  }
}
```

**Key Configuration Changes:**

- **`lib`** – `["es2022", "DOM", "DOM.Iterable"]`
  - `es2022` – Provides type definitions for ECMAScript 2022 features (e.g., top-level await, class fields, `at()` method)
  - `DOM` – Provides type definitions for browser APIs (e.g., `document`, `window`, `HTMLElement`)
  - `DOM.Iterable` – Adds iteration support for DOM collections (e.g., `NodeList`, `HTMLCollection`)

- **`module`** – Changed from `"NodeNext"` to `"es2022"`
  - Generates ES2022 module syntax with support for top-level await and modern import/export features
  - Better compatibility with modern bundlers like Rollup and Vite

- **`moduleResolution`** – Changed from `"NodeNext"` to `"bundler"`
  - Optimized for bundler workflows (Rollup, Webpack, Vite)
  - Allows modern import patterns like package.json `exports` field and extensionless imports

#### Add TypeScript Config as Dependency

Install the shared TypeScript configuration package:

```bash
pnpm --filter @repo/ui add -D "@repo/typescript-config@workspace:"
```

#### Create UI Package TypeScript Configuration

Create a `tsconfig.json` file in the root of your `ui/` package:

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "outDir": "dist",
    "emitDeclarationOnly": true
  }
}
```

**Configuration Options:**

- **`baseUrl` and `paths`** – Enables path aliases for cleaner imports (e.g., `@/components/button`)
- **`outDir`** – Specifies where TypeScript should output compiled files (the `dist/` directory)
- **`emitDeclarationOnly`** – Only generates type definition files (`.d.ts` and `.d.ts.map`)
  - JavaScript compilation is handled by Rollup's TypeScript plugin for better optimization
  - This prevents duplicate compilation and ensures type definitions match the bundled output

### 4. Configure Rollup for Bundling

Create a `rollup.config.ts` file in the root of your `ui/` package:

```typescript
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
```

**Configuration Overview:**

This setup creates two separate build configurations:

1. **Component Bundle** – Processes all `.tsx` and `.ts` files, compiles TypeScript, and outputs ES modules with type definitions. The build preserves the source directory structure in `dist/` (e.g., `src/components/` → `dist/components/`).

2. **Styles Bundle** – Processes CSS files and outputs a single stylesheet at `dist/index.css`.

**Key Features:**
- **Tree-shakeable output** – ES modules format allows consuming apps to only import what they need
- **Type safety** – Generates TypeScript declarations for better developer experience
- **Optimized builds** – Terser minification reduces bundle size
- **External dependencies** – React and React DOM remain as peer dependencies

### 5. Configure shadcn/ui

#### Install Required Packages

```bash
pnpm --filter @repo/ui add class-variance-authority clsx tailwind-merge lucide-react
```

#### Configure Styles and Utilities

Follow the [shadcn manual installation guide](https://ui.shadcn.com/docs/installation/manual#configure-styles) to:
- Set up your CSS file with Tailwind directives
- Create the `cn()` utility helper
- Configure `components.json`

#### Update CSS File

Remove the Tailwind CSS imports from your CSS file and add this line at the top:

```css
/* @import "tailwindcss" */
/* @import "tw-animate-css" */
/* Remove the above two lines from the styles copied from shadcn docs */

@source "./**/*.{js}";

```

> **Important:** We bundled the CSS with PostCSS, so this directive tells Tailwind CSS to scan all JavaScript files starting from the bundled CSS location (`dist/`). The consuming application must have `tailwindcss` and `tw-animate-css` installed and imported in their own CSS file. This approach allows Tailwind to generate styles for your component classes when building the consumer application.

#### Add shadcn Components

Navigate to the `packages/ui/` directory and add shadcn components:

```bash
cd packages/ui
pnpm dlx shadcn@latest add button
```

### 6. Configure Package Exports

Add the `exports` field to your `package.json` to expose components and utilities to consuming applications:

```json
{
  "exports": {
    "./core/*": {
      "types": "./dist/components/core/*.d.ts",
      "import": "./dist/components/core/*.js"
    },
    "./utils/*": {
      "types": "./dist/lib/*.d.ts",
      "import": "./dist/lib/*.js"
    },
    "./hooks/*": {
      "types": "./dist/hooks/*.d.ts",
      "import": "./dist/hooks/*.js"
    },
    "./styles": "./dist/index.css"
  }
}
```

**What This Does:**

The `exports` field defines the public API of your package. It maps import paths to the actual files in your `dist/` directory:
- `./core/*` – Exposes UI components (e.g., `import { Button } from '@repo/ui/core/button'`)
- `./utils/*` – Exposes utility functions (e.g., `import { cn } from '@repo/ui/utils/cn'`)
- `./hooks/*` – Exposes custom React hooks (e.g., `import { useMediaQuery } from '@repo/ui/hooks/use-media-query'`)
- `./styles` – Exposes the bundled CSS file for import

Each entry specifies both the TypeScript types (`types`) and the JavaScript module (`import`), enabling full type safety in consuming applications.

### 7. Configure Scripts

Add build and development scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "rollup -c --watch",
    "build": "rollup -c",
    "check": "biome check --write --unsafe"
  }
}
```

**Script Explanations:**
- `dev` – Runs Rollup in watch mode, automatically rebuilding when files change
- `build` – Builds the package for production
- `check` – Runs Biome linter and formatter, automatically fixing issues

#### Build the Package

```bash
# Build once
pnpm --filter @repo/ui build

# Build in watch mode for development
pnpm --filter @repo/ui dev
```

## Using the UI Package in Your Application

### 1. Add the Package as a Dependency

Install the UI package in your application:

```bash
pnpm --filter app-name add "@repo/ui@workspace:"
```

Replace `app-name` with your actual application package name.

### 2. Import and Use Components

Import components, utilities, and styles just like you would from any npm package:

```typescript
// Import components
import { Button } from '@repo/ui/core/button';

// Import utilities
import { cn } from '@repo/ui/utils/cn';

// Import hooks
import { useMediaQuery } from '@repo/ui/hooks/use-media-query';

// Use in your application
export default function App() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  );
}
```

### 3. Configure Tailwind in Your Application

Ensure your application's CSS file imports Tailwind CSS and the animate plugin:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import '@repo/ui/styles";
```

This allows Tailwind to generate styles for the component classes from your UI package.

---

## Summary

You now have a fully configured monorepo with:
- ✅ Turborepo for task orchestration
- ✅ pnpm for efficient package management
- ✅ Biome for fast linting and formatting
- ✅ A shared UI component library with shadcn/ui
- ✅ TypeScript support with proper type definitions
- ✅ Rollup bundling for optimized output
- ✅ Tree-shakeable ES modules

Your components are now ready to be shared across multiple applications in your monorepo!
