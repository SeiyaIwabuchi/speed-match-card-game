# スピードマッチ API仕様書

## 📋 目次
1. [認証・プレイヤー管理API](#1-認証プレイヤー管理api)
2. [ルーム管理API](#2-ルーム管理api)
3. [ゲームプレイAPI](#3-ゲームプレイapi)
4. [チャットAPI](#4-チャットapi)
5. [統計・ランキングAPI](#5-統計ランキングapi)
6. [WebSocket Events](#6-websocket-events)

---

## 共通仕様

### ベースURL
```
https://api.speedmatch.com/v1
```

### 認証
- セッションベース認証またはJWT
- ヘッダー: `Authorization: Bearer {token}`

### 共通レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### HTTPステータスコード
- `200` OK - 成功
- `201` Created - リソース作成成功
- `400` Bad Request - リクエストエラー
- `401` Unauthorized - 認証エラー
- `403` Forbidden - 権限エラー
- `404` Not Found - リソースが見つからない
- `409` Conflict - リソースの競合
- `500` Internal Server Error - サーバーエラー

---

## 1. 認証・プレイヤー管理API

### 1.1 プレイヤー登録

**エンドポイント:** `POST /players`

**概要:** 新規プレイヤーを登録

**リクエストボディ:**
```json
{
  "username": "player123",
  "avatar": "👤"
}
```

**バリデーション:**
- `username`: 3-12文字、英数字とアンダースコアのみ
- `avatar`: 絵文字1文字または英字1文字

**レスポンス:** `201 Created`
```json
{
  "success": true,
  "data": {
    "playerId": "pl_1234567890",
    "username": "player123",
    "avatar": "👤",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "createdAt": "2025-10-11T10:00:00Z"
  }
}
```

**エラー:**
- `400` - ユーザー名が既に存在する
- `400` - バリデーションエラー

---

### 1.2 プレイヤー情報取得

**エンドポイント:** `GET /players/{playerId}`

**概要:** プレイヤー情報を取得

**パスパラメータ:**
- `playerId`: プレイヤーID

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "playerId": "pl_1234567890",
    "username": "player123",
    "avatar": "👤",
    "stats": {
      "totalGames": 50,
      "wins": 25,
      "losses": 25,
      "winRate": 0.5,
      "fastestWin": 8
    },
    "createdAt": "2025-10-11T10:00:00Z"
  }
}
```

---

### 1.3 プレイヤー情報更新

**エンドポイント:** `PUT /players/{playerId}`

**概要:** プレイヤー情報を更新

**パスパラメータ:**
- `playerId`: プレイヤーID

**リクエストボディ:**
```json
{
  "username": "newname",
  "avatar": "🎮"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "playerId": "pl_1234567890",
    "username": "newname",
    "avatar": "🎮",
    "updatedAt": "2025-10-11T11:00:00Z"
  }
}
```

---

## 2. ルーム管理API

### 2.1 ルーム作成

**エンドポイント:** `POST /rooms`

**概要:** 新規ゲームルームを作成

**リクエストボディ:**
```json
{
  "roomName": "初心者歓迎",
  "maxPlayers": 4,
  "initialHandSize": 7,
  "turnTimeLimit": 60,
  "isPublic": true
}
```

**バリデーション:**
- `roomName`: 1-30文字（オプション）
- `maxPlayers`: 2-4
- `initialHandSize`: 5-10
- `turnTimeLimit`: 0（なし）, 30, 60
- `isPublic`: boolean

**レスポンス:** `201 Created`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "roomCode": "ABC123",
    "roomName": "初心者歓迎",
    "hostId": "pl_1234567890",
    "maxPlayers": 4,
    "currentPlayers": 1,
    "initialHandSize": 7,
    "turnTimeLimit": 60,
    "isPublic": true,
    "status": "waiting",
    "players": [
      {
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "isReady": false,
        "isHost": true
      }
    ],
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

---

### 2.2 ルーム一覧取得

**エンドポイント:** `GET /rooms`

**概要:** 公開ルームの一覧を取得

**クエリパラメータ:**
- `status`: `waiting` | `playing` | `finished` (デフォルト: `waiting`)
- `maxPlayers`: 2-4 (フィルター、オプション)
- `page`: ページ番号 (デフォルト: 1)
- `limit`: 1ページあたりの件数 (デフォルト: 20, 最大: 100)

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "roomId": "rm_abc123",
        "roomCode": "ABC123",
        "roomName": "初心者歓迎",
        "hostUsername": "player123",
        "currentPlayers": 2,
        "maxPlayers": 4,
        "initialHandSize": 7,
        "turnTimeLimit": 60,
        "status": "waiting",
        "createdAt": "2025-10-11T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 2.3 ルーム詳細取得

**エンドポイント:** `GET /rooms/{roomId}`

**概要:** ルームの詳細情報を取得

**パスパラメータ:**
- `roomId`: ルームID

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "roomCode": "ABC123",
    "roomName": "初心者歓迎",
    "hostId": "pl_1234567890",
    "maxPlayers": 4,
    "currentPlayers": 3,
    "initialHandSize": 7,
    "turnTimeLimit": 60,
    "isPublic": true,
    "status": "waiting",
    "players": [
      {
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "isReady": true,
        "isHost": true
      },
      {
        "playerId": "pl_0987654321",
        "username": "player456",
        "avatar": "🎮",
        "isReady": false,
        "isHost": false
      }
    ],
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**エラー:**
- `404` - ルームが見つからない

---

### 2.4 ルームコードでルーム取得

**エンドポイント:** `GET /rooms/code/{roomCode}`

**概要:** 6桁のルームコードでルーム情報を取得

**パスパラメータ:**
- `roomCode`: 6桁のルームコード

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "roomCode": "ABC123",
    "roomName": "初心者歓迎",
    "currentPlayers": 2,
    "maxPlayers": 4,
    "status": "waiting"
  }
}
```

**エラー:**
- `404` - ルームコードが無効

---

### 2.5 ルーム参加

**エンドポイント:** `POST /rooms/{roomId}/join`

**概要:** ルームに参加

**パスパラメータ:**
- `roomId`: ルームID

**リクエストボディ:**
```json
{
  "playerId": "pl_0987654321"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "playerId": "pl_0987654321",
    "joinedAt": "2025-10-11T12:05:00Z"
  }
}
```

**エラー:**
- `400` - ルームが満員
- `400` - ゲーム開始済み
- `404` - ルームが見つからない
- `409` - 既に参加済み

---

### 2.6 ルーム退出

**エンドポイント:** `POST /rooms/{roomId}/leave`

**概要:** ルームから退出

**パスパラメータ:**
- `roomId`: ルームID

**リクエストボディ:**
```json
{
  "playerId": "pl_0987654321"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "playerId": "pl_0987654321",
    "leftAt": "2025-10-11T12:10:00Z"
  }
}
```

---

### 2.7 準備完了設定

**エンドポイント:** `POST /rooms/{roomId}/ready`

**概要:** プレイヤーの準備状態を更新

**パスパラメータ:**
- `roomId`: ルームID

**リクエストボディ:**
```json
{
  "playerId": "pl_0987654321",
  "isReady": true
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "playerId": "pl_0987654321",
    "isReady": true
  }
}
```

---

### 2.8 ゲーム開始

**エンドポイント:** `POST /rooms/{roomId}/start`

**概要:** ゲームを開始（ホストのみ）

**パスパラメータ:**
- `roomId`: ルームID

**リクエストボディ:**
```json
{
  "hostId": "pl_1234567890"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "gameId": "gm_xyz789",
    "status": "playing",
    "startedAt": "2025-10-11T12:15:00Z"
  }
}
```

**エラー:**
- `403` - ホストではない
- `400` - 全員準備完了していない
- `400` - 最低人数に満たない

---

## 3. ゲームプレイAPI

### 3.1 ゲーム状態取得

**エンドポイント:** `GET /games/{gameId}`

**概要:** 現在のゲーム状態を取得

**パスパラメータ:**
- `gameId`: ゲームID

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gameId": "gm_xyz789",
    "roomId": "rm_abc123",
    "status": "playing",
    "currentTurn": "pl_1234567890",
    "turnStartTime": "2025-10-11T12:15:30Z",
    "turnTimeLimit": 60,
    "fieldCard": {
      "cardId": "c_001",
      "value": 7
    },
    "deckRemaining": 35,
    "players": [
      {
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "handSize": 5,
        "isCurrentTurn": true
      },
      {
        "playerId": "pl_0987654321",
        "username": "player456",
        "avatar": "🎮",
        "handSize": 6,
        "isCurrentTurn": false
      }
    ],
    "startedAt": "2025-10-11T12:15:00Z"
  }
}
```

---

### 3.2 プレイヤーの手札取得

**エンドポイント:** `GET /games/{gameId}/players/{playerId}/hand`

**概要:** プレイヤーの手札を取得

**パスパラメータ:**
- `gameId`: ゲームID
- `playerId`: プレイヤーID

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "playerId": "pl_1234567890",
    "hand": [
      {
        "cardId": "c_010",
        "value": 6,
        "canPlay": true
      },
      {
        "cardId": "c_011",
        "value": 8,
        "canPlay": true
      },
      {
        "cardId": "c_012",
        "value": 2,
        "canPlay": false
      }
    ]
  }
}
```

**エラー:**
- `403` - 他のプレイヤーの手札は見られない

---

### 3.3 カードをプレイ

**エンドポイント:** `POST /games/{gameId}/play`

**概要:** 手札からカードを場に出す

**パスパラメータ:**
- `gameId`: ゲームID

**リクエストボディ:**
```json
{
  "playerId": "pl_1234567890",
  "cardId": "c_010"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gameId": "gm_xyz789",
    "playerId": "pl_1234567890",
    "cardPlayed": {
      "cardId": "c_010",
      "value": 6
    },
    "newFieldCard": {
      "cardId": "c_010",
      "value": 6
    },
    "remainingHand": 4,
    "nextTurn": "pl_0987654321",
    "playedAt": "2025-10-11T12:16:00Z"
  }
}
```

**エラー:**
- `400` - 自分のターンではない
- `400` - カードが手札にない
- `400` - そのカードは出せない
- `404` - ゲームが見つからない

---

### 3.4 山札から引く

**エンドポイント:** `POST /games/{gameId}/draw`

**概要:** 山札からカードを引く

**パスパラメータ:**
- `gameId`: ゲームID

**リクエストボディ:**
```json
{
  "playerId": "pl_1234567890"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gameId": "gm_xyz789",
    "playerId": "pl_1234567890",
    "drawnCard": {
      "cardId": "c_025",
      "value": 9,
      "canPlay": false
    },
    "remainingHand": 6,
    "deckRemaining": 34,
    "nextTurn": "pl_0987654321",
    "drawnAt": "2025-10-11T12:16:30Z"
  }
}
```

**エラー:**
- `400` - 自分のターンではない
- `400` - 山札が空

---

### 3.5 パス

**エンドポイント:** `POST /games/{gameId}/pass`

**概要:** ターンをパスする

**パスパラメータ:**
- `gameId`: ゲームID

**リクエストボディ:**
```json
{
  "playerId": "pl_1234567890"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gameId": "gm_xyz789",
    "playerId": "pl_1234567890",
    "nextTurn": "pl_0987654321",
    "passedAt": "2025-10-11T12:17:00Z"
  }
}
```

**エラー:**
- `400` - 自分のターンではない

---

### 3.6 ゲーム終了

**エンドポイント:** `POST /games/{gameId}/end`

**概要:** ゲームを強制終了

**パスパラメータ:**
- `gameId`: ゲームID

**リクエストボディ:**
```json
{
  "playerId": "pl_1234567890",
  "reason": "player_quit"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gameId": "gm_xyz789",
    "status": "finished",
    "reason": "player_quit",
    "endedAt": "2025-10-11T12:20:00Z"
  }
}
```

---

### 3.7 リザルト取得

**エンドポイント:** `GET /games/{gameId}/result`

**概要:** ゲーム終了後の結果を取得

**パスパラメータ:**
- `gameId`: ゲームID

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gameId": "gm_xyz789",
    "roomId": "rm_abc123",
    "status": "finished",
    "rankings": [
      {
        "rank": 1,
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "turnsUsed": 8,
        "cardsPlayed": 7,
        "finalHandSize": 0,
        "playTime": 320
      },
      {
        "rank": 2,
        "playerId": "pl_0987654321",
        "username": "player456",
        "avatar": "🎮",
        "turnsUsed": 10,
        "cardsPlayed": 5,
        "finalHandSize": 2,
        "playTime": 320
      }
    ],
    "startedAt": "2025-10-11T12:15:00Z",
    "endedAt": "2025-10-11T12:20:20Z",
    "duration": 320
  }
}
```

---

## 4. チャットAPI

### 4.1 チャットメッセージ送信

**エンドポイント:** `POST /rooms/{roomId}/chat`

**概要:** ルーム内にチャットメッセージを送信

**パスパラメータ:**
- `roomId`: ルームID

**リクエストボディ:**
```json
{
  "playerId": "pl_1234567890",
  "message": "よろしくお願いします！",
  "type": "text"
}
```

**バリデーション:**
- `message`: 1-200文字
- `type`: `text` | `emoji` | `preset`

**レスポンス:** `201 Created`
```json
{
  "success": true,
  "data": {
    "messageId": "msg_abc123",
    "roomId": "rm_abc123",
    "playerId": "pl_1234567890",
    "username": "player123",
    "avatar": "👤",
    "message": "よろしくお願いします！",
    "type": "text",
    "createdAt": "2025-10-11T12:05:00Z"
  }
}
```

---

### 4.2 チャット履歴取得

**エンドポイント:** `GET /rooms/{roomId}/chat`

**概要:** ルームのチャット履歴を取得

**パスパラメータ:**
- `roomId`: ルームID

**クエリパラメータ:**
- `limit`: 取得件数 (デフォルト: 20, 最大: 100)
- `before`: この日時より前のメッセージを取得 (ISO 8601形式)

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "msg_abc123",
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "message": "よろしくお願いします！",
        "type": "text",
        "createdAt": "2025-10-11T12:05:00Z"
      }
    ],
    "hasMore": false
  }
}
```

