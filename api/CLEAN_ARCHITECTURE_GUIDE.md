# Ktor クリーンアーキテクチャ ガイドライン

このドキュメントは、スピードマッチAPIをKtorとクリーンアーキテクチャで実装するためのガイドラインです。

## 📚 目次

1. [クリーンアーキテクチャの概要](#クリーンアーキテクチャの概要)
2. [プロジェクト構造](#プロジェクト構造)
3. [レイヤー別ガイドライン](#レイヤー別ガイドライン)
4. [依存性の注入](#依存性の注入)
5. [実装例](#実装例)
6. [テスト戦略](#テスト戦略)
7. [ベストプラクティス](#ベストプラクティス)

---

## クリーンアーキテクチャの概要

### 基本原則

クリーンアーキテクチャは、以下の原則に基づいています：

1. **依存性の逆転**: 内側のレイヤーは外側のレイヤーに依存しない
2. **関心の分離**: 各レイヤーが明確な責任を持つ
3. **テスタビリティ**: ビジネスロジックを独立してテスト可能
4. **フレームワーク非依存**: ビジネスロジックはフレームワークに依存しない

### レイヤー構造

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Routes, Controllers, DTOs)            │
│  - Ktor Plugin                          │
│  - HTTP Request/Response                │
└──────────────┬──────────────────────────┘
               │ depends on
               ↓
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Use Cases, Application Services)      │
│  - ビジネスロジックの調整               │
│  - トランザクション管理                 │
└──────────────┬──────────────────────────┘
               │ depends on
               ↓
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│  (Entities, Value Objects, Interfaces)  │
│  - ビジネスルール                       │
│  - ドメインモデル                       │
└──────────────┬──────────────────────────┘
               │ implemented by
               ↓
┌─────────────────────────────────────────┐
│       Infrastructure Layer              │
│  (DB, External APIs, Repositories)      │
│  - Exposed (ORM)                        │
│  - PostgreSQL                           │
│  - 外部サービス連携                     │
└─────────────────────────────────────────┘
```

---

## プロジェクト構造

```
api/
├── src/
│   └── main/
│       └── kotlin/
│           └── com/
│               └── speedmatch/
│                   ├── Application.kt              # エントリーポイント
│                   │
│                   ├── domain/                     # Domain Layer
│                   │   ├── model/                  # エンティティ
│                   │   │   ├── Player.kt
│                   │   │   ├── Room.kt
│                   │   │   ├── Game.kt
│                   │   │   └── Card.kt
│                   │   │
│                   │   ├── valueobject/            # 値オブジェクト
│                   │   │   ├── PlayerId.kt
│                   │   │   ├── RoomCode.kt
│                   │   │   ├── PlayerName.kt
│                   │   │   └── CardNumber.kt
│                   │   │
│                   │   ├── repository/             # リポジトリインターフェース
│                   │   │   ├── PlayerRepository.kt
│                   │   │   ├── RoomRepository.kt
│                   │   │   └── GameRepository.kt
│                   │   │
│                   │   ├── service/                # ドメインサービス
│                   │   │   ├── GameRuleService.kt
│                   │   │   └── RoomCodeGenerator.kt
│                   │   │
│                   │   └── exception/              # ドメイン例外
│                   │       ├── DomainException.kt
│                   │       ├── PlayerNotFoundException.kt
│                   │       └── InvalidCardPlayException.kt
│                   │
│                   ├── application/                # Application Layer
│                   │   ├── usecase/                # ユースケース
│                   │   │   ├── player/
│                   │   │   │   ├── CreatePlayerUseCase.kt
│                   │   │   │   ├── GetPlayerUseCase.kt
│                   │   │   │   └── UpdatePlayerUseCase.kt
│                   │   │   │
│                   │   │   ├── room/
│                   │   │   │   ├── CreateRoomUseCase.kt
│                   │   │   │   ├── JoinRoomUseCase.kt
│                   │   │   │   ├── LeaveRoomUseCase.kt
│                   │   │   │   └── GetRoomListUseCase.kt
│                   │   │   │
│                   │   │   └── game/
│                   │   │       ├── StartGameUseCase.kt
│                   │   │       ├── PlayCardUseCase.kt
│                   │   │       └── DrawCardUseCase.kt
│                   │   │
│                   │   ├── service/                # アプリケーションサービス
│                   │   │   ├── TransactionManager.kt
│                   │   │   └── EventPublisher.kt
│                   │   │
│                   │   └── dto/                    # データ転送オブジェクト
│                   │       ├── PlayerDto.kt
│                   │       ├── RoomDto.kt
│                   │       └── GameDto.kt
│                   │
│                   ├── infrastructure/             # Infrastructure Layer
│                   │   ├── persistence/            # データベース
│                   │   │   ├── DatabaseFactory.kt
│                   │   │   ├── table/              # Exposedテーブル定義
│                   │   │   │   ├── Players.kt
│                   │   │   │   ├── Rooms.kt
│                   │   │   │   ├── Games.kt
│                   │   │   │   └── Cards.kt
│                   │   │   │
│                   │   │   └── repository/         # リポジトリ実装
│                   │   │       ├── PlayerRepositoryImpl.kt
│                   │   │       ├── RoomRepositoryImpl.kt
│                   │   │       └── GameRepositoryImpl.kt
│                   │   │
│                   │   ├── websocket/              # WebSocket管理
│                   │   │   ├── WebSocketManager.kt
│                   │   │   └── GameSessionManager.kt
│                   │   │
│                   │   └── external/               # 外部サービス
│                   │       └── (必要に応じて)
│                   │
│                   └── presentation/               # Presentation Layer
│                       ├── routes/                 # ルート定義
│                       │   ├── PlayerRoutes.kt
│                       │   ├── RoomRoutes.kt
│                       │   ├── GameRoutes.kt
│                       │   └── WebSocketRoutes.kt
│                       │
│                       ├── request/                # リクエストDTO
│                       │   ├── CreatePlayerRequest.kt
│                       │   ├── CreateRoomRequest.kt
│                       │   └── PlayCardRequest.kt
│                       │
│                       ├── response/               # レスポンスDTO
│                       │   ├── PlayerResponse.kt
│                       │   ├── RoomResponse.kt
│                       │   ├── GameResponse.kt
│                       │   └── ErrorResponse.kt
│                       │
│                       ├── mapper/                 # マッパー
│                       │   ├── PlayerMapper.kt
│                       │   ├── RoomMapper.kt
│                       │   └── GameMapper.kt
│                       │
│                       └── plugin/                 # Ktorプラグイン設定
│                           ├── Routing.kt
│                           ├── Serialization.kt
│                           ├── DependencyInjection.kt
│                           ├── StatusPages.kt
│                           └── WebSockets.kt
│
├── build.gradle.kts                               # ビルド設定
├── settings.gradle.kts
└── README.md
```

---

## レイヤー別ガイドライン

### 1. Domain Layer（ドメイン層）

**責務**: ビジネスルールとドメインモデルの定義

#### エンティティ (Entity)

```kotlin
// domain/model/Player.kt
package com.speedmatch.domain.model

import com.speedmatch.domain.valueobject.PlayerId
import com.speedmatch.domain.valueobject.PlayerName

/**
 * プレイヤーエンティティ
 * ビジネスルールと振る舞いを持つ
 */
data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val avatarEmoji: String,
    val statistics: PlayerStatistics
) {
    /**
     * プレイヤー名を更新する
     * ビジネスルール: 名前は3-12文字である必要がある
     */
    fun updateName(newName: PlayerName): Player {
        return copy(name = newName)
    }
    
    /**
     * 勝利を記録する
     */
    fun recordWin(): Player {
        return copy(statistics = statistics.addWin())
    }
    
    /**
     * 敗北を記録する
     */
    fun recordLoss(): Player {
        return copy(statistics = statistics.addLoss())
    }
}

/**
 * プレイヤー統計情報
 */
data class PlayerStatistics(
    val totalGames: Int = 0,
    val wins: Int = 0,
    val losses: Int = 0,
    val fastestClearTurns: Int? = null
) {
    val winRate: Double
        get() = if (totalGames == 0) 0.0 else wins.toDouble() / totalGames
    
    fun addWin(): PlayerStatistics = copy(
        totalGames = totalGames + 1,
        wins = wins + 1
    )
    
    fun addLoss(): PlayerStatistics = copy(
        totalGames = totalGames + 1,
        losses = losses + 1
    )
    
    fun updateFastestClearTurns(turns: Int): PlayerStatistics {
        return if (fastestClearTurns == null || turns < fastestClearTurns) {
            copy(fastestClearTurns = turns)
        } else {
            this
        }
    }
}
```

#### 値オブジェクト (Value Object)

```kotlin
// domain/valueobject/PlayerId.kt
package com.speedmatch.domain.valueobject

import com.speedmatch.domain.exception.InvalidPlayerIdException
import java.util.UUID

/**
 * プレイヤーID値オブジェクト
 * 不変で、ビジネスルールを持つ
 */
@JvmInline
value class PlayerId(val value: UUID) {
    companion object {
        fun generate(): PlayerId = PlayerId(UUID.randomUUID())
        
        fun fromString(value: String): PlayerId {
            return try {
                PlayerId(UUID.fromString(value))
            } catch (e: IllegalArgumentException) {
                throw InvalidPlayerIdException("Invalid player ID format: $value")
            }
        }
    }
    
    override fun toString(): String = value.toString()
}

// domain/valueobject/PlayerName.kt
package com.speedmatch.domain.valueobject

import com.speedmatch.domain.exception.InvalidPlayerNameException

/**
 * プレイヤー名値オブジェクト
 * ビジネスルール: 3-12文字、空白のみは不可
 */
@JvmInline
value class PlayerName private constructor(val value: String) {
    companion object {
        private const val MIN_LENGTH = 3
        private const val MAX_LENGTH = 12
        
        fun create(value: String): PlayerName {
            val trimmed = value.trim()
            
            when {
                trimmed.isBlank() -> 
                    throw InvalidPlayerNameException("Player name cannot be blank")
                trimmed.length < MIN_LENGTH -> 
                    throw InvalidPlayerNameException("Player name must be at least $MIN_LENGTH characters")
                trimmed.length > MAX_LENGTH -> 
                    throw InvalidPlayerNameException("Player name must be at most $MAX_LENGTH characters")
            }
            
            return PlayerName(trimmed)
        }
    }
    
    override fun toString(): String = value
}

// domain/valueobject/RoomCode.kt
package com.speedmatch.domain.valueobject

import com.speedmatch.domain.exception.InvalidRoomCodeException

/**
 * ルームコード値オブジェクト
 * ビジネスルール: 6桁の英数字
 */
@JvmInline
value class RoomCode private constructor(val value: String) {
    companion object {
        private const val LENGTH = 6
        private val ALLOWED_CHARS = ('A'..'Z') + ('0'..'9')
        
        fun generate(): RoomCode {
            val code = (1..LENGTH)
                .map { ALLOWED_CHARS.random() }
                .joinToString("")
            return RoomCode(code)
        }
        
        fun fromString(value: String): RoomCode {
            val normalized = value.uppercase().trim()
            
            when {
                normalized.length != LENGTH ->
                    throw InvalidRoomCodeException("Room code must be $LENGTH characters")
                !normalized.all { it in ALLOWED_CHARS } ->
                    throw InvalidRoomCodeException("Room code must contain only alphanumeric characters")
            }
            
            return RoomCode(normalized)
        }
    }
    
    override fun toString(): String = value
}
```

#### リポジトリインターフェース

```kotlin
// domain/repository/PlayerRepository.kt
package com.speedmatch.domain.repository

import com.speedmatch.domain.model.Player
import com.speedmatch.domain.valueobject.PlayerId
import com.speedmatch.domain.valueobject.PlayerName

/**
 * プレイヤーリポジトリインターフェース
 * ドメイン層で定義し、インフラ層で実装する
 */
interface PlayerRepository {
    /**
     * プレイヤーを保存する
     */
    suspend fun save(player: Player): Player
    
    /**
     * IDでプレイヤーを検索する
     */
    suspend fun findById(id: PlayerId): Player?
    
    /**
     * 名前でプレイヤーを検索する
     */
    suspend fun findByName(name: PlayerName): Player?
    
    /**
     * 全プレイヤーを取得する
     */
    suspend fun findAll(): List<Player>
    
    /**
     * プレイヤーを削除する
     */
    suspend fun delete(id: PlayerId): Boolean
    
    /**
     * 名前が存在するかチェックする
     */
    suspend fun existsByName(name: PlayerName): Boolean
}
```

#### ドメインサービス

```kotlin
// domain/service/GameRuleService.kt
package com.speedmatch.domain.service

import com.speedmatch.domain.model.Card
import com.speedmatch.domain.valueobject.CardNumber

/**
 * ゲームルールサービス
 * 複数のエンティティにまたがるビジネスロジック
 */
class GameRuleService {
    /**
     * カードがプレイ可能かチェック
     * ルール: 場のカードより±1以内または同じ数字
     */
    fun canPlayCard(fieldCard: Card, handCard: Card): Boolean {
        val fieldNumber = fieldCard.number.value
        val handNumber = handCard.number.value
        
        return when {
            fieldNumber == handNumber -> true  // 同じ数字
            fieldNumber == handNumber + 1 -> true  // +1
            fieldNumber == handNumber - 1 -> true  // -1
            else -> false
        }
    }
    
    /**
     * 初期手札を生成する
     */
    fun generateInitialHand(handSize: Int): List<Card> {
        require(handSize in 5..10) { "Hand size must be between 5 and 10" }
        
        return (1..handSize).map {
            Card.random()
        }
    }
    
    /**
     * ゲーム終了条件をチェック
     */
    fun isGameOver(playerHands: Map<String, List<Card>>): Boolean {
        return playerHands.any { it.value.isEmpty() }
    }
}
```

#### ドメイン例外

```kotlin
// domain/exception/DomainException.kt
package com.speedmatch.domain.exception

/**
 * ドメイン層の基底例外
 */
sealed class DomainException(message: String) : Exception(message)

// プレイヤー関連
class PlayerNotFoundException(message: String) : DomainException(message)
class InvalidPlayerNameException(message: String) : DomainException(message)
class InvalidPlayerIdException(message: String) : DomainException(message)
class DuplicatePlayerNameException(message: String) : DomainException(message)

// ルーム関連
class RoomNotFoundException(message: String) : DomainException(message)
class InvalidRoomCodeException(message: String) : DomainException(message)
class RoomFullException(message: String) : DomainException(message)
class RoomAlreadyStartedException(message: String) : DomainException(message)

// ゲーム関連
class InvalidCardPlayException(message: String) : DomainException(message)
class NotPlayerTurnException(message: String) : DomainException(message)
class GameNotStartedException(message: String) : DomainException(message)
```

---

### 2. Application Layer（アプリケーション層）

**責務**: ユースケースの実装、トランザクション管理、ドメインロジックの調整

#### ユースケース

```kotlin
// application/usecase/player/CreatePlayerUseCase.kt
package com.speedmatch.application.usecase.player

import com.speedmatch.domain.exception.DuplicatePlayerNameException
import com.speedmatch.domain.model.Player
import com.speedmatch.domain.model.PlayerStatistics
import com.speedmatch.domain.repository.PlayerRepository
import com.speedmatch.domain.valueobject.PlayerId
import com.speedmatch.domain.valueobject.PlayerName

/**
 * プレイヤー作成ユースケース
 * 単一責任: プレイヤーを作成する
 */
class CreatePlayerUseCase(
    private val playerRepository: PlayerRepository
) {
    /**
     * プレイヤーを作成する
     * 
     * @param name プレイヤー名（3-12文字）
     * @param avatarEmoji アバター絵文字
     * @return 作成されたプレイヤー
     * @throws DuplicatePlayerNameException 名前が既に存在する場合
     */
    suspend fun execute(name: String, avatarEmoji: String): Player {
        val playerName = PlayerName.create(name)
        
        // ビジネスルール: 名前の重複チェック
        if (playerRepository.existsByName(playerName)) {
            throw DuplicatePlayerNameException("Player name '$name' already exists")
        }
        
        // 新規プレイヤーを作成
        val player = Player(
            id = PlayerId.generate(),
            name = playerName,
            avatarEmoji = avatarEmoji,
            statistics = PlayerStatistics()
        )
        
        return playerRepository.save(player)
    }
}

// application/usecase/player/GetPlayerUseCase.kt
package com.speedmatch.application.usecase.player

import com.speedmatch.domain.exception.PlayerNotFoundException
import com.speedmatch.domain.model.Player
import com.speedmatch.domain.repository.PlayerRepository
import com.speedmatch.domain.valueobject.PlayerId

/**
 * プレイヤー取得ユースケース
 */
class GetPlayerUseCase(
    private val playerRepository: PlayerRepository
) {
    /**
     * IDでプレイヤーを取得する
     */
    suspend fun execute(playerId: String): Player {
        val id = PlayerId.fromString(playerId)
        return playerRepository.findById(id)
            ?: throw PlayerNotFoundException("Player not found: $playerId")
    }
}

// application/usecase/room/CreateRoomUseCase.kt
package com.speedmatch.application.usecase.room

import com.speedmatch.domain.exception.PlayerNotFoundException
import com.speedmatch.domain.model.Room
import com.speedmatch.domain.model.RoomSettings
import com.speedmatch.domain.repository.PlayerRepository
import com.speedmatch.domain.repository.RoomRepository
import com.speedmatch.domain.valueobject.PlayerId
import com.speedmatch.domain.valueobject.RoomCode

/**
 * ルーム作成ユースケース
 */
class CreateRoomUseCase(
    private val roomRepository: RoomRepository,
    private val playerRepository: PlayerRepository
) {
    /**
     * ルームを作成する
     */
    suspend fun execute(
        hostPlayerId: String,
        roomName: String?,
        maxPlayers: Int,
        initialHandSize: Int,
        turnTimeLimit: Int?,
        isPublic: Boolean
    ): Room {
        // ホストプレイヤーの存在確認
        val hostId = PlayerId.fromString(hostPlayerId)
        val host = playerRepository.findById(hostId)
            ?: throw PlayerNotFoundException("Host player not found: $hostPlayerId")
        
        // ユニークなルームコードを生成
        val roomCode = generateUniqueRoomCode()
        
        // ルーム設定を作成
        val settings = RoomSettings(
            maxPlayers = maxPlayers,
            initialHandSize = initialHandSize,
            turnTimeLimit = turnTimeLimit,
            isPublic = isPublic
        )
        
        // ルームを作成
        val room = Room.create(
            code = roomCode,
            name = roomName,
            hostId = hostId,
            settings = settings
        )
        
        return roomRepository.save(room)
    }
    
    /**
     * ユニークなルームコードを生成する
     */
    private suspend fun generateUniqueRoomCode(): RoomCode {
        var attempts = 0
        val maxAttempts = 10
        
        while (attempts < maxAttempts) {
            val code = RoomCode.generate()
            if (!roomRepository.existsByCode(code)) {
                return code
            }
            attempts++
        }
        
        throw IllegalStateException("Failed to generate unique room code")
    }
}

// application/usecase/game/PlayCardUseCase.kt
package com.speedmatch.application.usecase.game

import com.speedmatch.domain.exception.*
import com.speedmatch.domain.model.Game
import com.speedmatch.domain.repository.GameRepository
import com.speedmatch.domain.service.GameRuleService
import com.speedmatch.domain.valueobject.PlayerId

/**
 * カードプレイユースケース
 * トランザクション境界を定義
 */
class PlayCardUseCase(
    private val gameRepository: GameRepository,
    private val gameRuleService: GameRuleService
) {
    /**
     * カードをプレイする
     */
    suspend fun execute(
        gameId: String,
        playerId: String,
        cardIndex: Int
    ): Game {
        // ゲームとプレイヤーを取得
        val game = gameRepository.findById(gameId)
            ?: throw GameNotFoundException("Game not found: $gameId")
        
        val playerIdValue = PlayerId.fromString(playerId)
        
        // ビジネスルールのチェック
        if (!game.isPlayerTurn(playerIdValue)) {
            throw NotPlayerTurnException("Not player's turn")
        }
        
        val handCard = game.getPlayerHand(playerIdValue)
            .getOrNull(cardIndex)
            ?: throw InvalidCardPlayException("Invalid card index: $cardIndex")
        
        val fieldCard = game.fieldCard
        
        if (!gameRuleService.canPlayCard(fieldCard, handCard)) {
            throw InvalidCardPlayException("Cannot play this card")
        }
        
        // カードをプレイ
        val updatedGame = game.playCard(playerIdValue, cardIndex)
        
        return gameRepository.save(updatedGame)
    }
}
```

#### アプリケーションサービス

```kotlin
// application/service/TransactionManager.kt
package com.speedmatch.application.service

/**
 * トランザクション管理サービス
 */
interface TransactionManager {
    /**
     * トランザクション内で処理を実行する
     */
    suspend fun <T> transaction(block: suspend () -> T): T
}
```

---

### 3. Infrastructure Layer（インフラ層）

**責務**: データベース、外部サービスとの連携

#### データベース設定

```kotlin
// infrastructure/persistence/DatabaseFactory.kt
package com.speedmatch.infrastructure.persistence

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import com.speedmatch.infrastructure.persistence.table.*

/**
 * データベース接続ファクトリ
 */
object DatabaseFactory {
    fun init(
        jdbcUrl: String,
        driverClassName: String,
        username: String,
        password: String
    ) {
        val database = Database.connect(
            createHikariDataSource(jdbcUrl, driverClassName, username, password)
        )
        
        transaction(database) {
            // テーブル作成
            SchemaUtils.create(
                Players,
                Rooms,
                RoomPlayers,
                Games,
                GamePlayers,
                Cards
            )
        }
    }
    
    private fun createHikariDataSource(
        url: String,
        driver: String,
        username: String,
        password: String
    ): HikariDataSource {
        val config = HikariConfig().apply {
            jdbcUrl = url
            driverClassName = driver
            this.username = username
            this.password = password
            maximumPoolSize = 10
            minimumIdle = 2
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }
        return HikariDataSource(config)
    }
}
```

#### テーブル定義

```kotlin
// infrastructure/persistence/table/Players.kt
package com.speedmatch.infrastructure.persistence.table

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant

/**
 * プレイヤーテーブル定義
 */
object Players : Table("players") {
    val id = uuid("id")
    val name = varchar("name", 50).uniqueIndex()
    val avatarEmoji = varchar("avatar_emoji", 10)
    val totalGames = integer("total_games").default(0)
    val wins = integer("wins").default(0)
    val losses = integer("losses").default(0)
    val fastestClearTurns = integer("fastest_clear_turns").nullable()
    val createdAt = timestamp("created_at").default(Instant.now())
    val updatedAt = timestamp("updated_at").default(Instant.now())
    
    override val primaryKey = PrimaryKey(id)
}
```

#### リポジトリ実装

```kotlin
// infrastructure/persistence/repository/PlayerRepositoryImpl.kt
package com.speedmatch.infrastructure.persistence.repository

import com.speedmatch.domain.model.Player
import com.speedmatch.domain.model.PlayerStatistics
import com.speedmatch.domain.repository.PlayerRepository
import com.speedmatch.domain.valueobject.PlayerId
import com.speedmatch.domain.valueobject.PlayerName
import com.speedmatch.infrastructure.persistence.table.Players
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction

/**
 * プレイヤーリポジトリ実装
 * Exposedを使用してPostgreSQLと連携
 */
class PlayerRepositoryImpl : PlayerRepository {
    
    override suspend fun save(player: Player): Player = newSuspendedTransaction {
        val existingPlayer = Players.select { Players.id eq player.id.value }.singleOrNull()
        
        if (existingPlayer != null) {
            // 更新
            Players.update({ Players.id eq player.id.value }) {
                it[name] = player.name.value
                it[avatarEmoji] = player.avatarEmoji
                it[totalGames] = player.statistics.totalGames
                it[wins] = player.statistics.wins
                it[losses] = player.statistics.losses
                it[fastestClearTurns] = player.statistics.fastestClearTurns
                it[updatedAt] = java.time.Instant.now()
            }
        } else {
            // 新規作成
            Players.insert {
                it[id] = player.id.value
                it[name] = player.name.value
                it[avatarEmoji] = player.avatarEmoji
                it[totalGames] = player.statistics.totalGames
                it[wins] = player.statistics.wins
                it[losses] = player.statistics.losses
                it[fastestClearTurns] = player.statistics.fastestClearTurns
            }
        }
        
        player
    }
    
    override suspend fun findById(id: PlayerId): Player? = newSuspendedTransaction {
        Players.select { Players.id eq id.value }
            .singleOrNull()
            ?.toPlayer()
    }
    
    override suspend fun findByName(name: PlayerName): Player? = newSuspendedTransaction {
        Players.select { Players.name eq name.value }
            .singleOrNull()
            ?.toPlayer()
    }
    
    override suspend fun findAll(): List<Player> = newSuspendedTransaction {
        Players.selectAll()
            .map { it.toPlayer() }
    }
    
    override suspend fun delete(id: PlayerId): Boolean = newSuspendedTransaction {
        Players.deleteWhere { Players.id eq id.value } > 0
    }
    
    override suspend fun existsByName(name: PlayerName): Boolean = newSuspendedTransaction {
        Players.select { Players.name eq name.value }
            .count() > 0
    }
    
    /**
     * ResultRowをPlayerエンティティに変換
     */
    private fun ResultRow.toPlayer(): Player {
        return Player(
            id = PlayerId(this[Players.id]),
            name = PlayerName.create(this[Players.name]),
            avatarEmoji = this[Players.avatarEmoji],
            statistics = PlayerStatistics(
                totalGames = this[Players.totalGames],
                wins = this[Players.wins],
                losses = this[Players.losses],
                fastestClearTurns = this[Players.fastestClearTurns]
            )
        )
    }
}
```

---

### 4. Presentation Layer（プレゼンテーション層）

**責務**: HTTP通信、ルーティング、リクエスト/レスポンス変換

#### ルート定義

```kotlin
// presentation/routes/PlayerRoutes.kt
package com.speedmatch.presentation.routes

import com.speedmatch.application.usecase.player.*
import com.speedmatch.domain.exception.DomainException
import com.speedmatch.presentation.request.CreatePlayerRequest
import com.speedmatch.presentation.request.UpdatePlayerRequest
import com.speedmatch.presentation.response.ErrorResponse
import com.speedmatch.presentation.response.PlayerResponse
import com.speedmatch.presentation.mapper.PlayerMapper
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

/**
 * プレイヤー関連のルート定義
 */
fun Route.playerRoutes(
    createPlayerUseCase: CreatePlayerUseCase,
    getPlayerUseCase: GetPlayerUseCase,
    updatePlayerUseCase: UpdatePlayerUseCase,
    deletePlayerUseCase: DeletePlayerUseCase
) {
    route("/players") {
        
        // プレイヤー作成
        post {
            try {
                val request = call.receive<CreatePlayerRequest>()
                val player = createPlayerUseCase.execute(
                    name = request.name,
                    avatarEmoji = request.avatarEmoji
                )
                val response = PlayerMapper.toResponse(player)
                call.respond(HttpStatusCode.Created, response)
            } catch (e: DomainException) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(e.message ?: "Invalid request")
                )
            }
        }
        
        // プレイヤー取得
        get("/{id}") {
            try {
                val id = call.parameters["id"] 
                    ?: return@get call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse("Player ID is required")
                    )
                
                val player = getPlayerUseCase.execute(id)
                val response = PlayerMapper.toResponse(player)
                call.respond(HttpStatusCode.OK, response)
            } catch (e: DomainException) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse(e.message ?: "Player not found")
                )
            }
        }
        
        // プレイヤー更新
        put("/{id}") {
            try {
                val id = call.parameters["id"]
                    ?: return@put call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse("Player ID is required")
                    )
                
                val request = call.receive<UpdatePlayerRequest>()
                val player = updatePlayerUseCase.execute(
                    playerId = id,
                    name = request.name,
                    avatarEmoji = request.avatarEmoji
                )
                val response = PlayerMapper.toResponse(player)
                call.respond(HttpStatusCode.OK, response)
            } catch (e: DomainException) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(e.message ?: "Invalid request")
                )
            }
        }
        
        // プレイヤー削除
        delete("/{id}") {
            try {
                val id = call.parameters["id"]
                    ?: return@delete call.respond(
                        HttpStatusCode.BadRequest,
                        ErrorResponse("Player ID is required")
                    )
                
                deletePlayerUseCase.execute(id)
                call.respond(HttpStatusCode.NoContent)
            } catch (e: DomainException) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse(e.message ?: "Player not found")
                )
            }
        }
    }
}
```

#### リクエスト/レスポンスDTO

```kotlin
// presentation/request/CreatePlayerRequest.kt
package com.speedmatch.presentation.request

