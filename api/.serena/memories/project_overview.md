# Speed Match Card Game API - プロジェクト概要

## プロジェクトの目的
2〜4人用のリアルタイム対戦型カードマッチングゲーム「Speed Match」のバックエンドAPIを提供する。
WebSocketによるリアルタイム通信、JWT認証、ルーム管理、PostgreSQL永続化を実装する。

## 技術スタック

### フレームワーク・言語
- **Kotlin**: 2.2.20
- **Ktor**: 3.3.0 (Netty Engine)
- **JVM**: 21

### データベース・ORM
- **PostgreSQL**: 42.7.4
- **Exposed ORM**: 0.54.0 (Core, DAO, JDBC, Java Time)
- **HikariCP**: 5.1.0 (コネクションプール)

### ライブラリ
- **Kotlin Serialization**: JSON シリアライゼーション
- **Logback**: 1.4.14 (ログ記録)
- **Ktor Server Plugins**:
  - Content Negotiation (JSON処理)
  - CORS (クロスオリジン)
  - Call Logging (リクエストログ)
  - Config YAML (設定管理)

### テスト
- Ktor Server Test Host
- Kotlin Test JUnit

## プロジェクト構造
クリーンアーキテクチャに基づいた4層構造:

```
src/main/kotlin/com/speedmatch/
├── Application.kt                    # エントリーポイント
├── domain/                           # ドメイン層(ビジネスロジック)
│   ├── model/                        # エンティティ
│   ├── valueobject/                  # 値オブジェクト
│   ├── repository/                   # リポジトリインターフェース
│   ├── service/                      # ドメインサービス
│   └── exception/                    # ドメイン例外
├── application/                      # アプリケーション層
│   ├── usecase/                      # ユースケース
│   ├── service/                      # アプリケーションサービス
│   └── dto/                          # データ転送オブジェクト
├── infrastructure/                   # インフラ層
│   ├── persistence/                  # データベース
│   │   ├── DatabaseFactory.kt
│   │   ├── table/                    # Exposed テーブル定義
│   │   └── repository/               # リポジトリ実装
│   └── websocket/                    # WebSocket管理
└── presentation/                     # プレゼンテーション層
    ├── routes/                       # ルート定義
    ├── request/                      # リクエストDTO
    ├── response/                     # レスポンスDTO
    ├── mapper/                       # マッパー
    └── plugin/                       # Ktorプラグイン設定
```

## 主要ドキュメント
- `CLEAN_ARCHITECTURE_GUIDE.md`: クリーンアーキテクチャ実装ガイド(詳細)
- `docs/API仕様書.md`: 完全なREST API仕様 + WebSocketイベント
- `docs/システム構成.md`: システムアーキテクチャ
- `docs/機能一覧.md`: 機能要件
- `docs/バックエンド環境設定.md`: 環境設定詳細
- `docs/DB設計.md`: データベーススキーマ
- `.github/copilot-instructions.md`: AI開発ガイド

## エントリーポイント
- **mainClass**: `io.ktor.server.netty.EngineMain`
- **Application.module()**: プラグイン設定とモジュールワイヤリング
  - configureLogging()
  - configureSerialization()
  - configureCORS()
  - configureDatabase()
  - configureSwagger()
  - configureRouting()

## 設定ファイル
- `src/main/resources/application.yaml`: メイン設定
  - デフォルトポート: 8080
  - PostgreSQL接続設定
  - モジュール: `com.speedmatch.ApplicationKt.module`

## 開発状況 (2025-10-22時点)
- ✅ Phase 0-4: フロントエンドUI完了
- 🔄 Phase 5: ゲーム画面UI (40%完了)
- ❌ **Phase 6+: バックエンド実装未着手 (現在の最優先事項)**

## 次の実装タスク (Phase 6 - Backend Foundation)
1. Kotlin/Ktorサーバー + PostgreSQL セットアップ
2. データモデル実装 (Players, Rooms, Gamesテーブル)
3. 基本CRUD API作成 (`docs/API仕様書.md`に従う)
4. フロントエンドのモックデータを実APIに置き換え
