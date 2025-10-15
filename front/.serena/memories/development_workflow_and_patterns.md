# 開発ワークフロー・パターン

## 開発の進め方
### 段階的開発
1. **UI実装**: まずコンポーネントの見た目を作成
2. **状態管理**: React ContextやuseStateで状態を追加
3. **機能実装**: イベントハンドラーやビジネスロジックを実装
4. **統合**: 他のコンポーネントとの連携

### コンポーネント開発パターン
```typescript
// 1. Props型定義
interface ComponentProps {
  prop1: string;
  prop2?: number;
  onAction?: (data: any) => void;
}

// 2. コンポーネント実装
const Component: React.FC<ComponentProps> = ({ prop1, prop2, onAction }) => {
  // 3. 状態管理
  const [state, setState] = useState(initialValue);
  
  // 4.副作用処理
  useEffect(() => {
    // side effects
  }, [dependencies]);
  
  // 5. イベントハンドラー
  const handleAction = (data: any) => {
    // validation
    // state update
    // callback
    onAction?.(data);
  };
  
  // 6. レンダリング
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

## 状態管理パターン
### React Context使用
- アプリ全体で共有する状態（ユーザー情報等）
- Provider/Consumer パターン
- カスタムHookでラップ

```typescript
const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
```

### ローカル状態管理
- フォーム状態: useState
- 複雑な状態: useReducer
- 副作用: useEffect

## ファイル構成パターン
### コンポーネント
```
components/
├── layout/
│   ├── Header.tsx
│   ├── Header.css
│   └── index.ts      # re-export
└── ui/
    ├── Button.tsx
    ├── Button.css
    └── index.ts
```

### ページ
```
pages/
├── HomePage.tsx
├── GamePage.tsx
└── index.ts          # re-export
```

## エラーハンドリングパターン
### フォームバリデーション
```typescript
const [errors, setErrors] = useState<FormErrors>({});

const validateForm = (data: FormData): FormErrors => {
  const newErrors: FormErrors = {};
  
  if (!data.name.trim()) {
    newErrors.name = 'プレイヤー名を入力してください';
  } else if (data.name.length > 12) {
    newErrors.name = 'プレイヤー名は12文字以内で入力してください';
  }
  
  return newErrors;
};
```

### API通信エラー
```typescript
try {
  const response = await fetch('/api/endpoint');
  const data = await response.json();
  // success handling
} catch (error) {
  console.error('API Error:', error);
  // error handling
}
```

## テスト戦略
- コンポーネント単体テスト
- 統合テスト
- E2Eテスト（将来的に）

## デプロイメント
- 開発: `npm run dev`
- ビルド: `npm run build`
- プレビュー: `npm run preview`