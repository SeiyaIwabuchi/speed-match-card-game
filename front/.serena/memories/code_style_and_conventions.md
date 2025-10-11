# Code Style and Conventions

## TypeScript Configuration
The project uses **strict TypeScript** settings with the following key configurations:

### Compiler Options (tsconfig.app.json)
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx (automatic runtime)
- **Strict Mode**: Enabled
- **Additional Strict Checks**:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`
  - `noUncheckedSideEffectImports: true`
- **Bundler-specific**:
  - `allowImportingTsExtensions: true`
  - `verbatimModuleSyntax: true`
  - `noEmit: true` (Vite handles bundling)

## ESLint Configuration
Uses ESLint 9 with flat config format:

### Enabled Configurations
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` recommended-latest
- `eslint-plugin-react-refresh` vite config

### Ignored Paths
- `dist/` directory

## Code Conventions

### File Naming
- React components: PascalCase with `.tsx` extension (e.g., `App.tsx`)
- Configuration files: lowercase with extensions (e.g., `vite.config.ts`, `eslint.config.js`)
- Style files: lowercase with `.css` extension (e.g., `index.css`, `App.css`)

### Component Structure
- Functional components using React Hooks
- Use of `StrictMode` in production builds
- Default exports for main components
- Import React hooks explicitly (e.g., `import { useState } from 'react'`)

### TypeScript Style
- Use TypeScript's strict mode
- No unused variables or parameters
- Explicit type annotations where needed
- Non-null assertion operator (`!`) used when necessary (e.g., `document.getElementById('root')!`)

### Import Style
- Named imports for React hooks and utilities
- Default imports for components
- Asset imports using relative paths (e.g., `'./assets/react.svg'`)
- Public folder assets referenced with absolute path (e.g., `'/vite.svg'`)

### JSX Style
- Self-closing tags for elements without children
- Fragment shorthand (`<>...</>`) for grouping elements
- Arrow functions for event handlers (e.g., `onClick={() => ...}`)
- className for CSS classes (React convention)