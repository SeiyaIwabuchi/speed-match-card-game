# コーディング規約・スタイルガイド

## TypeScript規約
### 型定義
- インターface名は PascalCase（例: `PlayerContextType`, `FormData`）
- プロパティは camelCase
- オプショナルプロパティは `?` を使用

```typescript
interface Player {
  name: string;
  avatar?: string;
  wins?: number;
  totalGames?: number;
}
```

### 関数・変数命名
- 関数名: camelCase（例: `handleSubmit`, `updatePlayer`）
- 変数名: camelCase（例: `playerData`, `isSubmitting`）
- 定数: SCREAMING_SNAKE_CASE または camelCase

## React規約
### コンポーネント
- コンポーネント名: PascalCase（例: `PlayerRegistrationPage`）
- ファイル名: PascalCase.tsx
- デフォルトエクスポートを使用

```typescript
const PlayerRegistrationPage: React.FC<Props> = ({ onNavigate }) => {
  // implementation
};

export default PlayerRegistrationPage;
```

### Props定義
- Props interfaceは `<ComponentName>Props` 形式
- React.FCを明示的に指定

```typescript
interface PlayerRegistrationPageProps {
  onNavigate?: (page: string) => void;
}

const PlayerRegistrationPage: React.FC<PlayerRegistrationPageProps> = ({ onNavigate }) => {
  // ...
};
```

### Hooks使用
- useState, useEffect等は適切に分離
- カスタムHookは `use` で開始（例: `usePlayer`）

## CSS規約
### ファイル構成
- コンポーネント専用CSS: `ComponentName.css`
- グローバルスタイル: `src/styles/`
- CSS Variables使用: `var(--color-primary)`

### クラス命名
- BEM記法またはユーティリティクラス
- kebab-case使用（例: `form-container`, `submit-button`）

## エラーハンドリング
```typescript
try {
  const parsedPlayer = JSON.parse(savedPlayer);
  setPlayerState(parsedPlayer);
} catch (error) {
  console.error('Failed to parse saved player data:', error);
  localStorage.removeItem('speedmatch-player');
}
```

## LocalStorage使用
- キー名: `speedmatch-` プレフィックス
- データはJSON形式で保存
- エラーハンドリングを必ず実装

## インポート順序
1. React関連
2. 外部ライブラリ
3. 内部components
4. スタイル

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components';
import './ComponentName.css';
```