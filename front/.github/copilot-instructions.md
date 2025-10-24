# Speed Match Card Game - Frontend Development Guide

## Project Overview
リアルタイム対戦型カードゲーム「Speed Match」のフロントエンド実装。
- **Tech Stack**: React 19 + TypeScript + Vite + React Router + Axios
- **State**: Context API (`PlayerContext`, `RoomContext`, `GameContext`)
- **Styling**: CSS Modules + CSS Variables (design system in `src/styles/variables.css`)
- **API Base**: `http://localhost:8080/api/v1` (configurable via `VITE_API_BASE_URL`)

## Architecture Patterns

### Component Structure
```
src/
├── components/
│   ├── ui/          # Reusable UI primitives (Button, Card, Input, ErrorMessage)
│   ├── layout/      # Layout components (Container, Grid, Header, Footer)
│   └── game/        # Game-specific components (GameBoard, GameCard)
├── contexts/        # React Context providers for global state
├── pages/           # Route-level page components
├── api/             # Axios client + API service functions
├── hooks/           # Custom hooks (useApiError)
└── styles/          # Global CSS (variables, base, utilities)
```

### Key Conventions

**State Management**:
- Use Context API for cross-component state (player info, room state, game state)
- All contexts provide typed hooks: `usePlayer()`, `useRoom()`, `useGame()`
- LocalStorage for persistence: `speedmatch-player` key stores player data

**API Communication** (`src/api/`):
- Centralized `apiClient` with interceptors for error handling
- Unified response type: `ApiResponse<T>` with `success`, `data`, `error` fields
- Custom `ApiError` class for typed error handling
- Service modules per domain: `player.ts`, `room.ts`, `game.ts` (未実装部分あり)

**Component Props**:
- All page components receive `onNavigate: (page: string) => void` callback
- Navigation uses programmatic routing, not `<Link>` components
- Example: `onNavigate('game/ROOM123')` → navigates to `/game/ROOM123`

**Styling**:
- BEM-like class naming: `.btn`, `.btn--primary`, `.btn--loading`
- CSS variables from `variables.css`: `--color-primary-500`, `--shadow-md`, `--radius-lg`
- No CSS-in-JS or Tailwind - pure CSS with design tokens

**TypeScript**:
- Strict mode enabled (`tsconfig.json`)
- Interface for all component props: `export interface ButtonProps extends React.ButtonHTMLAttributes<...>`
- Type exports from API modules: `export interface PlayerResponse { ... }`

## Development Workflow

### Commands
```bash
npm run dev        # Start dev server (Vite HMR on port 5173)
npm run build      # TypeScript check + production build
npm run lint       # ESLint check (auto-fix with --fix)
npm run preview    # Preview production build locally
```

### Critical Files
- **Router**: `App.tsx` - HashRouter with protected routes (redirects unregistered users)
- **API Config**: `src/api/client.ts` - Axios instance with interceptors
- **Design System**: `src/styles/variables.css` - All color/spacing tokens
- **Vite Config**: `vite.config.ts` - S3 deployment optimized (relative paths, no sourcemaps)

## Working with This Codebase

### Before Writing Code
1. **Check Design Docs**: `../docs/` contains API specs, DB schema, system architecture
   - `API仕様書.md`: Complete REST API + WebSocket event specs
   - `デザインシステム.html`: Visual design system reference
   - `開発計画.md`: Development roadmap and phase tracking

2. **Use Serena MCP**: This project uses Serena MCP for semantic code navigation
   - Use symbol-based tools to explore code structure before reading full files
   - Example: Find `PlayerContext` methods before implementing new player features

3. **Browser Testing**: Playwright MCP available for debugging
   - Use `mcp_playwright` tools to test UI interactions if needed

### Adding New Features
1. Define types in API service (`src/api/*.ts`)
2. Update Context if cross-component state needed
3. Create page component in `src/pages/`
4. Add route in `App.tsx` (`<Route path="/new-page" element={...} />`)
5. Implement UI with existing `components/ui/` primitives
6. Follow existing error handling pattern (`useApiError` hook)

### API Integration Pattern
```typescript
// 1. Define types in api service
export interface RoomResponse { id: string; name: string; ... }

// 2. Create service function
export const getRoom = async (roomId: string): Promise<RoomResponse> => {
  const response = await apiClient.get<ApiResponse<RoomResponse>>(`/rooms/${roomId}`);
  return response.data.data!; // Interceptor ensures data exists on success
};

// 3. Use in component with error handling
import { getRoom } from '@/api/room';
import { useApiError } from '@/hooks/useApiError';

const { error, handleApiError } = useApiError();
const [room, setRoom] = useState<RoomResponse | null>(null);

useEffect(() => {
  getRoom(roomId)
    .then(setRoom)
    .catch(handleApiError);
}, [roomId]);
```

### Styling New Components
1. Use CSS variables from `src/styles/variables.css`
2. Create companion `.css` file (e.g., `Button.tsx` → `Button.css`)
3. Follow BEM-style class structure
4. Import CSS in component: `import './Button.css'`

## Current Development Status
- ✅ Phase 0-4: All UI screens implemented (Home, Rooms, Profile, Game, Waiting Room)
- 🔄 Phase 5: Game screen UI (40% complete - basic layout done, game logic partial)
- ❌ Phase 6+: Backend integration pending (API calls return mocks/errors currently)

## Common Pitfalls
- **Don't use absolute imports** - Project uses relative imports (`./`, `../`)
- **HashRouter not BrowserRouter** - For S3 static hosting compatibility
- **No JWT yet** - Auth/token handling prepared but not active
- **API base URL** - Ensure `VITE_API_BASE_URL` matches backend in `.env.local`
- **Context order matters** - `PlayerProvider` wraps `RoomProvider` wraps `Router`

## Related Projects
- **Backend**: `../api/` - Kotlin + Ktor API (Clean Architecture, PostgreSQL)
- **Docs**: `../docs/` - Comprehensive design and API specifications