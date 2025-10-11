# Suggested Commands

## Development Commands

### Start Development Server
```powershell
npm run dev
```
Starts the Vite development server with Hot Module Replacement (HMR). The application will typically be available at `http://localhost:5173`.

### Build for Production
```powershell
npm run build
```
Compiles TypeScript (`tsc -b`) and builds the production bundle with Vite. Output is generated in the `dist/` directory.

### Preview Production Build
```powershell
npm run preview
```
Serves the production build locally for testing before deployment.

### Linting
```powershell
npm run lint
```
Runs ESLint on all TypeScript and TSX files to check for code quality issues.

## Package Management

### Install Dependencies
```powershell
npm install
```

### Add New Dependency
```powershell
npm install <package-name>
```

### Add New Dev Dependency
```powershell
npm install -D <package-name>
```

## Windows System Utilities

Since this project is on Windows, here are common PowerShell commands:

### File System Navigation
- `cd <path>` - Change directory
- `ls` or `dir` - List directory contents
- `Get-ChildItem -Recurse` - List files recursively
- `mkdir <name>` - Create directory
- `Remove-Item <path>` - Delete file or directory

### File Operations
- `cat <file>` or `Get-Content <file>` - View file contents
- `echo <text> > <file>` - Write to file
- `Copy-Item <source> <dest>` - Copy files
- `Move-Item <source> <dest>` - Move files

### Search
- `Select-String -Path <file> -Pattern <pattern>` - Search in files (like grep)
- `Get-ChildItem -Recurse -Filter <pattern>` - Find files by pattern

### Git Commands
- `git status` - Check repository status
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git push` - Push to remote
- `git pull` - Pull from remote
- `git branch` - List branches
- `git checkout <branch>` - Switch branches

## Notes
- The project uses `npm` as the package manager
- Vite provides fast HMR during development
- All npm scripts are defined in `package.json`