---

## 5. 統計・ランキングAPI

### 5.1 プレイヤー統計取得

**エンドポイント:** `GET /players/{playerId}/stats`

**概要:** プレイヤーの詳細統計を取得

**パスパラメータ:**
- `playerId`: プレイヤーID

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "playerId": "pl_1234567890",
    "stats": {
      "totalGames": 100,
      "wins": 55,
      "losses": 45,
      "winRate": 0.55,
      "fastestWin": 6,
      "averageTurns": 12.5,
      "totalCardsPlayed": 850,
      "favoriteCardValue": 7
    },
    "recentGames": [
      {
        "gameId": "gm_xyz789",
        "rank": 1,
        "playedAt": "2025-10-11T12:20:00Z"
      }
    ]
  }
}
```

---

### 5.2 ランキング取得

**エンドポイント:** `GET /rankings`

**概要:** ランキングを取得

**クエリパラメータ:**
- `type`: `wins` | `winRate` | `fastestWin` (デフォルト: `wins`)
- `period`: `all` | `week` | `month` (デフォルト: `all`)
- `limit`: 取得件数 (デフォルト: 100, 最大: 100)

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "value": 55,
        "wins": 55,
        "totalGames": 100
      }
    ],
    "type": "wins",
    "period": "all",
    "updatedAt": "2025-10-11T13:00:00Z"
  }
}
```

