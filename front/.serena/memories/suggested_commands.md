# 推奨コマンド集

## 開発関連コマンド

### プロジェクト起動
```powershell
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションビルド（本番モード）
npm run build:prod

# ビルド結果のプレビュー
npm run preview
```

### コード品質管理
```powershell
# ESLint実行
npm run lint

# 自動修正付きESLint
npm run lint -- --fix

# TypeScript型チェック
npx tsc --noEmit
```

### システムコマンド（Windows）
```powershell
# ディレクトリ作成
mkdir <directory_name>

# ファイル一覧表示
ls
dir

# ディレクトリ移動
cd <path>

# ファイル内容表示
Get-Content <file>
cat <file>

# ファイル検索
Select-String -Pattern "<pattern>" -Path <file_or_directory>

# Git操作
git status
git add .
git commit -m "message"
git push
git pull
```

### 開発ワークフロー
```powershell
# 新機能開発開始
git checkout -b feature/<feature_name>

# 変更をステージング
git add .

# コミット
git commit -m "feat: <description>"

# リモートにプッシュ
git push origin feature/<feature_name>
```

### デバッグ・確認
```powershell
# パッケージ情報確認
npm list

# 依存関係の脆弱性チェック
npm audit

# キャッシュクリア
npm cache clean --force

# node_modules再インストール
rm -rf node_modules package-lock.json; npm install
```