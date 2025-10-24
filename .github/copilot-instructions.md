# Speed Match Card Game - AI Coding Assistant Instructions

## Project Overview
Speed Match is a real-time multiplayer card game for 2-4 players. Players compete to play all their cards first by matching numbers (±1 or same value). Built with React frontend, Kotlin Ktor backend, and PostgreSQL database.

**Key Features:**
- Player registration and profiles with avatars
- Room creation/joining with 6-digit codes
- Real-time gameplay via WebSocket
- Chat system
- Statistics and rankings

## Architecture
- **Frontend**: React + TypeScript + Vite, hosted on AWS S3
- **Backend**: Kotlin + Ktor + Exposed ORM, PostgreSQL, Docker
- **Infrastructure**: AWS EC2, Docker Compose, Nginx reverse proxy
- **CI/CD**: AWS CodePipeline + CodeBuild

**Data Flow:**
1. Frontend makes REST API calls to backend
2. Real-time game events via WebSocket
3. Persistent data stored in PostgreSQL

## Key Files & Directories
- `front/src/components/` - UI components (game/, layout/, ui/)
- `front/src/contexts/` - React contexts (GameContext, PlayerContext, RoomContext)
- `front/src/pages/` - Page components (HomePage, GamePage, etc.)
- `api/src/main/kotlin/com/speedmatch/` - Kotlin application code
- `api/src/main/resources/openapi/documentation.yaml` - OpenAPI spec
- `docs/` - Complete specifications (API, DB design, system architecture)
- `container/dev/docker-compose.yml` - Local development setup

## Development Workflows
- **Frontend**: `cd front && npm start` (dev server on :3000)
- **Backend**: `cd api && ./gradlew run` (Ktor on :8080, Swagger at /swagger)
- **Database**: PostgreSQL via Docker Compose
- **Build**: `./gradlew buildFatJar` for backend, `npm run build` for frontend
- **Test**: `./gradlew test` for backend
- **Debug**: Use Swagger UI for API testing, browser dev tools for frontend

## Coding Patterns
- **Frontend Components**: Functional components with hooks, CSS modules
- **Backend Routing**: Ktor routing DSL in `Routing.kt`, configure in `Application.kt`
- **Database**: Exposed ORM with DAO pattern
- **State Management**: React Context for global state (game, player, room)
- **API Responses**: JSON with success/error structure
- **WebSocket**: For real-time game events and chat

## Integration Points
- **API Calls**: Fetch/Axios from frontend to backend endpoints
- **WebSocket**: Real-time communication for gameplay
- **Database**: Exposed framework for type-safe queries
- **Authentication**: JWT-based (planned)
- **External Services**: AWS S3 for static hosting

## Development Status & Priorities
- ✅ Frontend UI completed (player registration, rooms, game mockups)
- 🔄 Game screen UI (40% complete)
- ❌ Backend implementation (current priority)

**Immediate Tasks:**
1. Set up Kotlin/Ktor server with PostgreSQL
2. Implement player/room CRUD APIs per `docs/API仕様書.md`
3. Add WebSocket support for real-time gameplay
4. Integrate frontend with real backend APIs

## Tools & Best Practices
- Use Serena MCP for intelligent code analysis and editing
- Reference `docs/` for all specifications before implementation
- Follow existing patterns in codebase
- Run tests after changes: `./gradlew test`
- Update OpenAPI spec when changing API surface

When making changes, prefer minimal edits and update relevant docs. If anything is unclear, ask for clarification before proceeding.