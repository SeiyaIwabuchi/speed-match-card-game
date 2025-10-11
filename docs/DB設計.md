# スピードマッチ データベース設計

## 📊 目次
1. [データベース概要](#データベース概要)
2. [ER図](#er図)
3. [テーブル定義](#テーブル定義)
4. [インデックス設計](#インデックス設計)
5. [制約とリレーション](#制約とリレーション)
6. [SQL DDL](#sql-ddl)

---

## データベース概要

### 使用DBMS
- **推奨**: PostgreSQL 14以上
- **代替**: MySQL 8.0以上、MongoDB

### 命名規則
- テーブル名: スネークケース、複数形 (例: `players`, `game_actions`)
- カラム名: スネークケース (例: `created_at`, `player_id`)
- 主キー: `id` または `{table_name}_id`
- 外部キー: `{参照テーブル}_id`
- タイムスタンプ: `created_at`, `updated_at`, `deleted_at`

---

## ER図

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   players   │         │    rooms    │         │    games    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ player_id   │←───┐    │ room_id     │         │ game_id     │
│ username    │    │    │ room_code   │         │ room_id     │
│ avatar      │    │    │ host_id     │────────→│ status      │
│ created_at  │    │    │ status      │         │ winner_id   │
└─────────────┘    │    └─────────────┘         └─────────────┘
                   │            │                        │
                   │            ↓                        ↓
                   │    ┌─────────────┐         ┌─────────────┐
                   └────│room_players │         │game_players │
                        ├─────────────┤         ├─────────────┤
                        │ room_id     │         │ game_id     │
                        │ player_id   │         │ player_id   │
                        │ is_ready    │         │ hand_cards  │
                        └─────────────┘         └─────────────┘
                                │                        │
                                ↓                        ↓
                        ┌─────────────┐         ┌─────────────┐
                        │chat_messages│         │game_actions │
                        ├─────────────┤         ├─────────────┤
                        │ message_id  │         │ action_id   │
                        │ room_id     │         │ game_id     │
                        │ player_id   │         │ player_id   │
                        └─────────────┘         │ action_type │
                                                └─────────────┘
```

---

## テーブル定義

### 1. players (プレイヤー)

**概要**: プレイヤー情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| player_id | VARCHAR(50) | NO | - | プレイヤーID (PK) |
| username | VARCHAR(50) | NO | - | ユーザー名 (UNIQUE) |
| avatar | VARCHAR(10) | NO | '👤' | アバター（絵文字または文字） |
| password_hash | VARCHAR(255) | YES | NULL | パスワードハッシュ（将来拡張用） |
| email | VARCHAR(255) | YES | NULL | メールアドレス（将来拡張用） |
| total_games | INTEGER | NO | 0 | 総プレイ回数 |
| total_wins | INTEGER | NO | 0 | 総勝利数 |
| total_losses | INTEGER | NO | 0 | 総敗北数 |
| fastest_win | INTEGER | YES | NULL | 最速勝利ターン数 |
| total_cards_played | INTEGER | NO | 0 | 総カードプレイ数 |
| last_login_at | TIMESTAMP | YES | NULL | 最終ログイン日時 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP | YES | NULL | 削除日時（論理削除） |

**インデックス**:
- PRIMARY KEY: `player_id`
- UNIQUE: `username`
- INDEX: `created_at`, `total_wins`

---

### 2. rooms (ルーム)

**概要**: ゲームルーム情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| room_id | VARCHAR(50) | NO | - | ルームID (PK) |
| room_code | VARCHAR(6) | NO | - | ルームコード (UNIQUE) |
| room_name | VARCHAR(100) | YES | NULL | ルーム名 |
| host_id | VARCHAR(50) | NO | - | ホストプレイヤーID (FK) |
| max_players | INTEGER | NO | 4 | 最大プレイヤー数 (2-4) |
| current_players | INTEGER | NO | 0 | 現在のプレイヤー数 |
| initial_hand_size | INTEGER | NO | 7 | 初期手札枚数 (5-10) |
| turn_time_limit | INTEGER | NO | 60 | ターン制限時間(秒) 0=無制限 |
| is_public | BOOLEAN | NO | TRUE | 公開ルーム |
| status | VARCHAR(20) | NO | 'waiting' | ステータス (waiting/playing/finished) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| started_at | TIMESTAMP | YES | NULL | ゲーム開始日時 |
| finished_at | TIMESTAMP | YES | NULL | ゲーム終了日時 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス**:
- PRIMARY KEY: `room_id`
- UNIQUE: `room_code`
- INDEX: `status`, `is_public`, `created_at`
- FOREIGN KEY: `host_id` REFERENCES `players(player_id)`

---

### 3. room_players (ルーム参加者)

**概要**: ルームへの参加情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | BIGSERIAL | NO | - | 内部ID (PK) |
| room_id | VARCHAR(50) | NO | - | ルームID (FK) |
| player_id | VARCHAR(50) | NO | - | プレイヤーID (FK) |
| is_ready | BOOLEAN | NO | FALSE | 準備完了フラグ |
| is_host | BOOLEAN | NO | FALSE | ホストフラグ |
| join_order | INTEGER | NO | - | 参加順序 |
| joined_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 参加日時 |
| left_at | TIMESTAMP | YES | NULL | 退出日時 |

**インデックス**:
- PRIMARY KEY: `id`
- UNIQUE: `(room_id, player_id)`
- INDEX: `room_id`, `player_id`
- FOREIGN KEY: `room_id` REFERENCES `rooms(room_id)` ON DELETE CASCADE
- FOREIGN KEY: `player_id` REFERENCES `players(player_id)`

---

### 4. games (ゲーム)

**概要**: ゲーム本体の情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| game_id | VARCHAR(50) | NO | - | ゲームID (PK) |
| room_id | VARCHAR(50) | NO | - | ルームID (FK) |
| status | VARCHAR(20) | NO | 'playing' | ステータス (playing/finished/aborted) |
| current_turn_player_id | VARCHAR(50) | YES | NULL | 現在のターンプレイヤーID (FK) |
| turn_number | INTEGER | NO | 1 | 現在のターン番号 |
| turn_started_at | TIMESTAMP | YES | NULL | ターン開始日時 |
| field_card_value | INTEGER | YES | NULL | 場のカード値 (1-13) |
| deck_remaining | INTEGER | NO | 0 | 山札残り枚数 |
| winner_id | VARCHAR(50) | YES | NULL | 勝者プレイヤーID (FK) |
| started_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | ゲーム開始日時 |
| finished_at | TIMESTAMP | YES | NULL | ゲーム終了日時 |
| duration | INTEGER | YES | NULL | ゲーム時間(秒) |

**インデックス**:
- PRIMARY KEY: `game_id`
- INDEX: `room_id`, `status`, `started_at`
- FOREIGN KEY: `room_id` REFERENCES `rooms(room_id)`
- FOREIGN KEY: `current_turn_player_id` REFERENCES `players(player_id)`
- FOREIGN KEY: `winner_id` REFERENCES `players(player_id)`

---

### 5. game_players (ゲーム参加者)

**概要**: ゲームへの参加情報とプレイヤーの手札を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | BIGSERIAL | NO | - | 内部ID (PK) |
| game_id | VARCHAR(50) | NO | - | ゲームID (FK) |
| player_id | VARCHAR(50) | NO | - | プレイヤーID (FK) |
| player_order | INTEGER | NO | - | プレイヤー順序 (1-4) |
| hand_cards | TEXT | NO | '[]' | 手札（JSON配列） |
| hand_size | INTEGER | NO | 0 | 手札枚数 |
| cards_played | INTEGER | NO | 0 | プレイしたカード数 |
| turns_used | INTEGER | NO | 0 | 使用ターン数 |
| rank | INTEGER | YES | NULL | 順位 (1-4) |
| finished_at | TIMESTAMP | YES | NULL | 終了日時 |

**インデックス**:
- PRIMARY KEY: `id`
- UNIQUE: `(game_id, player_id)`
- INDEX: `game_id`, `player_id`
- FOREIGN KEY: `game_id` REFERENCES `games(game_id)` ON DELETE CASCADE
- FOREIGN KEY: `player_id` REFERENCES `players(player_id)`

---

### 6. game_actions (ゲームアクション履歴)

**概要**: ゲーム中の全アクションを記録

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| action_id | BIGSERIAL | NO | - | アクションID (PK) |
| game_id | VARCHAR(50) | NO | - | ゲームID (FK) |
| player_id | VARCHAR(50) | NO | - | プレイヤーID (FK) |
| action_type | VARCHAR(20) | NO | - | アクション種別 |
| turn_number | INTEGER | NO | - | ターン番号 |
| card_value | INTEGER | YES | NULL | カード値 (1-13) |
| previous_field_card | INTEGER | YES | NULL | 前の場のカード |
| new_field_card | INTEGER | YES | NULL | 新しい場のカード |
| hand_size_after | INTEGER | YES | NULL | アクション後の手札枚数 |
| action_data | JSONB | YES | NULL | 追加データ (JSON) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 実行日時 |

**action_type の値**:
- `play_card` - カードをプレイ
- `draw_card` - カードを引く
- `pass` - パス
- `timeout` - タイムアウト
- `win` - 勝利

**インデックス**:
- PRIMARY KEY: `action_id`
- INDEX: `game_id`, `player_id`, `created_at`, `action_type`
- FOREIGN KEY: `game_id` REFERENCES `games(game_id)` ON DELETE CASCADE
- FOREIGN KEY: `player_id` REFERENCES `players(player_id)`

---

### 7. chat_messages (チャットメッセージ)

**概要**: ルーム内のチャットメッセージを管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| message_id | BIGSERIAL | NO | - | メッセージID (PK) |
| room_id | VARCHAR(50) | NO | - | ルームID (FK) |
| player_id | VARCHAR(50) | NO | - | 送信者プレイヤーID (FK) |
| message | TEXT | NO | - | メッセージ内容 |
| message_type | VARCHAR(20) | NO | 'text' | メッセージタイプ (text/emoji/preset/system) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 送信日時 |

**インデックス**:
- PRIMARY KEY: `message_id`
- INDEX: `room_id`, `created_at`
- FOREIGN KEY: `room_id` REFERENCES `rooms(room_id)` ON DELETE CASCADE
- FOREIGN KEY: `player_id` REFERENCES `players(player_id)`

---

### 8. player_statistics (プレイヤー統計)

**概要**: プレイヤーの詳細統計情報を管理（日次集計用）

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | BIGSERIAL | NO | - | 内部ID (PK) |
| player_id | VARCHAR(50) | NO | - | プレイヤーID (FK) |
| date | DATE | NO | - | 統計日 |
| games_played | INTEGER | NO | 0 | プレイ回数 |
| games_won | INTEGER | NO | 0 | 勝利回数 |
| total_turns | INTEGER | NO | 0 | 総ターン数 |
| total_cards_played | INTEGER | NO | 0 | 総カードプレイ数 |
| average_rank | DECIMAL(3,2) | YES | NULL | 平均順位 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス**:
- PRIMARY KEY: `id`
- UNIQUE: `(player_id, date)`
- INDEX: `player_id`, `date`
- FOREIGN KEY: `player_id` REFERENCES `players(player_id)` ON DELETE CASCADE

---

### 9. rankings (ランキング)

**概要**: ランキング情報をキャッシュ（定期的に更新）

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | BIGSERIAL | NO | - | 内部ID (PK) |
| player_id | VARCHAR(50) | NO | - | プレイヤーID (FK) |
| ranking_type | VARCHAR(20) | NO | - | ランキング種別 |
| period | VARCHAR(20) | NO | - | 期間 (all/week/month) |
| rank | INTEGER | NO | - | 順位 |
| value | DECIMAL(10,2) | NO | - | 値 |
| games_count | INTEGER | NO | 0 | 対象ゲーム数 |
| updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新日時 |

**ranking_type の値**:
- `wins` - 勝利数
- `win_rate` - 勝率
- `fastest_win` - 最速勝利

**インデックス**:
- PRIMARY KEY: `id`
- UNIQUE: `(player_id, ranking_type, period)`
- INDEX: `ranking_type`, `period`, `rank`
- FOREIGN KEY: `player_id` REFERENCES `players(player_id)` ON DELETE CASCADE

---

### 10. sessions (セッション)

**概要**: プレイヤーのセッション情報を管理

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| session_id | VARCHAR(255) | NO | - | セッションID (PK) |
| player_id | VARCHAR(50) | NO | - | プレイヤーID (FK) |
| token | TEXT | NO | - | JWTトークン |
| ip_address | VARCHAR(45) | YES | NULL | IPアドレス |
| user_agent | TEXT | YES | NULL | ユーザーエージェント |
| expires_at | TIMESTAMP | NO | - | 有効期限 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |
| last_activity_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 最終アクティビティ日時 |

**インデックス**:
- PRIMARY KEY: `session_id`
- INDEX: `player_id`, `expires_at`, `last_activity_at`
- FOREIGN KEY: `player_id` REFERENCES `players(player_id)` ON DELETE CASCADE

---

### 11. game_cards (ゲームカード定義)

**概要**: カードの定義を管理（マスターデータ）

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| card_id | INTEGER | NO | - | カードID (PK) |
| value | INTEGER | NO | - | カード値 (1-13) |
| display_name | VARCHAR(50) | NO | - | 表示名 |
| description | TEXT | YES | NULL | 説明 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス**:
- PRIMARY KEY: `card_id`
- UNIQUE: `value`

**初期データ**:
```sql
INSERT INTO game_cards (card_id, value, display_name) VALUES
(1, 1, 'A'), (2, 2, '2'), (3, 3, '3'), (4, 4, '4'),
(5, 5, '5'), (6, 6, '6'), (7, 7, '7'), (8, 8, '8'),
(9, 9, '9'), (10, 10, '10'), (11, 11, 'J'), (12, 12, 'Q'), (13, 13, 'K');
```

---

## インデックス設計

### パフォーマンス最適化のためのインデックス

#### 1. 複合インデックス

```sql
-- ルーム検索用
CREATE INDEX idx_rooms_status_public ON rooms(status, is_public) WHERE deleted_at IS NULL;

-- ゲームアクション履歴検索用
CREATE INDEX idx_game_actions_game_turn ON game_actions(game_id, turn_number);

-- チャットメッセージ取得用
CREATE INDEX idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

-- プレイヤー統計集計用
CREATE INDEX idx_player_stats_date_range ON player_statistics(player_id, date DESC);

-- ランキング取得用
CREATE INDEX idx_rankings_type_period_rank ON rankings(ranking_type, period, rank);
```

#### 2. 部分インデックス

```sql
-- アクティブなルームのみ
CREATE INDEX idx_active_rooms ON rooms(created_at) WHERE status = 'waiting' AND deleted_at IS NULL;

-- プレイ中のゲームのみ
CREATE INDEX idx_playing_games ON games(started_at) WHERE status = 'playing';

-- 未読メッセージ用（将来拡張）
CREATE INDEX idx_unread_messages ON chat_messages(room_id, created_at) WHERE is_read = FALSE;
```

#### 3. JSONB インデックス（PostgreSQL）

```sql
-- game_actions の action_data に対するGINインデックス
CREATE INDEX idx_game_actions_data ON game_actions USING GIN (action_data);

-- 特定のJSONフィールドに対するインデックス
CREATE INDEX idx_game_actions_card_id ON game_actions((action_data->>'card_id'));
```

---

## 制約とリレーション

### CHECK制約

```sql
-- players テーブル
ALTER TABLE players ADD CONSTRAINT chk_players_username_length 
  CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 12);
ALTER TABLE players ADD CONSTRAINT chk_players_stats_positive 
  CHECK (total_games >= 0 AND total_wins >= 0 AND total_losses >= 0);

-- rooms テーブル
ALTER TABLE rooms ADD CONSTRAINT chk_rooms_max_players 
  CHECK (max_players >= 2 AND max_players <= 4);
ALTER TABLE rooms ADD CONSTRAINT chk_rooms_hand_size 
  CHECK (initial_hand_size >= 5 AND initial_hand_size <= 10);
ALTER TABLE rooms ADD CONSTRAINT chk_rooms_turn_limit 
  CHECK (turn_time_limit >= 0 AND turn_time_limit <= 300);
ALTER TABLE rooms ADD CONSTRAINT chk_rooms_status 
  CHECK (status IN ('waiting', 'playing', 'finished'));

-- games テーブル
ALTER TABLE games ADD CONSTRAINT chk_games_status 
  CHECK (status IN ('playing', 'finished', 'aborted'));
ALTER TABLE games ADD CONSTRAINT chk_games_field_card 
  CHECK (field_card_value IS NULL OR (field_card_value >= 1 AND field_card_value <= 13));

-- game_players テーブル
ALTER TABLE game_players ADD CONSTRAINT chk_game_players_order 
  CHECK (player_order >= 1 AND player_order <= 4);
ALTER TABLE game_players ADD CONSTRAINT chk_game_players_rank 
  CHECK (rank IS NULL OR (rank >= 1 AND rank <= 4));
```

### トリガー

#### 1. updated_at 自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに適用
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2. プレイヤー統計自動更新トリガー

```sql
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- ゲーム終了時にプレイヤーの統計を更新
    IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
        UPDATE players p
        SET 
            total_games = total_games + 1,
            total_wins = total_wins + CASE WHEN gp.rank = 1 THEN 1 ELSE 0 END,
            total_losses = total_losses + CASE WHEN gp.rank > 1 THEN 1 ELSE 0 END,
            fastest_win = CASE 
                WHEN gp.rank = 1 AND (p.fastest_win IS NULL OR gp.turns_used < p.fastest_win)
                THEN gp.turns_used
                ELSE p.fastest_win
            END
        FROM game_players gp
        WHERE p.player_id = gp.player_id AND gp.game_id = NEW.game_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_game_finish AFTER UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_player_stats();
```

#### 3. ルームプレイヤー数カウントトリガー

```sql
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE rooms SET current_players = current_players + 1 WHERE room_id = NEW.room_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.left_at IS NOT NULL AND OLD.left_at IS NULL) THEN
        UPDATE rooms SET current_players = current_players - 1 WHERE room_id = COALESCE(NEW.room_id, OLD.room_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_count AFTER INSERT OR UPDATE OR DELETE ON room_players
    FOR EACH ROW EXECUTE FUNCTION update_room_player_count();
```

---

## SQL DDL

### データベース作成

```sql
CREATE DATABASE speedmatch
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'ja_JP.UTF-8'
    LC_CTYPE = 'ja_JP.UTF-8'
    TEMPLATE = template0;

\c speedmatch

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID生成
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- 暗号化
```

### テーブル作成（完全版）

```sql
-- 1. players テーブル
CREATE TABLE players (
    player_id VARCHAR(50) PRIMARY KEY DEFAULT ('pl_' || encode(gen_random_bytes(8), 'hex')),
    username VARCHAR(50) NOT NULL UNIQUE,
    avatar VARCHAR(10) NOT NULL DEFAULT '👤',
    password_hash VARCHAR(255),
    email VARCHAR(255),
    total_games INTEGER NOT NULL DEFAULT 0,
    total_wins INTEGER NOT NULL DEFAULT 0,
    total_losses INTEGER NOT NULL DEFAULT 0,
    fastest_win INTEGER,
    total_cards_played INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_players_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 12),
    CONSTRAINT chk_players_stats_positive CHECK (total_games >= 0 AND total_wins >= 0 AND total_losses >= 0)
);

CREATE INDEX idx_players_username ON players(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_created_at ON players(created_at);
CREATE INDEX idx_players_total_wins ON players(total_wins DESC);

-- 2. rooms テーブル
CREATE TABLE rooms (
    room_id VARCHAR(50) PRIMARY KEY DEFAULT ('rm_' || encode(gen_random_bytes(6), 'hex')),
    room_code VARCHAR(6) NOT NULL UNIQUE,
    room_name VARCHAR(100),
    host_id VARCHAR(50) NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 0,
    initial_hand_size INTEGER NOT NULL DEFAULT 7,
    turn_time_limit INTEGER NOT NULL DEFAULT 60,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rooms_max_players CHECK (max_players >= 2 AND max_players <= 4),
    CONSTRAINT chk_rooms_hand_size CHECK (initial_hand_size >= 5 AND initial_hand_size <= 10),
    CONSTRAINT chk_rooms_turn_limit CHECK (turn_time_limit >= 0 AND turn_time_limit <= 300),
    CONSTRAINT chk_rooms_status CHECK (status IN ('waiting', 'playing', 'finished')),
    CONSTRAINT fk_rooms_host FOREIGN KEY (host_id) REFERENCES players(player_id)
);

CREATE UNIQUE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_rooms_status_public ON rooms(status, is_public);
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);
CREATE INDEX idx_active_rooms ON rooms(created_at) WHERE status = 'waiting';

-- 3. room_players テーブル
CREATE TABLE room_players (
    id BIGSERIAL PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    player_id VARCHAR(50) NOT NULL,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    join_order INTEGER NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    CONSTRAINT fk_room_players_room FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT fk_room_players_player FOREIGN KEY (player_id) REFERENCES players(player_id),
    CONSTRAINT uq_room_players UNIQUE (room_id, player_id)
);

CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_player ON room_players(player_id);

-- 4. games テーブル
CREATE TABLE games (
    game_id VARCHAR(50) PRIMARY KEY DEFAULT ('gm_' || encode(gen_random_bytes(6), 'hex')),
    room_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'playing',
    current_turn_player_id VARCHAR(50),
    turn_number INTEGER NOT NULL DEFAULT 1,
    turn_started_at TIMESTAMP,
    field_card_value INTEGER,
    deck_remaining INTEGER NOT NULL DEFAULT 0,
    winner_id VARCHAR(50),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    duration INTEGER,
    CONSTRAINT chk_games_status CHECK (status IN ('playing', 'finished', 'aborted')),
    CONSTRAINT chk_games_field_card CHECK (field_card_value IS NULL OR (field_card_value >= 1 AND field_card_value <= 13)),
    CONSTRAINT fk_games_room FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    CONSTRAINT fk_games_current_turn FOREIGN KEY (current_turn_player_id) REFERENCES players(player_id),
    CONSTRAINT fk_games_winner FOREIGN KEY (winner_id) REFERENCES players(player_id)
);

CREATE INDEX idx_games_room ON games(room_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_started_at ON games(started_at DESC);
CREATE INDEX idx_playing_games ON games(started_at) WHERE status = 'playing';

-- 5. game_players テーブル
CREATE TABLE game_players (
    id BIGSERIAL PRIMARY KEY,
    game_id VARCHAR(50) NOT NULL,
    player_id VARCHAR(50) NOT NULL,
    player_order INTEGER NOT NULL,
    hand_cards TEXT NOT NULL DEFAULT '[]',
    hand_size INTEGER NOT NULL DEFAULT 0,
    cards_played INTEGER NOT NULL DEFAULT 0,
    turns_used INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    finished_at TIMESTAMP,
    CONSTRAINT chk_game_players_order CHECK (player_order >= 1 AND player_order <= 4),
    CONSTRAINT chk_game_players_rank CHECK (rank IS NULL OR (rank >= 1 AND rank <= 4)),
    CONSTRAINT fk_game_players_game FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_players_player FOREIGN KEY (player_id) REFERENCES players(player_id),
    CONSTRAINT uq_game_players UNIQUE (game_id, player_id)
);

CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_player ON game_players(player_id);

-- 6. game_actions テーブル
CREATE TABLE game_actions (
    action_id BIGSERIAL PRIMARY KEY,
    game_id VARCHAR(50) NOT NULL,
    player_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    turn_number INTEGER NOT NULL,
    card_value INTEGER,
    previous_field_card INTEGER,
    new_field_card INTEGER,
    hand_size_after INTEGER,
    action_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_game_actions_type CHECK (action_type IN ('play_card', 'draw_card', 'pass', 'timeout', 'win')),
    CONSTRAINT fk_game_actions_game FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    CONSTRAINT fk_game_actions_player FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE INDEX idx_game_actions_game ON game_actions(game_id);
CREATE INDEX idx_game_actions_player ON game_actions(player_id);
CREATE INDEX idx_game_actions_created_at ON game_actions(created_at DESC);
CREATE INDEX idx_game_actions_type ON game_actions(action_type);
CREATE INDEX idx_game_actions_game_turn ON game_actions(game_id, turn_number);

-- PostgreSQLのJSONBインデックス
CREATE INDEX idx_game_actions_data ON game_actions USING GIN (action_data);

-- 7. chat_messages テーブル
CREATE TABLE chat_messages (
    message_id BIGSERIAL PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL,
    player_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_chat_messages_type CHECK (message_type IN ('text', 'emoji', 'preset', 'system')),
    CONSTRAINT chk_chat_messages_length CHECK (LENGTH(message) >= 1 AND LENGTH(message) <= 500),
    CONSTRAINT fk_chat_messages_room FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_player FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

-- 8. player_statistics テーブル
CREATE TABLE player_statistics (
    id BIGSERIAL PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    total_turns INTEGER NOT NULL DEFAULT 0,
    total_cards_played INTEGER NOT NULL DEFAULT 0,
    average_rank DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_player_statistics_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT uq_player_statistics UNIQUE (player_id, date)
);

CREATE INDEX idx_player_statistics_player ON player_statistics(player_id);
CREATE INDEX idx_player_statistics_date ON player_statistics(date DESC);
CREATE INDEX idx_player_statistics_player_date ON player_statistics(player_id, date DESC);

-- 9. rankings テーブル
CREATE TABLE rankings (
    id BIGSERIAL PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL,
    ranking_type VARCHAR(20) NOT NULL,
    period VARCHAR(20) NOT NULL,
    rank INTEGER NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    games_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rankings_type CHECK (ranking_type IN ('wins', 'win_rate', 'fastest_win')),
    CONSTRAINT chk_rankings_period CHECK (period IN ('all', 'week', 'month')),
    CONSTRAINT fk_rankings_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    CONSTRAINT uq_rankings UNIQUE (player_id, ranking_type, period)
);

CREATE INDEX idx_rankings_type_period ON rankings(ranking_type, period);
CREATE INDEX idx_rankings_rank ON rankings(rank);
CREATE INDEX idx_rankings_type_period_rank ON rankings(ranking_type, period, rank);

-- 10. sessions テーブル
CREATE TABLE sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL,
    token TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_player ON sessions(player_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at);

-- 11. game_cards テーブル（マスターデータ）
CREATE TABLE game_cards (
    card_id INTEGER PRIMARY KEY,
    value INTEGER NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_game_cards_value CHECK (value >= 1 AND value <= 13)
);

-- 初期データ挿入
INSERT INTO game_cards (card_id, value, display_name, description) VALUES
(1, 1, 'A', 'エース'),
(2, 2, '2', '2'),
(3, 3, '3', '3'),
(4, 4, '4', '4'),
(5, 5, '5', '5'),
(6, 6, '6', '6'),
(7, 7, '7', '7'),
(8, 8, '8', '8'),
(9, 9, '9', '9'),
(10, 10, '10', '10'),
(11, 11, 'J', 'ジャック'),
(12, 12, 'Q', 'クイーン'),
(13, 13, 'K', 'キング');
```

---

## トリガー関数の実装

```sql
-- 1. updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. ルームプレイヤー数の自動更新
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' AND NEW.left_at IS NULL THEN
        UPDATE rooms SET current_players = current_players + 1 WHERE room_id = NEW.room_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
        UPDATE rooms SET current_players = current_players - 1 WHERE room_id = NEW.room_id;
    ELSIF TG_OP = 'DELETE' AND OLD.left_at IS NULL THEN
        UPDATE rooms SET current_players = current_players - 1 WHERE room_id = OLD.room_id;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_count 
    AFTER INSERT OR UPDATE OR DELETE ON room_players
    FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

-- 3. プレイヤー統計の自動更新
CREATE OR REPLACE FUNCTION update_player_stats_on_game_finish()
RETURNS TRIGGER AS $
BEGIN
    -- ゲームが終了した時のみ実行
    IF NEW.status = 'finished' AND (OLD.status IS NULL OR OLD.status != 'finished') THEN
        -- 各プレイヤーの統計を更新
        UPDATE players p
        SET 
            total_games = total_games + 1,
            total_wins = total_wins + CASE WHEN gp.rank = 1 THEN 1 ELSE 0 END,
            total_losses = total_losses + CASE WHEN gp.rank > 1 THEN 1 ELSE 0 END,
            total_cards_played = total_cards_played + gp.cards_played,
            fastest_win = CASE 
                WHEN gp.rank = 1 AND (p.fastest_win IS NULL OR gp.turns_used < p.fastest_win)
                THEN gp.turns_used
                ELSE p.fastest_win
            END,
            updated_at = CURRENT_TIMESTAMP
        FROM game_players gp
        WHERE p.player_id = gp.player_id AND gp.game_id = NEW.game_id;
        
        -- 日次統計を更新
        INSERT INTO player_statistics (player_id, date, games_played, games_won, total_turns, total_cards_played)
        SELECT 
            gp.player_id,
            CURRENT_DATE,
            1,
            CASE WHEN gp.rank = 1 THEN 1 ELSE 0 END,
            gp.turns_used,
            gp.cards_played
        FROM game_players gp
        WHERE gp.game_id = NEW.game_id
        ON CONFLICT (player_id, date) 
        DO UPDATE SET
            games_played = player_statistics.games_played + EXCLUDED.games_played,
            games_won = player_statistics.games_won + EXCLUDED.games_won,
            total_turns = player_statistics.total_turns + EXCLUDED.total_turns,
            total_cards_played = player_statistics.total_cards_played + EXCLUDED.total_cards_played;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_game_finish 
    AFTER UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_player_stats_on_game_finish();

-- 4. ゲーム期間の自動計算
CREATE OR REPLACE FUNCTION calculate_game_duration()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration = EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_duration 
    BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION calculate_game_duration();

-- 5. 手札サイズの自動更新
CREATE OR REPLACE FUNCTION update_hand_size()
RETURNS TRIGGER AS $
BEGIN
    -- hand_cards が JSON 配列の場合、要素数を計算
    NEW.hand_size = json_array_length(NEW.hand_cards::json);
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_hand_size_trigger 
    BEFORE INSERT OR UPDATE ON game_players
    FOR EACH ROW EXECUTE FUNCTION update_hand_size();
```

---

## ビュー定義

### 便利なビューの作成

```sql
-- 1. アクティブなルーム一覧ビュー
CREATE VIEW v_active_rooms AS
SELECT 
    r.room_id,
    r.room_code,
    r.room_name,
    r.host_id,
    p.username as host_username,
    p.avatar as host_avatar,
    r.max_players,
    r.current_players,
    r.initial_hand_size,
    r.turn_time_limit,
    r.is_public,
    r.status,
    r.created_at
FROM rooms r
JOIN players p ON r.host_id = p.player_id
WHERE r.status = 'waiting' AND r.deleted_at IS NULL;

-- 2. ルーム詳細ビュー（参加者含む）
CREATE VIEW v_room_details AS
SELECT 
    r.room_id,
    r.room_code,
    r.room_name,
    r.host_id,
    r.max_players,
    r.current_players,
    r.initial_hand_size,
    r.turn_time_limit,
    r.is_public,
    r.status,
    json_agg(
        json_build_object(
            'player_id', rp.player_id,
            'username', p.username,
            'avatar', p.avatar,
            'is_ready', rp.is_ready,
            'is_host', rp.is_host,
            'joined_at', rp.joined_at
        ) ORDER BY rp.join_order
    ) FILTER (WHERE rp.left_at IS NULL) as players
FROM rooms r
LEFT JOIN room_players rp ON r.room_id = rp.room_id AND rp.left_at IS NULL
LEFT JOIN players p ON rp.player_id = p.player_id
GROUP BY r.room_id;

-- 3. ゲーム状態ビュー
CREATE VIEW v_game_state AS
SELECT 
    g.game_id,
    g.room_id,
    g.status,
    g.current_turn_player_id,
    g.turn_number,
    g.turn_started_at,
    g.field_card_value,
    g.deck_remaining,
    json_agg(
        json_build_object(
            'player_id', gp.player_id,
            'username', p.username,
            'avatar', p.avatar,
            'hand_size', gp.hand_size,
            'cards_played', gp.cards_played,
            'is_current_turn', g.current_turn_player_id = gp.player_id
        ) ORDER BY gp.player_order
    ) as players
FROM games g
JOIN game_players gp ON g.game_id = gp.game_id
JOIN players p ON gp.player_id = p.player_id
GROUP BY g.game_id;

-- 4. プレイヤー統計サマリビュー
CREATE VIEW v_player_stats_summary AS
SELECT 
    p.player_id,
    p.username,
    p.avatar,
    p.total_games,
    p.total_wins,
    p.total_losses,
    CASE 
        WHEN p.total_games > 0 
        THEN ROUND((p.total_wins::DECIMAL / p.total_games) * 100, 2)
        ELSE 0 
    END as win_rate,
    p.fastest_win,
    p.total_cards_played,
    CASE 
        WHEN p.total_games > 0 
        THEN ROUND(p.total_cards_played::DECIMAL / p.total_games, 2)
        ELSE 0 
    END as avg_cards_per_game,
    p.created_at,
    p.last_login_at
FROM players p
WHERE p.deleted_at IS NULL;

-- 5. ランキングビュー
CREATE VIEW v_rankings_leaderboard AS
SELECT 
    r.rank,
    p.player_id,
    p.username,
    p.avatar,
    r.ranking_type,
    r.period,
    r.value,
    r.games_count,
    r.updated_at
FROM rankings r
JOIN players p ON r.player_id = p.player_id
WHERE p.deleted_at IS NULL
ORDER BY r.ranking_type, r.period, r.rank;
```

---

## 初期データとサンプルデータ

```sql
-- テストユーザーの作成
INSERT INTO players (player_id, username, avatar) VALUES
('pl_test001', 'test_player_1', '👤'),
('pl_test002', 'test_player_2', '🎮'),
('pl_test003', 'test_player_3', '🎯'),
('pl_test004', 'test_player_4', '🎲');

-- サンプルルームの作成
INSERT INTO rooms (room_id, room_code, room_name, host_id, max_players, current_players, is_public) VALUES
('rm_sample01', 'ABC123', '初心者歓迎', 'pl_test001', 4, 2, true);

-- サンプルルーム参加者
INSERT INTO room_players (room_id, player_id, is_host, join_order) VALUES
('rm_sample01', 'pl_test001', true, 1),
('rm_sample01', 'pl_test002', false, 2);
```

---

## データベースメンテナンス

### 1. 古いデータの削除（クリーンアップジョブ）

```sql
-- 30日以上前の終了したゲームを削除
DELETE FROM games 
WHERE status = 'finished' 
AND finished_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- 90日以上前のチャットメッセージを削除
DELETE FROM chat_messages 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- 期限切れセッションを削除
DELETE FROM sessions 
WHERE expires_at < CURRENT_TIMESTAMP;

-- 7日以上前の待機中ルームを削除
DELETE FROM rooms 
WHERE status = 'waiting' 
AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

### 2. ランキングの再計算（定期実行）

```sql
-- 全期間ランキングの更新
INSERT INTO rankings (player_id, ranking_type, period, rank, value, games_count)
SELECT 
    player_id,
    'wins',
    'all',
    ROW_NUMBER() OVER (ORDER BY total_wins DESC, total_games ASC),
    total_wins,
    total_games
FROM players
WHERE deleted_at IS NULL AND total_games > 0
ON CONFLICT (player_id, ranking_type, period) 
DO UPDATE SET
    rank = EXCLUDED.rank,
    value = EXCLUDED.value,
    games_count = EXCLUDED.games_count,
    updated_at = CURRENT_TIMESTAMP;

-- 週間ランキングの更新
INSERT INTO rankings (player_id, ranking_type, period, rank, value, games_count)
SELECT 
    player_id,
    'wins',
    'week',
    ROW_NUMBER() OVER (ORDER BY SUM(games_won) DESC, SUM(games_played) ASC),
    SUM(games_won),
    SUM(games_played)
FROM player_statistics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY player_id
HAVING SUM(games_played) > 0
ON CONFLICT (player_id, ranking_type, period) 
DO UPDATE SET
    rank = EXCLUDED.rank,
    value = EXCLUDED.value,
    games_count = EXCLUDED.games_count,
    updated_at = CURRENT_TIMESTAMP;
```

### 3. VACUUMとANALYZE

```sql
-- 定期的な実行（cronジョブで設定）
VACUUM ANALYZE players;
VACUUM ANALYZE rooms;
VACUUM ANALYZE games;
VACUUM ANALYZE game_actions;
VACUUM ANALYZE chat_messages;
```

---

## パフォーマンスチューニング

### PostgreSQL設定の推奨値

```ini
# postgresql.conf

# メモリ設定
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# 接続設定
max_connections = 100

# WAL設定
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# クエリプランナー
random_page_cost = 1.1
effective_io_concurrency = 200
```

---

## バックアップ戦略

### 1. 定期バックアップ

```bash
#!/bin/bash
# daily_backup.sh

BACKUP_DIR="/var/backups/speedmatch"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="speedmatch"

# フルバックアップ
pg_dump -U postgres -F c -b -v -f "${BACKUP_DIR}/speedmatch_${DATE}.backup" ${DB_NAME}

# 古いバックアップを削除（30日以上前）
find ${BACKUP_DIR} -name "*.backup" -mtime +30 -delete
```

### 2. リストア手順

```bash
# バックアップからリストア
pg_restore -U postgres -d speedmatch -v speedmatch_20251011_120000.backup
```

---

## マイグレーション管理

### マイグレーションツール（例: node-pg-migrate）

```javascript
// migrations/001_initial_schema.js
exports.up = (pgm) => {
  pgm.createTable('players', {
    player_id: { type: 'varchar(50)', primaryKey: true },
    username: { type: 'varchar(50)', notNull: true, unique: true },
    avatar: { type: 'varchar(10)', notNull: true, default: '👤' },
    // ... 他のカラム
  });
  
  pgm.createIndex('players', 'username');
};

exports.down = (pgm) => {
  pgm.dropTable('players');
};
```

---

## セキュリティ対策

### 1. ロールとパーミッション

```sql
-- アプリケーション用ロールの作成
CREATE ROLE speedmatch_app WITH LOGIN PASSWORD 'secure_password';

-- 必要な権限のみ付与
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO speedmatch_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO speedmatch_app;

-- 読み取り専用ユーザー（分析用）
CREATE ROLE speedmatch_readonly WITH LOGIN PASSWORD 'readonly_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO speedmatch_readonly;
```

### 2. Row Level Security（RLS）

```sql
-- プレイヤーは自分の情報のみ更新可能
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_self_update ON players
    FOR UPDATE
    USING (player_id = current_setting('app.current_player_id')::VARCHAR);

-- ゲームの手札は本人のみ閲覧可能
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY game_hand_visibility ON game_players
    FOR SELECT
    USING (player_id = current_setting('app.current_player_id')::VARCHAR);
```

---

## まとめ

このデータベース設計には以下が含まれています：

✅ **11のテーブル** - プレイヤー、ルーム、ゲーム、統計など
✅ **インデックス設計** - パフォーマンス最適化
✅ **制約とリレーション** - データ整合性の保証
✅ **トリガー** - 自動更新処理
✅ **ビュー** - よく使うクエリの簡略化
✅ **メンテナンス** - クリーンアップ、バックアップ
✅ **セキュリティ** - ロール、RLS

この設計でAPI仕様書と連携した実装が可能です！