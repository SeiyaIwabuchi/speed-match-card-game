# Speed Match Card Game - Frontend

リアルタイム対戦型カードゲーム「Speed Match」のフロントエンド実装。

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router** - クライアントサイドルーティング
- **Axios** - HTTP通信
- **Context API** - 状態管理
- **Playwright** - E2Eテスト

## Development

### Prerequisites

- Node.js 22.20.0 (Volta推奨)
- バックエンドAPI（`http://localhost:8080`で起動）

### Setup

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
# → http://localhost:5173
```

### Available Scripts

```bash
npm run dev          # 開発サーバー起動（HMR有効）
npm run build        # 本番ビルド
npm run lint         # ESLintチェック
npm run preview      # ビルド結果のプレビュー
npm run test:e2e     # E2Eテスト実行
npm run test:e2e:ui  # E2EテストをUIモードで実行
npm run test:e2e:headed    # ブラウザ表示でE2Eテスト実行
npm run test:e2e:report    # テストレポート表示
```

## Testing

### E2Eテスト

Playwrightによる自動テストを実装済み：

- ✅ **テスト1**: プレイヤー登録フロー
- ✅ **テスト2**: ルーム作成とルームコード表示
- ⏭️ **テスト3-8**: ゲーム機能テスト（スキップ中 - 今後実装予定）

```bash
# テスト実行
npm run test:e2e

# UIモードでデバッグ
npm run test:e2e:ui
```

**注意**: E2Eテスト実行前にバックエンドサーバーを起動してください。

## Project Structure

```
src/
├── api/          # APIクライアント（axios）
├── components/   # Reactコンポーネント
│   ├── ui/       # 再利用可能なUIコンポーネント
│   ├── layout/   # レイアウトコンポーネント
│   └── game/     # ゲーム固有のコンポーネント
├── contexts/     # Context API（状態管理）
├── hooks/        # カスタムフック
├── pages/        # ページコンポーネント
└── styles/       # グローバルCSS・デザインシステム
```

## API Configuration

環境変数でAPIベースURLを設定可能：

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## Original Vite Template Info

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
