# 🎮 スピードマッチ (Speed Match)

リアルタイム対戦型カードゲームWebアプリケーション

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-in%20development-yellow.svg)

## 📖 概要

**スピードマッチ**は、2〜4人でプレイできるシンプルで楽しいオンライン対戦カードゲームです。友達を招待してプライベートルームで遊んだり、公開ルームで知らない人と対戦したりできます。

### 🎯 ゲームルール

- 1〜13の数字カードを使用
- 場のカードより **±1以内の数字** または **同じ数字** のカードを手札から出せる
- 最初に手札を全て出し切ったプレイヤーが勝利
- ターン制で順番にカードをプレイ

## ✨ 主な機能

### プレイヤー管理
- 👤 プレイヤー登録・編集
- 🎨 アバターカスタマイズ
- 📊 プレイ統計（総対戦数、勝率、最速クリア記録）

### ルーム機能
- 🏠 ルーム作成（カスタマイズ可能）
  - 最大プレイヤー数（2〜4人）
  - 初期手札枚数（5〜10枚）
  - ターン制限時間設定
  - 公開/非公開設定
- 🔑 6桁ルームコードで友達招待
- 📋 公開ルーム一覧
- 💬 ルーム待機画面でのチャット

### ゲームプレイ
- ⚡ リアルタイム対戦
- 🎴 直感的なカード操作
- 📈 ゲーム進行状況の可視化
- 🏆 リザルト表示

## 🏗️ 技術スタック

### フロントエンド
- **React** - UIフレームワーク
- **TypeScript** - 型安全な開発
- ホスティング: AWS S3

### バックエンド
- **Kotlin** + **Ktor** - APIサーバー
- **Exposed** - ORM
- **PostgreSQL 15** - データベース
- **Docker Compose** - コンテナオーケストレーション
- **Nginx** - リバースプロキシ
- **Gradle Shadow** - Fat JAR生成

### インフラ
- **AWS EC2** (t3.micro) - アプリケーションサーバー
- **AWS S3** - 静的ファイルホスティング
- **AWS CodePipeline** - CI/CD（並列ビルド）
- **AWS CodeBuild** - ビルド自動化

### 月額コスト
約 **$0-1** (AWS無料枠を活用)

## 📁 プロジェクト構造

```
speed-match-card-game/
├── front/                    # フロントエンド (React + TypeScript + Vite)
├── api/                      # バックエンドAPI (Kotlin + Ktor)
├── container/                # Docker設定ファイル
├── buildspec-frontend.yml    # CodeBuild設定 (Frontend)
├── buildspec-backend.yml     # CodeBuild設定 (Backend)
└── docs/                     # プロジェクトドキュメント
    ├── 企画書.md
    ├── 機能一覧.md
    ├── 画面一覧.md
    ├── 画面遷移図.md
    ├── システム構成.md
    ├── DB設計.md
    ├── API仕様書.md
    ├── デザインシステム.html
    └── codepipeline-setup.md  # CI/CD設定ガイド
```

## 🚀 セットアップ

### 必要要件
- Node.js 18.x以上
- Docker & Docker Compose
- PostgreSQL 15（または Docker使用）

### フロントエンド

```bash
cd front
npm install
npm start
```

ブラウザで `http://localhost:3000` を開きます。

### バックエンド

```bash
cd api
./gradlew run
```

APIサーバーは `http://localhost:8080` で起動します。

Swagger UIは `http://localhost:8080/swagger` でアクセスできます。

### Docker Compose

```bash
cd container
docker-compose up -d
```

## 📊 データベース設計

### 主要テーブル
- **players** - プレイヤー情報
- **rooms** - ゲームルーム
- **games** - ゲーム進行状況
- **room_players** - ルーム参加者
- **game_players** - ゲームプレイヤー状態
- **game_actions** - ゲームアクション履歴
- **chat_messages** - チャットメッセージ

詳細は [DB設計.md](./docs/DB設計.md) を参照してください。

## 🎨 デザイン

- UIコンポーネント: カスタムデザインシステム
- カラーパレット: ゲームらしい明るく楽しい配色
- レスポンシブデザイン対応

デザイン仕様は [デザインシステム.html](./docs/デザインシステム.html) を参照してください。

## 📖 ドキュメント

- [企画書](./docs/企画書.md) - プロジェクトの企画とコンセプト
- [機能一覧](./docs/機能一覧.md) - 実装機能の詳細
- [画面一覧](./docs/画面一覧.md) - 全画面の概要
- [画面遷移図](./docs/画面遷移図.md) - 画面フロー
- [システム構成](./docs/システム構成.md) - インフラとアーキテクチャ
- [DB設計](./docs/DB設計.md) - データベーススキーマ
- [API仕様書](./docs/API仕様書.md) - REST API仕様

## 🛠️ 開発状況

- [x] 企画・設計
- [x] ドキュメント作成
- [x] システム構成設計
- [x] DB設計
- [ ] フロントエンド実装
- [ ] バックエンド実装
- [ ] Docker環境構築
- [ ] AWS環境構築
- [ ] CI/CD構築

## 🤝 コントリビューション

現在は個人開発プロジェクトですが、Issue や Pull Request は歓迎します！

## 📄 ライセンス

MIT License

## 👤 作者

開発者: [@0123o](https://github.com/0123o)

## 🙏 謝辞

このプロジェクトは、シンプルで楽しいオンラインゲーム体験を提供することを目指して開発されています。

---

**楽しいゲーム体験を！** 🎉