---

### 5.3 ゲーム履歴取得

**エンドポイント:** `GET /players/{playerId}/games`

**概要:** プレイヤーのゲーム履歴を取得

**パスパラメータ:**
- `playerId`: プレイヤーID

**クエリパラメータ:**
- `page`: ページ番号 (デフォルト: 1)
- `limit`: 1ページあたりの件数 (デフォルト: 20, 最大: 100)

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "gameId": "gm_xyz789",
        "roomName": "初心者歓迎",
        "rank": 1,
        "totalPlayers": 4,
        "turnsUsed": 8,
        "playedAt": "2025-10-11T12:20:00Z",
        "duration": 320
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 6. ポーリングAPI（リアルタイム更新用）

WebSocketの代わりにポーリングベースのAPIでリアルタイム更新を実現します。

### ポーリング戦略
- **推奨ポーリング間隔**:
  - ルーム待機中: 2秒
  - ゲームプレイ中: 1秒
  - チャット: 3秒
- **Long Polling**: サーバー側で最大30秒待機し、変更があれば即座に返却

---

### 6.1 ルーム更新情報取得

**エンドポイント:** `GET /rooms/{roomId}/updates`

**概要:** ルームの最新状態と変更情報を取得

**パスパラメータ:**
- `roomId`: ルームID

