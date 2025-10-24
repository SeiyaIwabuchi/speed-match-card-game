# プロジェクト構造詳細

## ディレクトリ構成

```
api/
├── src/
│   ├── main/
│   │   ├── kotlin/com/speedmatch/
│   │   │   ├── Application.kt              # エントリーポイント (mainClass: io.ktor.server.netty.EngineMain)
│   │   │   │
│   │   │   ├── domain/                     # ドメイン層 - ビジネスロジックの中核
│   │   │   │   ├── model/                  # エンティティ (Player, Room, Game, Card)
│   │   │   │   ├── valueobject/            # 値オブジェクト (PlayerId, RoomCode, PlayerName, CardNumber)
│   │   │   │   ├── repository/             # リポジトリインターフェース (PlayerRepository, RoomRepository, GameRepository)
│   │   │   │   ├── service/                # ドメインサービス (GameRuleService, RoomCodeGenerator)
│   │   │   │   └── exception/              # ドメイン例外 (PlayerNotFoundException, InvalidCardPlayException)
│   │   │   │
│   │   │   ├── application/                # アプリケーション層 - ユースケース調整
│   │   │   │   ├── usecase/
│   │   │   │   │   ├── player/             # プレイヤー関連 (CreatePlayerUseCase, GetPlayerUseCase, UpdatePlayerUseCase)
│   │   │   │   │   ├── room/               # ルーム関連 (CreateRoomUseCase, JoinRoomUseCase, LeaveRoomUseCase)
│   │   │   │   │   └── game/               # ゲーム関連 (StartGameUseCase, PlayCardUseCase, DrawCardUseCase)
│   │   │   │   ├── service/                # アプリケーションサービス (TransactionManager, EventPublisher)
│   │   │   │   └── dto/                    # DTO (PlayerDto, RoomDto, GameDto)
│   │   │   │
│   │   │   ├── infrastructure/             # インフラ層 - 外部連携
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── DatabaseFactory.kt  # DB接続管理 (HikariCP)
│   │   │   │   │   ├── table/              # Exposedテーブル定義
│   │   │   │   │   │   ├── Players.kt
│   │   │   │   │   │   ├── Rooms.kt
│   │   │   │   │   │   ├── Games.kt
│   │   │   │   │   │   └── Cards.kt
│   │   │   │   │   └── repository/         # リポジトリ実装
│   │   │   │   │       ├── PlayerRepositoryImpl.kt
│   │   │   │   │       ├── RoomRepositoryImpl.kt
│   │   │   │   │       └── GameRepositoryImpl.kt
│   │   │   │   └── websocket/              # WebSocket管理
│   │   │   │       ├── WebSocketManager.kt
│   │   │   │       └── GameSessionManager.kt
│   │   │   │
│   │   │   └── presentation/               # プレゼンテーション層 - HTTP通信
│   │   │       ├── routes/                 # ルート定義
│   │   │       │   ├── PlayerRoutes.kt
│   │   │       │   ├── RoomRoutes.kt
│   │   │       │   ├── GameRoutes.kt
│   │   │       │   └── WebSocketRoutes.kt
│   │   │       ├── request/                # リクエストDTO
│   │   │       │   ├── CreatePlayerRequest.kt
│   │   │       │   ├── CreateRoomRequest.kt
│   │   │       │   └── PlayCardRequest.kt
│   │   │       ├── response/               # レスポンスDTO
│   │   │       │   ├── PlayerResponse.kt
│   │   │       │   ├── RoomResponse.kt
│   │   │       │   ├── GameResponse.kt
│   │   │       │   └── ErrorResponse.kt
│   │   │       ├── mapper/                 # エンティティ⇔DTO変換
│   │   │       │   ├── PlayerMapper.kt
│   │   │       │   ├── RoomMapper.kt
│   │   │       │   └── GameMapper.kt
│   │   │       └── plugin/                 # Ktorプラグイン設定
│   │   │           ├── Routing.kt          # ルーティング設定
│   │   │           ├── Serialization.kt    # JSON設定
│   │   │           ├── CORS.kt             # CORS設定
│   │   │           ├── Logging.kt          # ロギング設定
│   │   │           ├── Database.kt         # DB初期化
│   │   │           ├── Swagger.kt          # Swagger UI設定
│   │   │           └── StatusPages.kt      # エラーハンドリング
│   │   │
│   │   └── resources/
│   │       ├── application.yaml            # メイン設定 (ポート8080, PostgreSQL接続)
│   │       ├── logback.xml                 # ログ設定
│   │       └── openapi/
│   │           └── documentation.yaml      # OpenAPI仕様 (Swagger UIで使用)
│   │
│   └── test/
│       └── kotlin/com/speedmatch/
│           ├── domain/                     # ドメイン層ユニットテスト
│           ├── application/                # アプリケーション層テスト (MockK使用)
│           └── infrastructure/             # インフラ層統合テスト (H2など)
│
├── build/                                  # ビルド成果物 (自動生成)
│   ├── classes/
│   ├── libs/                               # JAR出力先
│   └── resources/
│
├── docker/
│   └── postgres/
│       └── init.sql                        # PostgreSQL初期化スクリプト
│
├── gradle/
│   ├── libs.versions.toml                  # 依存関係バージョン管理
│   └── wrapper/
│
├── build.gradle.kts                        # Gradleビルド設定
├── settings.gradle.kts
├── gradle.properties
├── gradlew                                 # Gradle Wrapper (Unix)
├── gradlew.bat                             # Gradle Wrapper (Windows)
├── docker-compose.yml                      # Docker Compose設定 (PostgreSQL)
├── README.md                               # プロジェクト概要
└── CLEAN_ARCHITECTURE_GUIDE.md             # アーキテクチャガイド (詳細)
```

