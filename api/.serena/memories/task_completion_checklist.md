# タスク完了時のチェックリスト

## 1. コード品質チェック

### ビルド・コンパイル
```powershell
# ビルドが成功することを確認
.\gradlew build
```
- [ ] コンパイルエラーなし
- [ ] 警告の確認と対処

### テスト実行
```powershell
# 全テスト実行
.\gradlew test
```
- [ ] 全テストがパス
- [ ] 新機能に対するテストが追加されている
- [ ] カバレッジ確認 (Domain層は特に重視)

## 2. コードスタイル確認

### アーキテクチャ準拠
- [ ] **依存性の方向**が正しい (内側→外側への依存なし)
- [ ] **レイヤー分離**が適切 (Domain, Application, Infrastructure, Presentation)
- [ ] **リポジトリインターフェース**はDomain層で定義
- [ ] **値オブジェクト**でビジネスルール検証
- [ ] **エンティティ**はイミュータブル

### 命名規則
- [ ] UseCase: `〜UseCase`
- [ ] Repository: `〜Repository` / `〜RepositoryImpl`
- [ ] DTO: `〜Request` / `〜Response`
- [ ] Exception: `〜Exception`
- [ ] 意味のある変数名・関数名

### コメント
- [ ] **パブリックAPI**にKDocが記述されている
- [ ] **ビジネスルール**箇所にコメント
- [ ] 複雑なロジックに説明コメント

## 3. 機能確認

### ローカル動作確認
```powershell
# サーバー起動
.\gradlew run
```
- [ ] サーバーが正常起動 (http://localhost:8080)
- [ ] エンドポイントが期待通り動作
- [ ] エラーハンドリングが適切

### Swagger UI確認
- [ ] http://localhost:8080/swagger でAPI仕様確認
- [ ] `openapi/documentation.yaml`が更新されている (API変更時)
- [ ] リクエスト/レスポンス例が正確

### データベース確認 (DB変更時)
```powershell
# PostgreSQL接続
docker exec -it <container> psql -U speedmatch_user -d speedmatch_dev
```
- [ ] マイグレーション/テーブル作成が成功
- [ ] インデックスが適切に設定
- [ ] サンプルデータで動作確認

## 4. ドキュメント更新

### 必須ドキュメント
- [ ] `README.md` (機能追加時は使い方を更新)
- [ ] `openapi/documentation.yaml` (API変更時)
- [ ] `docs/API仕様書.md` (大きなAPI変更時)

### コミットメッセージ
Conventional Commits形式推奨:
```
feat: add player statistics endpoint
fix: resolve room code duplication issue
docs: update API specification
test: add integration tests for game logic
refactor: extract card validation to domain service
```

## 5. クリーンアップ

### 不要コードの削除
- [ ] コメントアウトされたコード削除
- [ ] 未使用のimport削除
- [ ] デバッグ用printlnやログ削除

### ビルド成果物確認
```powershell
# クリーンビルド
.\gradlew clean build
```
- [ ] クリーンビルドが成功

## 6. Git操作

### コミット前確認
```powershell
# 変更ファイル確認
git status

# 差分確認
git diff
```
- [ ] 意図しないファイルが含まれていない
- [ ] `.gitignore`が適切に設定
- [ ] ビルド成果物がコミット対象外

### コミット・プッシュ
```powershell
git add .
git commit -m "feat: implement player CRUD API"
git push origin <branch_name>
```
- [ ] 適切なブランチにコミット
- [ ] コミットメッセージが明確

## 7. レビュー準備 (プルリクエスト作成時)

### PR説明
- [ ] 変更内容の概要説明
- [ ] スクリーンショット (UI変更時)
- [ ] テスト結果
- [ ] 関連Issue番号

### チェックリスト
- [ ] セルフレビュー完了
- [ ] CI/CDパイプライン成功 (設定されている場合)
- [ ] コンフリクト解消

## 8. デプロイ準備 (本番リリース時)

### 環境確認
- [ ] `application-production.yaml`の設定確認
- [ ] 環境変数の設定確認
- [ ] データベース接続情報の確認

### Docker確認
```powershell
# Dockerイメージビルド
.\gradlew buildImage
```
- [ ] Dockerイメージが正常にビルド
- [ ] コンテナが起動

## タスク完了の最終確認

✅ **以下すべてを確認してからタスク完了とする:**

1. [ ] ビルド成功 (`.\gradlew build`)
2. [ ] テストパス (`.\gradlew test`)
3. [ ] ローカル動作確認 (`.\gradlew run`)
4. [ ] ドキュメント更新
5. [ ] コードレビュー (セルフレビュー最低限)
6. [ ] Gitコミット・プッシュ

---

**このチェックリストを毎回確認することで、品質の高いコードを維持できます。**