**クエリパラメータ:**
- `lastUpdateTime`: 前回取得時のタイムスタンプ (ISO 8601形式、オプション)
- `longPoll`: Long Pollingを有効にする (boolean、デフォルト: false)

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "roomName": "初心者歓迎",
    "hostId": "pl_1234567890",
    "status": "waiting",
    "currentPlayers": 3,
    "maxPlayers": 4,
    "players": [
      {
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "isReady": true,
        "isHost": true,
        "joinedAt": "2025-10-11T12:00:00Z"
      },
      {
        "playerId": "pl_0987654321",
        "username": "player456",
        "avatar": "🎮",
        "isReady": false,
        "isHost": false,
        "joinedAt": "2025-10-11T12:01:00Z"
      }
    ],
    "updates": [
      {
        "type": "player_joined",
        "playerId": "pl_0987654321",
        "username": "player456",
        "timestamp": "2025-10-11T12:01:00Z"
      },
      {
        "type": "player_ready",
        "playerId": "pl_1234567890",
        "isReady": true,
        "timestamp": "2025-10-11T12:01:30Z"
      }
    ],
    "lastUpdateTime": "2025-10-11T12:01:30Z",
    "serverTime": "2025-10-11T12:01:31Z"
  }
}
```

**update types:**
- `player_joined` - プレイヤー参加
- `player_left` - プレイヤー退出
- `player_ready` - 準備完了状態変更
- `host_changed` - ホスト変更
- `game_starting` - ゲーム開始中

---

### 6.2 ゲーム更新情報取得

**エンドポイント:** `GET /games/{gameId}/updates`

**概要:** ゲームの最新状態と変更情報を取得

**パスパラメータ:**
- `gameId`: ゲームID

**クエリパラメータ:**
- `lastActionId`: 前回取得した最後のアクションID (オプション)
- `longPoll`: Long Pollingを有効にする (boolean、デフォルト: false)

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "gameId": "gm_xyz789",
    "status": "playing",
    "currentTurn": "pl_0987654321",
    "turnNumber": 5,
    "turnStartTime": "2025-10-11T12:16:00Z",
    "turnTimeLimit": 60,
    "fieldCard": {
      "cardId": "c_010",
      "value": 6
    },
    "deckRemaining": 34,
    "players": [
      {
        "playerId": "pl_1234567890",
        "username": "player123",
        "avatar": "👤",
        "handSize": 4,
        "isCurrentTurn": false
      },
      {
        "playerId": "pl_0987654321",
        "username": "player456",
        "avatar": "🎮",
        "handSize": 6,
        "isCurrentTurn": true
      }
    ],
    "recentActions": [
      {
        "actionId": 15,
        "playerId": "pl_1234567890",
        "username": "player123",
        "actionType": "play_card",
        "cardValue": 6,
        "turnNumber": 4,
        "timestamp": "2025-10-11T12:15:45Z"
      },
      {
        "actionId": 16,
        "playerId": "pl_0987654321",
        "actionType": "turn_started",
        "turnNumber": 5,
        "timestamp": "2025-10-11T12:16:00Z"
      }
    ],
    "lastActionId": 16,
    "serverTime": "2025-10-11T12:16:15Z"
  }
}
```