import kotlinx.serialization.Serializable

@Serializable
data class CreatePlayerRequest(
    val name: String,
    val avatarEmoji: String
)

// presentation/response/PlayerResponse.kt
package com.speedmatch.presentation.response

import kotlinx.serialization.Serializable

@Serializable
data class PlayerResponse(
    val id: String,
    val name: String,
    val avatarEmoji: String,
    val statistics: PlayerStatisticsResponse
)

@Serializable
data class PlayerStatisticsResponse(
    val totalGames: Int,
    val wins: Int,
    val losses: Int,
    val winRate: Double,
    val fastestClearTurns: Int?
)

// presentation/response/ErrorResponse.kt
package com.speedmatch.presentation.response

import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(
    val message: String,
    val code: String? = null
)
```

#### マッパー

```kotlin
// presentation/mapper/PlayerMapper.kt
package com.speedmatch.presentation.mapper

import com.speedmatch.domain.model.Player
import com.speedmatch.presentation.response.PlayerResponse
import com.speedmatch.presentation.response.PlayerStatisticsResponse

/**
 * プレイヤーエンティティとレスポンスDTOの変換
 */
object PlayerMapper {
    fun toResponse(player: Player): PlayerResponse {
        return PlayerResponse(
            id = player.id.toString(),
            name = player.name.value,
            avatarEmoji = player.avatarEmoji,
            statistics = PlayerStatisticsResponse(
                totalGames = player.statistics.totalGames,
                wins = player.statistics.wins,
                losses = player.statistics.losses,
                winRate = player.statistics.winRate,
                fastestClearTurns = player.statistics.fastestClearTurns
            )
        )
    }
}
```

#### Ktorプラグイン設定

```kotlin
// presentation/plugin/DependencyInjection.kt
package com.speedmatch.presentation.plugin

