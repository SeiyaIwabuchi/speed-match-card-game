# Task Completion Checklist

When completing a task in this project, follow these steps:

## 1. Code Quality Checks

### Run Linting
```powershell
npm run lint
```
Ensure there are no ESLint errors or warnings. Fix any issues before committing.

### Type Check
The build command includes TypeScript compilation:
```powershell
npm run build
```
This will fail if there are TypeScript errors. Ensure all type errors are resolved.

## 2. Testing

### Manual Testing
```powershell
npm run dev
```
- Start the development server
- Test the changes in the browser
- Verify Hot Module Replacement works correctly
- Check for console errors or warnings

### Production Build Test
```powershell
npm run build
npm run preview
```
- Build the production bundle
- Preview the production build
- Ensure everything works as expected in production mode

## 3. Code Style Verification

- Ensure code follows TypeScript strict mode requirements
- Check that no unused variables or parameters exist
- Verify imports are organized and necessary
- Confirm component naming follows PascalCase convention
- Ensure proper use of React Hooks

## 4. File Organization

- New components should be in `src/` directory
- Static assets in `public/` for public path references
- React-specific assets in `src/assets/`
- Styles co-located with components or in dedicated CSS files

## 5. Version Control

Before committing:
```powershell
git status
git add .
git commit -m "descriptive message"
```

## 6. Documentation

- Update README.md if adding major features
- Add comments for complex logic
- Update type definitions if modifying interfaces

## Common Issues to Check

- **Import paths**: Use correct relative paths for local imports
- **Public assets**: Reference with `/` prefix (e.g., `/vite.svg`)
- **React imports**: Modern React doesn't require `import React` for JSX
- **Unused imports**: ESLint will flag these - remove them
- **Type safety**: Ensure all TypeScript errors are resolved