**actionType の値:**
- `play_card` - カードプレイ
- `draw_card` - カード引く
- `pass` - パス
- `timeout` - タイムアウト
- `turn_started` - ターン開始
- `game_finished` - ゲーム終了

---

### 6.3 チャット更新情報取得

**エンドポイント:** `GET /rooms/{roomId}/chat/updates`

**概要:** 新着チャットメッセージを取得

**パスパラメータ:**
- `roomId`: ルームID

**クエリパラメータ:**
- `lastMessageId`: 前回取得した最後のメッセージID (オプション)
- `longPoll`: Long Pollingを有効にする (boolean、デフォルト: false)

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roomId": "rm_abc123",
    "newMessages": [
      {
        "messageId": "msg_abc124",
        "playerId": "pl_0987654321",
        "username": "player456",
        "avatar": "🎮",
        "message": "よろしくお願いします！",
        "type": "text",
        "createdAt": "2025-10-11T12:05:30Z"
      }
    ],
    "lastMessageId": "msg_abc124",
    "hasMore": false,
    "serverTime": "2025-10-11T12:05:31Z"
  }
}
```

---

### 6.4 プレイヤーステータス更新

**エンドポイント:** `POST /players/{playerId}/heartbeat`

**概要:** プレイヤーがアクティブであることを通知（ハートビート）

**パスパラメータ:**
- `playerId`: プレイヤーID

**リクエストボディ:**
```json
{
  "roomId": "rm_abc123",
  "gameId": "gm_xyz789"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "playerId": "pl_1234567890",
    "isActive": true,
    "lastHeartbeat": "2025-10-11T12:16:30Z"
  }
}
```

**推奨:**
- 5-10秒ごとに送信
- 30秒以上ハートビートがない場合、切断と判定

---

### 6.5 一括状態取得（最適化版）

**エンドポイント:** `POST /polling/batch`

**概要:** 複数のリソースの状態を一度に取得（ポーリング回数削減）

**リクエストボディ:**
```json
{
  "requests": [
    {
      "type": "room",
      "resourceId": "rm_abc123",
      "lastUpdateTime": "2025-10-11T12:00:00Z"
    },
    {
      "type": "chat",
      "resourceId": "rm_abc123",
      "lastMessageId": "msg_abc120"
    }
  ]
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "type": "room",
        "resourceId": "rm_abc123",
        "hasUpdates": true,
        "data": { /* ルーム更新情報 */ }
      },
      {
        "type": "chat",
        "resourceId": "rm_abc123",
        "hasUpdates": false,
        "data": null
      }
    ],
    "serverTime": "2025-10-11T12:16:45Z"
  }
}
```

**対応タイプ:**
- `room` - ルーム状態
- `game` - ゲーム状態
- `chat` - チャットメッセージ

---

### 6.6 ポーリング設定取得

**エンドポイント:** `GET /polling/config`

**概要:** クライアントが使用すべきポーリング設定を取得

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "data": {
    "intervals": {
      "roomWaiting": 2000,
      "gamePlaying": 1000,
      "chat": 3000,
      "heartbeat": 10000
    },
    "longPolling": {
      "enabled": true,
      "timeout": 30000
    },
    "batchingEnabled": true
  }
}
```