import com.speedmatch.application.usecase.player.*
import com.speedmatch.domain.repository.PlayerRepository
import com.speedmatch.domain.service.GameRuleService
import com.speedmatch.infrastructure.persistence.repository.PlayerRepositoryImpl
import io.ktor.server.application.*
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin

/**
 * 依存性注入の設定
 */
fun Application.configureDependencyInjection() {
    install(Koin) {
        modules(appModule)
    }
}

val appModule = module {
    // Repositories
    single<PlayerRepository> { PlayerRepositoryImpl() }
    
    // Domain Services
    single { GameRuleService() }
    
    // Use Cases
    single { CreatePlayerUseCase(get()) }
    single { GetPlayerUseCase(get()) }
    single { UpdatePlayerUseCase(get()) }
    single { DeletePlayerUseCase(get()) }
}

// presentation/plugin/Routing.kt
package com.speedmatch.presentation.plugin

import com.speedmatch.application.usecase.player.*
import com.speedmatch.presentation.routes.playerRoutes
import io.ktor.server.application.*
import io.ktor.server.routing.*
import org.koin.ktor.ext.inject

fun Application.configureRouting() {
    // Use Casesを注入
    val createPlayerUseCase by inject<CreatePlayerUseCase>()
    val getPlayerUseCase by inject<GetPlayerUseCase>()
    val updatePlayerUseCase by inject<UpdatePlayerUseCase>()
    val deletePlayerUseCase by inject<DeletePlayerUseCase>()
    
    routing {
        route("/api/v1") {
            playerRoutes(
                createPlayerUseCase,
                getPlayerUseCase,
                updatePlayerUseCase,
                deletePlayerUseCase
            )
        }
    }
}
```

---

## 依存性の注入

### Koinの設定

```kotlin
// Application.kt
package com.speedmatch