## 主要ファイル

### Application.kt
エントリーポイント。各プラグインの設定を呼び出す。
```kotlin
fun Application.module() {
    configureLogging()
    configureSerialization()
    configureCORS()
    configureDatabase()
    configureSwagger()
    configureRouting()
}
```

### application.yaml
Ktor設定とデータベース接続情報。
- ポート: 8080
- モジュール: `com.speedmatch.ApplicationKt.module`
- PostgreSQL: localhost:5432/speedmatch_dev

### libs.versions.toml
全ライブラリのバージョン一元管理:
- Kotlin: 2.2.20
- Ktor: 3.3.0
- Exposed: 0.54.0
- PostgreSQL: 42.7.4

### build.gradle.kts
ビルド設定・依存関係定義。
- mainClass: `io.ktor.server.netty.EngineMain`
- JVM Toolchain: 21

## 現在の実装状況

### 実装済み
- ✅ プロジェクト基盤 (Ktor, Gradle設定)
- ✅ Swagger UI (`/swagger`, `/openapi.yaml`)
- ✅ 基本ルーティング (`/` Hello World)
- ✅ CORS, ロギング, シリアライゼーション設定
- ✅ データベース設定基盤

### 未実装 (Phase 6以降)
- ❌ Domain層 (エンティティ, 値オブジェクト, リポジトリIF)
- ❌ Application層 (ユースケース)
- ❌ Infrastructure層 (リポジトリ実装, DB接続)
- ❌ Presentation層 (REST API, WebSocketルート)
- ❌ PostgreSQLテーブル作成・マイグレーション
- ❌ JWT認証
- ❌ WebSocketリアルタイム通信

## クリーンアーキテクチャ依存関係

```
┌─────────────────────────────────────────┐
│   Presentation (Routes, DTOs, Plugins)  │ ← HTTPリクエスト/レスポンス
└───────────────┬─────────────────────────┘
                │ 依存
                ↓
┌─────────────────────────────────────────┐
│   Application (UseCases, Services)      │ ← ビジネスフロー調整
└───────────────┬─────────────────────────┘
                │ 依存
                ↓
┌─────────────────────────────────────────┐
│   Domain (Entities, VOs, Interfaces)    │ ← ビジネスロジック中核
└───────────────┬─────────────────────────┘
                │ 実装される
                ↓
┌─────────────────────────────────────────┐
│   Infrastructure (DB, WebSocket, etc.)  │ ← 外部連携
└─────────────────────────────────────────┘
```

**重要原則:**
- Domain層は他のどのレイヤーにも依存しない
- リポジトリインターフェースはDomain層で定義
- Infrastructure層がそれを実装
