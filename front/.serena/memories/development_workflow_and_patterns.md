# Development Workflow and Patterns

## React Patterns Used

### Functional Components
The project exclusively uses functional components with React Hooks:
```tsx
function App() {
  const [count, setCount] = useState(0)
  // Component logic
  return (...)
}
```

### State Management
- Uses React's `useState` hook for local component state
- No global state management library currently in use
- State updates use functional updates when based on previous state: `setCount((count) => count + 1)`

### Component Export
- Default exports for main components: `export default App`
- Named exports can be used for utilities and helper functions

## Vite-Specific Patterns

### Asset Imports
- **Static assets in public folder**: Reference with absolute path `/vite.svg`
- **Assets in src folder**: Import as modules `import reactLogo from './assets/react.svg'`

### Hot Module Replacement (HMR)
- Vite provides automatic HMR for React components
- Changes to `.tsx` files trigger fast refresh without full page reload
- CSS changes are applied instantly

### Environment Variables
- Use `import.meta.env` for environment variables
- Prefix with `VITE_` to expose to client code
- Example: `import.meta.env.VITE_API_URL`

## Project-Specific Guidelines

### StrictMode Usage
The application is wrapped in `StrictMode`:
```tsx
<StrictMode>
  <App />
</StrictMode>
```
This enables additional development checks and warnings.

### Non-null Assertions
The codebase uses non-null assertions when the DOM element is guaranteed to exist:
```tsx
createRoot(document.getElementById('root')!)
```

### Event Handlers
Inline arrow functions are acceptable for simple event handlers:
```tsx
<button onClick={() => setCount((count) => count + 1)}>
```

## Build and Bundle Considerations

### No Emit Mode
TypeScript is configured with `noEmit: true` because Vite handles the bundling and transpilation. TypeScript is only used for type checking.

### Module Resolution
Uses bundler module resolution which allows:
- Importing `.ts`/`.tsx` files with extensions
- Path aliases (if configured in vite.config.ts and tsconfig.json)
- Automatic resolution of node_modules

### Code Splitting
Vite automatically handles code splitting for optimal bundle sizes. Dynamic imports can be used for route-based or component-based splitting if needed.

## Design Patterns to Follow

1. **Component Composition**: Build complex UIs from smaller, reusable components
2. **Single Responsibility**: Each component should have one clear purpose
3. **Props and State**: Keep components pure when possible, lift state up when needed
4. **Type Safety**: Always define types for props and complex state objects
5. **CSS Modules**: Co-locate styles with components using CSS imports

## Future Considerations

The README suggests that for production applications, consider:
- Type-aware ESLint rules (`recommendedTypeChecked`)
- Additional React-specific linting with `eslint-plugin-react-x` and `eslint-plugin-react-dom`
- React Compiler (currently not enabled due to performance impact)