import com.speedmatch.infrastructure.persistence.DatabaseFactory
import com.speedmatch.presentation.plugin.*
import io.ktor.server.application.*
import io.ktor.server.netty.*

fun main(args: Array<String>) {
    EngineMain.main(args)
}

fun Application.module() {
    // データベース初期化
    DatabaseFactory.init(
        jdbcUrl = environment.config.property("database.jdbcUrl").getString(),
        driverClassName = environment.config.property("database.driverClassName").getString(),
        username = environment.config.property("database.username").getString(),
        password = environment.config.property("database.password").getString()
    )
    
    // プラグイン設定
    configureDependencyInjection()
    configureSerialization()
    configureRouting()
    configureStatusPages()
    configureWebSockets()
}
```

---

## テスト戦略

### 1. ドメイン層のテスト

```kotlin
// test/domain/model/PlayerTest.kt
package com.speedmatch.domain.model

import com.speedmatch.domain.valueobject.PlayerId
import com.speedmatch.domain.valueobject.PlayerName
import kotlin.test.Test
import kotlin.test.assertEquals

class PlayerTest {
    @Test
    fun `should record win correctly`() {
        // Given
        val player = Player(
            id = PlayerId.generate(),
            name = PlayerName.create("TestPlayer"),
            avatarEmoji = "😀",
            statistics = PlayerStatistics()
        )
        
        // When
        val updatedPlayer = player.recordWin()
        
        // Then
        assertEquals(1, updatedPlayer.statistics.wins)
        assertEquals(1, updatedPlayer.statistics.totalGames)
        assertEquals(1.0, updatedPlayer.statistics.winRate)
    }
}
```

### 2. アプリケーション層のテスト

```kotlin
// test/application/usecase/CreatePlayerUseCaseTest.kt
package com.speedmatch.application.usecase.player

