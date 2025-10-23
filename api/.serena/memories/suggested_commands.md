# 推奨コマンド (Windows PowerShell)

## ビルド・実行コマンド

### ビルド
```powershell
# 全体ビルド
.\gradlew build

# テスト実行
.\gradlew test

# Fat JAR作成 (全依存関係を含む実行可能JAR)
.\gradlew buildFatJar

# Dockerイメージビルド
.\gradlew buildImage

# Dockerイメージをローカルレジストリに公開
.\gradlew publishImageToLocalRegistry
```

### 開発サーバー実行
```powershell
# Ktorサーバー起動 (http://localhost:8080)
.\gradlew run

# Docker経由で実行
.\gradlew runDocker
```

**成功時の出力例:**
```
2024-12-04 14:32:45.584 [main] INFO  Application - Application started in 0.303 seconds.
2024-12-04 14:32:45.682 [main] INFO  Application - Responding at http://0.0.0.0:8080
```

## データベースコマンド

### Docker Compose (PostgreSQL)
```powershell
# PostgreSQLコンテナ起動
docker-compose up -d

# ログ確認
docker-compose logs -f postgres

# コンテナ停止
docker-compose down

# データボリュームも削除
docker-compose down -v
```

### PostgreSQL直接接続
```powershell
# psql経由で接続
docker exec -it <container_name> psql -U speedmatch_user -d speedmatch_dev

# またはローカルpsqlから
psql -h localhost -p 5432 -U speedmatch_user -d speedmatch_dev
```

## クリーンアップ

### Gradleビルドキャッシュクリア
```powershell
.\gradlew clean
```

### 完全クリーンアップ
```powershell
# ビルド成果物削除
Remove-Item -Recurse -Force build

# Gradleキャッシュクリア
.\gradlew clean
```

## Git操作

### 基本フロー
```powershell
# ステータス確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "feat: implement player CRUD API"

# プッシュ
git push origin main

# プル (最新取得)
git pull origin main
```

### ブランチ操作
```powershell
# 新規ブランチ作成・切り替え
git checkout -b feature/player-api

# ブランチ一覧
git branch

# ブランチ切り替え
git checkout main
```

## Windows ユーティリティコマンド

### ファイル・ディレクトリ操作
```powershell
# ディレクトリ内容表示
Get-ChildItem (または ls)

# ディレクトリ移動
Set-Location .\src\main\kotlin (または cd)

# ファイル内容表示
Get-Content README.md (または cat)

# ファイル検索
Get-ChildItem -Recurse -Filter "*.kt"

# 文字列検索 (grep相当)
Select-String -Path "*.kt" -Pattern "Player"
```

### プロセス・ポート確認
```powershell
# ポート8080を使用しているプロセス確認
Get-NetTCPConnection -LocalPort 8080

# プロセス終了
Stop-Process -Id <PID>

# または
taskkill /PID <PID> /F
```

## OpenAPI / Swagger

### Swagger UI アクセス
```powershell
# サーバー起動後、ブラウザで開く
Start-Process "http://localhost:8080/swagger"

# OpenAPI仕様取得
Invoke-WebRequest -Uri "http://localhost:8080/openapi.yaml"
```

## 依存関係管理

### Gradle依存関係確認
```powershell
# 依存関係ツリー表示
.\gradlew dependencies

# 依存関係の更新確認
.\gradlew dependencyUpdates
```

## トラブルシューティング

### ポート衝突時
```powershell
# 8080ポート使用プロセス確認
netstat -ano | findstr :8080

# プロセス終了
taskkill /PID <PID> /F
```

### JVMヒープ調整
```powershell
# Gradleヒープサイズ増加
$env:GRADLE_OPTS="-Xmx2g -Xms512m"
.\gradlew build
```

### 環境変数確認
```powershell
# JAVA_HOME確認
$env:JAVA_HOME

# PATH確認
$env:PATH
```

## クイック開発フロー

### 通常の開発サイクル
```powershell
# 1. コード編集後、テスト実行
.\gradlew test

# 2. ビルド
.\gradlew build

# 3. ローカルサーバー起動
.\gradlew run

# 4. Swagger UIで動作確認
# http://localhost:8080/swagger
```

### ホットリロード開発 (推奨)
```powershell
# Ktor Auto-Reload有効化して起動
.\gradlew run --continuous
```

## コードフォーマット・リント

### Kotlinフォーマット (ktlint導入時)
```powershell
# フォーマットチェック
.\gradlew ktlintCheck

# 自動フォーマット
.\gradlew ktlintFormat
```

## ログ確認

### アプリケーションログ
ログは標準出力 + `logs/`ディレクトリ (logback設定による)

```powershell
# ログファイル確認
Get-Content logs/application.log -Tail 50 -Wait
```
