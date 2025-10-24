<!--
This file provides concise, actionable guidance for AI coding assistants working on the
`speed-match-card-game` API module. Keep it short and concrete: reference files, patterns,
and common tasks discovered in the repo.
-->

# Copilot / AI instructions — speed-match-card-game (API)

Short, actionable guidance to help an AI agent be productive in this Kotlin Ktor project.

- **Project type**: Real-time multiplayer card game API (Speed Match). Kotlin Ktor web server with entry point: `src/main/kotlin/com/speedmatch/Application.kt`.
- **Runtime**: uses Ktor Netty Engine (mainClass = `io.ktor.server.netty.EngineMain`). App modules are configured in `application.yaml`.
- **Game domain**: 2-4 player card matching game with WebSocket real-time communication, JWT auth, room management, and PostgreSQL persistence (planned).

- **Key directories/files**:
  - `src/main/kotlin/com/speedmatch/` — application code. See `Application.kt` for module wiring.
  - `src/main/kotlin/com/speedmatch/presentation/plugin/Routing.kt` — primary HTTP routes (example: GET `/` responds "Hello World!").
  - `src/main/kotlin/com/speedmatch/presentation/plugin/Swagger.kt` — serves OpenAPI spec and a small Swagger UI at `/openapi.yaml` and `/swagger`.
  - `src/main/resources/openapi/documentation.yaml` — OpenAPI spec loaded by Swagger plugin.
  - `docs/` — **CRITICAL**: Contains complete API specs (`API仕様書.md`), system architecture (`システム構成.md`), feature requirements (`機能一覧.md`), and environment configs (`バックエンド環境設定.md`). Reference these for implementation details.
  - `build.gradle.kts` and `gradle/libs.versions.toml` (in `gradle/`) — dependency/version definitions.

- Build / run / test (developer flows the agent should use or suggest):
  - Build: run `./gradlew build` (or `gradlew.bat build` on Windows). Produces standard JVM artifacts.
  - Run locally (dev): `./gradlew run` starts Ktor Netty using `application.yaml` (listens on port 8080 by default).
  - Run tests: `./gradlew test`.
  - Create fat JAR for container: `./gradlew buildFatJar` or `./gradlew buildImage` to produce a Docker image.

- **Coding patterns and conventions** (observed, not aspirational):
  - Modules are wired by calling small configure*() functions from `Application.module()` (e.g., `configureSwagger()`, `configureRouting()`). Follow this pattern when adding new plugins.
  - Simple routing uses Ktor's `routing { get("/") { ... } }`. New endpoints should be added under `presentation/plugin` in new files when appropriate.
  - Static OpenAPI is served from resources via `classLoader.getResource("openapi/documentation.yaml")`. Prefer adding/updating that YAML for API surface changes.
  - Environment-specific configs: Use `application-{profile}.yaml` files (development/staging/production) as shown in `docs/バックエンド環境設定.md`.

- **API / Integration notes**:
  - Swagger UI references `/openapi.yaml`. Keep the resource path `resources/openapi/documentation.yaml` in sync.
  - **Target API structure**: See `docs/API仕様書.md` for complete REST endpoints (players, rooms, gameplay, chat, stats) + WebSocket events.
  - **Authentication**: JWT-based auth planned (`Authorization: Bearer {token}`).
  - **Database**: PostgreSQL integration planned. Use environment configs for connection details.

- **Development tools**:
  - **Serena MCP**: Use for advanced code analysis, symbol navigation, and intelligent code editing within the Kotlin/Ktor codebase.
  - **Playwright MCP**: Use for automated testing of web endpoints, API testing, and browser-based testing of the Swagger UI.

- Quick examples to reference when editing code:
  - Add a GET route: see `Routing.kt` — use `call.respondText("...")` or other `call.respond*` helpers.
  - Return OpenAPI content: `val openApiSpec = this::class.java.classLoader.getResource("openapi/documentation.yaml")?.readText()`

- When making changes, prefer minimal, focused edits and update `README.md` or `openapi/documentation.yaml` when behaviour changes. Run `./gradlew test` after edits.

**Implementation priorities** (based on docs):
1. **Player management**: Registration, profiles, authentication (JWT)
2. **Room system**: Create/join rooms, lobby management
3. **Game engine**: Card matching logic, turn management, WebSocket real-time updates
4. **Persistence**: PostgreSQL for players/rooms/game state

**Development status** (as of 2025-10-15):
- ✅ Phase 0-4: Frontend UI completed (player registration, room list, game UI mockups)
- 🔄 Phase 5: Game screen UI (40% complete)
- ❌ Phase 6+: Backend implementation not started - **THIS IS THE CURRENT PRIORITY**

**Next immediate tasks** (Phase 6 - Backend Foundation):
- Set up Kotlin/Ktor server with PostgreSQL
- Implement data models (Players, Rooms, Games tables)
- Create basic CRUD APIs following `docs/API仕様書.md`
- Replace frontend mock data with real API calls

If anything here is unclear or you need conventions for adding persistence, background jobs, or auth, ask for the preferred approach and I will update this guidance.
