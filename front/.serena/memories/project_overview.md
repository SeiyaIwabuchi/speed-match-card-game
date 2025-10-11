# Project Overview

## Project Name
Speed Match Card Game - Frontend

## Purpose
This is the frontend application for a speed match card game. It's built as a modern React web application using Vite as the build tool and development server.

## Tech Stack
- **Framework**: React 19.1.1
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Package Manager**: npm (with package-lock.json)
- **Linting**: ESLint 9.36.0
- **React Type Definitions**: @types/react and @types/react-dom

## Project Structure
```
front/
├── public/           # Static assets
│   └── vite.svg
├── src/             # Source code
│   ├── assets/      # React assets (images, etc.)
│   │   └── react.svg
│   ├── App.tsx      # Main App component
│   ├── App.css      # App styles
│   ├── main.tsx     # Application entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── package.json     # Dependencies and scripts
├── vite.config.ts   # Vite configuration
├── eslint.config.js # ESLint configuration
├── tsconfig.json    # TypeScript project references
├── tsconfig.app.json    # TypeScript app configuration
├── tsconfig.node.json   # TypeScript node configuration
└── README.md        # Project documentation
```

## Entry Point
- `index.html` - HTML template with root div
- `src/main.tsx` - React application bootstrap with StrictMode
- `src/App.tsx` - Main application component