---

## 7. エラーコード一覧

### 認証エラー (AUTH_*)
- `AUTH_INVALID_TOKEN` - 無効なトークン
- `AUTH_EXPIRED_TOKEN` - トークンの期限切れ
- `AUTH_MISSING_TOKEN` - トークンが見つからない

### バリデーションエラー (VALIDATION_*)
- `VALIDATION_INVALID_USERNAME` - 無効なユーザー名
- `VALIDATION_USERNAME_EXISTS` - ユーザー名が既に存在
- `VALIDATION_INVALID_ROOM_NAME` - 無効なルーム名
- `VALIDATION_INVALID_PARAMETERS` - 無効なパラメータ

### ルームエラー (ROOM_*)
- `ROOM_NOT_FOUND` - ルームが見つからない
- `ROOM_FULL` - ルームが満員
- `ROOM_ALREADY_STARTED` - ゲーム開始済み
- `ROOM_ALREADY_JOINED` - 既に参加済み
- `ROOM_NOT_JOINED` - ルームに参加していない
- `ROOM_INVALID_CODE` - 無効なルームコード

### ゲームエラー (GAME_*)
- `GAME_NOT_FOUND` - ゲームが見つからない
- `GAME_NOT_STARTED` - ゲーム未開始
- `GAME_ALREADY_FINISHED` - ゲーム終了済み
- `GAME_NOT_YOUR_TURN` - 自分のターンではない
- `GAME_INVALID_CARD` - 無効なカード
- `GAME_CARD_NOT_IN_HAND` - カードが手札にない
- `GAME_CANNOT_PLAY_CARD` - そのカードは出せない
- `GAME_DECK_EMPTY` - 山札が空

### 権限エラー (PERMISSION_*)
- `PERMISSION_DENIED` - 権限がない
- `PERMISSION_NOT_HOST` - ホストではない
- `PERMISSION_CANNOT_VIEW_HAND` - 他人の手札は見られない

### サーバーエラー (SERVER_*)
- `SERVER_ERROR` - サーバー内部エラー
- `SERVER_MAINTENANCE` - メンテナンス中
- `SERVER_OVERLOADED` - サーバー過負荷

---

## 8. レート制限

### API レート制限
- **一般API**: 100リクエスト/分/IP
- **ゲームプレイAPI**: 30リクエスト/分/プレイヤー
- **チャットAPI**: 10メッセージ/分/プレイヤー

### レート制限超過時のレスポンス
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "レート制限を超えました",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2025-10-11T12:16:00Z"
    }
  }
}
```

### レスポンスヘッダー
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696420560
```

---

## 9. ページネーション

### リクエスト
```
GET /rooms?page=2&limit=20
```

