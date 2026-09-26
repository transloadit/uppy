# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Uppy is a modular JavaScript file uploader that integrates seamlessly with any application. It's built using a monorepo structure with Yarn workspaces, Turbo for build orchestration, and Biome for linting/formatting.

## Development Commands

### Core Commands
- `yarn build` - Build all packages (uses Turbo)
- `yarn build:watch` - Watch mode for building packages
- `yarn test` - Run tests for all packages
- `yarn test:watch` - Run tests in watch mode
- `yarn typecheck` - Type checking across all packages (not examples; `build:examples` covers those)
- `yarn check` - Run Biome linting and formatting
- `yarn check:ci` - Run Biome in CI mode (no writes)
- `yarn test:e2e` - Run e2e tests (only `@uppy/url` has them)
- `yarn build:examples` - Build, typecheck and lint `examples/*` and `private/*`
- `yarn build:clean` - Delete all gitignored files (except `node_modules`) under `packages/`, plus `coverage/`, `.turbo/`, `.parcel-cache/`

### Development Server
- `yarn dev` - Start development server (from private/dev workspace)
- `yarn dev:with-companion` - Start dev server with Companion backend
- `yarn start:companion` - Start only the Companion server

### Single Test Execution
To run tests for a specific package (not every package has a `test` script):
```bash
yarn workspace @uppy/[package-name] test
# Example: yarn workspace @uppy/core test
```

### Individual Package Development
```bash
yarn workspace @uppy/[package-name] build
```

## Architecture

### Monorepo Structure
- `packages/@uppy/` - Core Uppy packages (plugins, utilities)
- `packages/uppy/` - Main bundle package
- `examples/` - Example implementations for various frameworks
- `private/` - Internal development tools

### Core Architecture
- **Uppy Core** (`@uppy/core`) - Main class that manages plugins, state, and events
- **Plugins** - Modular components for different functionalities:
  - **UI Plugins**: Dashboard, Drag & Drop, Webcam, etc.
  - **Provider Plugins**: Google Drive, Dropbox, etc. (require Companion)
  - **Uploader Plugins**: Tus (resumable), XHR Upload, AWS S3, etc.
  - **Utility Plugins**: Golden Retriever (recovery), Thumbnail Generator, etc.

### Plugin Types
The `type` field each plugin sets:
- `acquirer` - Gets files (Drag & Drop, Webcam, Google Drive, Url, Form)
- `modifier` - Processes files after they are added (Compressor rewrites the file; Thumbnail Generator only sets `file.preview`)
- `editor` - Edits files (Image Editor)
- `uploader` - Uploads files (Tus, XHR Upload, AWS S3)
- `orchestrator` - Hosts other UI plugins (Dashboard)
- `progressindicator` - Shows upload progress (Status Bar)
- `preset` - Bundles other plugins (Remote Sources)
- `debugger` - Golden Retriever

### Key Packages
- `@uppy/core` - Main Uppy class and plugin system. Also exports `@uppy/core/utils`, `@uppy/core/companion-client` and `@uppy/core/provider-views` (formerly separate packages)
- `@uppy/dashboard` - Complete UI with file management
- `@uppy/companion` - Server-side component for remote providers
- `@uppy/components` - Headless Preact components (with framework wrappers)

## Build System

### Turbo Configuration
The build system uses Turbo (turbo.json) for task orchestration:
- Builds have dependency ordering (`dependsOn: ["^build"]`)
- TypeScript compiles to `lib/`; CSS and bundles go to `dist/`
- CSS builds process SCSS files to CSS
- Special handling for the main `uppy` package bundle

### TypeScript Configuration
- Shared base config in `private/tsconfig/` (workspace `@uppy-dev/tsconfig`, extended as `@uppy-dev/tsconfig` / `@uppy-dev/tsconfig/build`)
- Individual packages have `tsconfig.json` and `tsconfig.build.json`
- Build outputs include declaration files (.d.ts) and source maps

## Code Standards

### Linting and Formatting
- **Biome** is used for linting and formatting (replaces ESLint/Prettier)
- Configuration in `biome.json`
- Use single quotes, semicolons as needed
- 2-space indentation

### Framework Integration
- **Preact** for UI components with framework wrappers generated for React, Vue, Svelte
- **TypeScript** throughout the codebase
- Components in `@uppy/components` use Tailwind CSS with `uppy:` prefix

### Plugin Development
- All plugins extend `BasePlugin` or `UIPlugin`
- Plugins must have unique IDs and specify their type
- State management through Uppy's store system
- Event-driven architecture using namespace-emitter

## Testing

### Test Framework
- **Vitest** for unit tests (migrated from Jest)
- **Vitest Browser Mode** for browser testing (migrated from Cypress)
- Unit tests use `.test.{ts,tsx}` extensions and browser tests `.browser.test.{ts,tsx}`

### Running Tests
- `yarn test` runs packages one at a time (`--concurrency=1`) and passes `--browser.headless` to Vitest (most suites use Vitest browser mode)
- It also runs the React, Vue and SvelteKit example tests and `private/tsconfig`
- Use `yarn test` for development

## Companion Server

The Companion server enables integration with remote file sources:
- Handles OAuth flows for providers like Google Drive, Dropbox
- Proxies file downloads to avoid CORS issues
- Provides search functionality for providers
- Located in `packages/@uppy/companion/`; see its `ARCHITECTURE.md`

## Releases

- Uses Changesets. Changes to published packages should add a changeset (`yarn changeset`); CI doesn't enforce it, but the `[ci] release` PR is generated from them
- `yarn run version` / `yarn run release` are run by `.github/workflows/release.yml` on push to `main`, not by hand

## Important Notes

- Never commit sensitive information (API keys, tokens)
- Follow existing code conventions and patterns within each package
- Use `@uppy/core/utils` for shared functionality
- UI components should be accessible and support internationalization
- Always run `yarn check` and `yarn typecheck` before committing
- When adding a new component to `@uppy/components`, you have to run `yarn migrate:components` from root.
  This is not needed for changing existing components.
- More area-specific rules live in `.cursor/rules/` (headless components, Svelte, core)