import com.speedmatch.domain.exception.DuplicatePlayerNameException
import com.speedmatch.domain.model.Player
import com.speedmatch.domain.repository.PlayerRepository
import com.speedmatch.domain.valueobject.PlayerName
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import kotlin.test.Test
import kotlin.test.assertFailsWith

class CreatePlayerUseCaseTest {
    private val playerRepository = mockk<PlayerRepository>()
    private val useCase = CreatePlayerUseCase(playerRepository)
    
    @Test
    fun `should create player successfully`() = runBlocking {
        // Given
        val name = "TestPlayer"
        val emoji = "😀"
        coEvery { playerRepository.existsByName(any()) } returns false
        coEvery { playerRepository.save(any()) } answers { firstArg() }
        
        // When
        val player = useCase.execute(name, emoji)
        
        // Then
        coVerify { playerRepository.existsByName(PlayerName.create(name)) }
        coVerify { playerRepository.save(any()) }
    }
    
    @Test
    fun `should throw exception when name already exists`() = runBlocking {
        // Given
        val name = "ExistingPlayer"
        coEvery { playerRepository.existsByName(any()) } returns true
        
        // When & Then
        assertFailsWith<DuplicatePlayerNameException> {
            useCase.execute(name, "😀")
        }
    }
}
```

### 3. インフラ層のテスト

```kotlin
// test/infrastructure/repository/PlayerRepositoryImplTest.kt
package com.speedmatch.infrastructure.repository