### レスポンス
```json
{
  "success": true,
  "data": {
    "rooms": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

---

## 10. バージョニング

### URLベースのバージョニング
```
https://api.speedmatch.com/v1/...
https://api.speedmatch.com/v2/...
```

### 後方互換性
- 新機能追加時は既存エンドポイントを変更しない
- 破壊的変更は新しいバージョンで提供
- 旧バージョンは最低6ヶ月間サポート

---

## 11. セキュリティ

### HTTPS必須
- すべてのAPI通信はHTTPS経由で行う
- HTTP接続は自動的にHTTPSへリダイレクト

### CORS設定
```
Access-Control-Allow-Origin: https://speedmatch.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### セキュリティヘッダー
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 12. 開発環境

### 開発用ベースURL
```
https://api-dev.speedmatch.com/v1
```

### ステージング用ベースURL
```
https://api-staging.speedmatch.com/v1
```

### テスト用アカウント
開発・ステージング環境では以下のテストアカウントが利用可能
```
Username: test_player_1
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test1

Username: test_player_2
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test2
```

---

## 13. APIクライアントライブラリ例

### JavaScript/TypeScript
```typescript
import { SpeedMatchClient } from '@speedmatch/client';

const client = new SpeedMatchClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.speedmatch.com/v1'
});

// プレイヤー登録
const player = await client.players.create({
  username: 'player123',
  avatar: '👤'
});

// ルーム作成
const room = await client.rooms.create({
  roomName: '初心者歓迎',
  maxPlayers: 4,
  initialHandSize: 7
});

// WebSocket接続
const ws = client.connectWebSocket(player.token);
ws.on('room:player_joined', (data) => {
  console.log('プレイヤーが参加しました:', data);
});
```

---

## 付録: データモデル

### Player (プレイヤー)
```typescript
interface Player {
  playerId: string;
  username: string;
  avatar: string;
  stats: PlayerStats;
  createdAt: string;
  updatedAt: string;
}

interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  fastestWin: number;
  averageTurns: number;
  totalCardsPlayed: number;
}
```

### Room (ルーム)
```typescript
interface Room {
  roomId: string;
  roomCode: string;
  roomName?: string;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  initialHandSize: number;
  turnTimeLimit: number;
  isPublic: boolean;
  status: 'waiting' | 'playing' | 'finished';
  players: RoomPlayer[];
  createdAt: string;
}

interface RoomPlayer {
  playerId: string;
  username: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
  joinedAt: string;
}
```

### Game (ゲーム)
```typescript
interface Game {
  gameId: string;
  roomId: string;
  status: 'playing' | 'finished';
  currentTurn: string;
  turnStartTime: string;
  turnTimeLimit: number;
  fieldCard: Card;
  deckRemaining: number;
  players: GamePlayer[];
  startedAt: string;
  endedAt?: string;
}

interface GamePlayer {
  playerId: string;
  username: string;
  avatar: string;
  handSize: number;
  isCurrentTurn: boolean;
}

interface Card {
  cardId: string;
  value: number;
  canPlay?: boolean;
}
```

### GameResult (ゲーム結果)
```typescript
interface GameResult {
  gameId: string;
  roomId: string;
  status: 'finished';
  rankings: PlayerRanking[];
  startedAt: string;
  endedAt: string;
  duration: number;
}

interface PlayerRanking {
  rank: number;
  playerId: string;
  username: string;
  avatar: string;
  turnsUsed: number;
  cardsPlayed: number;
  finalHandSize: number;
  playTime: number;
}
```

### ChatMessage (チャットメッセージ)
```typescript
interface ChatMessage {
  messageId: string;
  roomId: string;
  playerId: string;
  username: string;
  avatar: string;
  message: string;
  type: 'text' | 'emoji' | 'preset';
  createdAt: string;
}
```

---

## まとめ

このAPI仕様書には以下が含まれています：

✅ **認証・プレイヤー管理** - 登録、情報取得・更新
✅ **ルーム管理** - 作成、参加、退出、開始
✅ **ゲームプレイ** - カードプレイ、山札、ターン管理
✅ **チャット** - メッセージ送受信
✅ **統計・ランキング** - プレイヤー成績、ランキング
✅ **WebSocket** - リアルタイム通信イベント
✅ **エラーハンドリング** - エラーコード、レート制限
✅ **セキュリティ** - 認証、CORS、セキュリティヘッダー
✅ **データモデル** - TypeScriptインターフェース定義

この仕様に基づいてバックエンドとフロントエンドの実装を進められます！