import com.speedmatch.domain.model.Player
import com.speedmatch.domain.valueobject.PlayerId
import com.speedmatch.domain.valueobject.PlayerName
import com.speedmatch.infrastructure.persistence.DatabaseFactory
import kotlinx.coroutines.runBlocking
import org.jetbrains.exposed.sql.transactions.transaction
import kotlin.test.*

class PlayerRepositoryImplTest {
    private lateinit var repository: PlayerRepositoryImpl
    
    @BeforeTest
    fun setup() {
        // テスト用データベース初期化
        DatabaseFactory.init(
            jdbcUrl = "jdbc:h2:mem:test;DB_CLOSE_DELAY=-1",
            driverClassName = "org.h2.Driver",
            username = "sa",
            password = ""
        )
        repository = PlayerRepositoryImpl()
    }
    
    @Test
    fun `should save and find player by id`() = runBlocking {
        // Given
        val player = createTestPlayer()
        
        // When
        val savedPlayer = repository.save(player)
        val foundPlayer = repository.findById(player.id)
        
        // Then
        assertNotNull(foundPlayer)
        assertEquals(player.id, foundPlayer.id)
        assertEquals(player.name, foundPlayer.name)
    }
    
    private fun createTestPlayer(): Player {
        return Player(
            id = PlayerId.generate(),
            name = PlayerName.create("TestPlayer"),
            avatarEmoji = "😀",
            statistics = PlayerStatistics()
        )
    }
}
```

---

## ベストプラクティス

### 1. **依存性の方向**
- 内側のレイヤーは外側のレイヤーに依存しない
- インターフェースは使用する側（内側）で定義する

### 2. **イミュータブルなモデル**
- エンティティと値オブジェクトは不変にする
- 状態変更は新しいインスタンスを返す

### 3. **例外処理**
- ドメイン例外は意味のある名前をつける
- プレゼンテーション層で適切なHTTPステータスコードに変換

### 4. **トランザクション境界**
- ユースケースがトランザクション境界
- 複数のリポジトリ操作は同一トランザクション内で実行

### 5. **テスト**
- ドメイン層は100%カバレッジを目指す
- アプリケーション層はモックを使用
- インフラ層はインテグレーションテスト

### 6. **パッケージング**
- レイヤーごとにパッケージを分ける
- 機能ごとにサブパッケージを作成

### 7. **命名規則**
```
- UseCase: 〜UseCase
- Repository: 〜Repository / 〜RepositoryImpl
- Entity: 名詞
- Value Object: 名詞
- Domain Service: 〜Service
- DTO: 〜Request / 〜Response / 〜Dto
```

### 8. **コメント**
- パブリックAPIにはKDocを記述
- ビジネスルールは必ずコメントする
- なぜそうしたかを記述する

---

## 参考リソース

### 書籍
- 『クリーンアーキテクチャ』 Robert C. Martin
- 『ドメイン駆動設計』 Eric Evans
- 『実践ドメイン駆動設計』 Vaughn Vernon

### ライブラリ
- **Ktor**: https://ktor.io/
- **Exposed**: https://github.com/JetBrains/Exposed
- **Koin**: https://insert-koin.io/
- **Kotlin Coroutines**: https://kotlinlang.org/docs/coroutines-overview.html

### コード例
- このガイドラインのサンプルコードを参考に実装してください
- 各レイヤーの責務を明確に保ち、依存性の方向を守ってください

---

## まとめ

このガイドラインに従うことで：

✅ **保守性の高いコード**: レイヤーが分離され、変更の影響範囲が限定される
✅ **テスタブルなコード**: ビジネスロジックを独立してテスト可能
✅ **フレームワーク非依存**: Ktorを別のフレームワークに置き換え可能
✅ **理解しやすいコード**: 各クラスの責務が明確で、コードを読みやすい

質問や不明点があれば、チームで議論しながら進めていきましょう！🚀
