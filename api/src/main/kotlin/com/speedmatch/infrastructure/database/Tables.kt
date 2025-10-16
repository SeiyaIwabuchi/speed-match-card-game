package com.speedmatch.infrastructure.database

import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.ReferenceOption

/**
 * Players table definition
 * プレイヤー情報を管理するテーブル
 */
object Players : Table("players") {
    val playerId = varchar("player_id", 50)
    val username = varchar("username", 50).uniqueIndex()
    val avatar = varchar("avatar", 10).default("👤")
    val passwordHash = varchar("password_hash", 255).nullable()
    val email = varchar("email", 255).nullable()
    val totalGames = integer("total_games").default(0)
    val totalWins = integer("total_wins").default(0)
    val totalLosses = integer("total_losses").default(0)
    val fastestWin = integer("fastest_win").nullable()
    val totalCardsPlayed = integer("total_cards_played").default(0)
    val lastLoginAt = timestamp("last_login_at").nullable()
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
    val deletedAt = timestamp("deleted_at").nullable()

    override val primaryKey = PrimaryKey(playerId)
}

/**
 * Rooms table definition
 * ゲームルーム情報を管理するテーブル
 */
object Rooms : Table("rooms") {
    val roomId = varchar("room_id", 50)
    val roomCode = varchar("room_code", 6).uniqueIndex()
    val roomName = varchar("room_name", 100).nullable()
    val hostId = varchar("host_id", 50).references(Players.playerId)
    val maxPlayers = integer("max_players").default(4)
    val currentPlayers = integer("current_players").default(0)
    val initialHandSize = integer("initial_hand_size").default(7)
    val turnTimeLimit = integer("turn_time_limit").default(60)
    val isPublic = bool("is_public").default(true)
    val status = varchar("status", 20).default("waiting")
    val createdAt = timestamp("created_at")
    val startedAt = timestamp("started_at").nullable()
    val finishedAt = timestamp("finished_at").nullable()
    val updatedAt = timestamp("updated_at")

    override val primaryKey = PrimaryKey(roomId)
}

/**
 * RoomPlayers table definition
 * ルームへの参加情報を管理するテーブル
 */
object RoomPlayers : Table("room_players") {
    val id = long("id").autoIncrement()
    val roomId = varchar("room_id", 50).references(Rooms.roomId, onDelete = ReferenceOption.CASCADE)
    val playerId = varchar("player_id", 50).references(Players.playerId)
    val isReady = bool("is_ready").default(false)
    val isHost = bool("is_host").default(false)
    val joinOrder = integer("join_order")
    val joinedAt = timestamp("joined_at")
    val leftAt = timestamp("left_at").nullable()

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex(roomId, playerId)
    }
}

/**
 * Games table definition
 * ゲーム本体の情報を管理するテーブル
 */
object Games : Table("games") {
    val gameId = varchar("game_id", 50)
    val roomId = varchar("room_id", 50).references(Rooms.roomId)
    val status = varchar("status", 20).default("playing")
    val currentTurnPlayerId = varchar("current_turn_player_id", 50).references(Players.playerId).nullable()
    val turnNumber = integer("turn_number").default(1)
    val turnStartedAt = timestamp("turn_started_at").nullable()
    val fieldCardValue = integer("field_card_value").nullable()
    val deckRemaining = integer("deck_remaining").default(0)
    val winnerId = varchar("winner_id", 50).references(Players.playerId).nullable()
    val startedAt = timestamp("started_at")
    val finishedAt = timestamp("finished_at").nullable()
    val duration = integer("duration").nullable()

    override val primaryKey = PrimaryKey(gameId)
}

/**
 * GamePlayers table definition
 * ゲームへの参加情報とプレイヤーの手札を管理するテーブル
 */
object GamePlayers : Table("game_players") {
    val id = long("id").autoIncrement()
    val gameId = varchar("game_id", 50).references(Games.gameId, onDelete = ReferenceOption.CASCADE)
    val playerId = varchar("player_id", 50).references(Players.playerId)
    val playerOrder = integer("player_order")
    val handCards = text("hand_cards").default("[]")
    val handSize = integer("hand_size").default(0)
    val cardsPlayed = integer("cards_played").default(0)
    val turnsUsed = integer("turns_used").default(0)
    val rank = integer("rank").nullable()
    val finishedAt = timestamp("finished_at").nullable()

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex(gameId, playerId)
    }
}

/**
 * GameActions table definition
 * ゲーム中の全アクションを記録するテーブル
 */
object GameActions : Table("game_actions") {
    val actionId = long("action_id").autoIncrement()
    val gameId = varchar("game_id", 50).references(Games.gameId, onDelete = ReferenceOption.CASCADE)
    val playerId = varchar("player_id", 50).references(Players.playerId)
    val actionType = varchar("action_type", 20)
    val turnNumber = integer("turn_number")
    val cardValue = integer("card_value").nullable()
    val previousFieldCard = integer("previous_field_card").nullable()
    val newFieldCard = integer("new_field_card").nullable()
    val handSizeAfter = integer("hand_size_after").nullable()
    val actionData = text("action_data").nullable() // JSON data stored as text
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(actionId)
}

/**
 * ChatMessages table definition
 * ルーム内のチャットメッセージを管理するテーブル
 */
object ChatMessages : Table("chat_messages") {
    val messageId = long("message_id").autoIncrement()
    val roomId = varchar("room_id", 50).references(Rooms.roomId, onDelete = ReferenceOption.CASCADE)
    val playerId = varchar("player_id", 50).references(Players.playerId)
    val message = text("message")
    val messageType = varchar("message_type", 20).default("text")
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(messageId)
}

/**
 * Database schema utilities
 * データベーススキーマのユーティリティ
 */
object SchemaUtils {
    /**
     * Create all database tables
     * 全てのデータベーステーブルを作成
     */
    fun createTables() {
        transaction {
            SchemaUtils.create(
                Players,
                Rooms,
                RoomPlayers,
                Games,
                GamePlayers,
                GameActions,
                ChatMessages
            )
        }
    }
}

/**
 * Seed data utilities for testing
 * テスト用のシードデータユーティリティ
 */
object SeedData {
    /**
     * Insert sample data for testing
     * テスト用のサンプルデータを挿入
     */
    fun insertSampleData() {
        transaction {
            // Sample players
            val player1 = Players.insert {
                it[playerId] = "pl_test_001"
                it[username] = "TestPlayer1"
                it[avatar] = "👤"
                it[totalGames] = 5
                it[totalWins] = 3
                it[totalLosses] = 2
                it[totalCardsPlayed] = 25
                it[createdAt] = java.time.Instant.now()
                it[updatedAt] = java.time.Instant.now()
            }

            val player2 = Players.insert {
                it[playerId] = "pl_test_002"
                it[username] = "TestPlayer2"
                it[avatar] = "🎮"
                it[totalGames] = 3
                it[totalWins] = 1
                it[totalLosses] = 2
                it[totalCardsPlayed] = 18
                it[createdAt] = java.time.Instant.now()
                it[updatedAt] = java.time.Instant.now()
            }

            // Sample room
            val room = Rooms.insert {
                it[roomId] = "rm_test_001"
                it[roomCode] = "ABC123"
                it[roomName] = "Test Room"
                it[hostId] = "pl_test_001"
                it[maxPlayers] = 4
                it[currentPlayers] = 2
                it[status] = "waiting"
                it[createdAt] = java.time.Instant.now()
                it[updatedAt] = java.time.Instant.now()
            }

            // Room players
            RoomPlayers.insert {
                it[roomId] = "rm_test_001"
                it[playerId] = "pl_test_001"
                it[isReady] = true
                it[isHost] = true
                it[joinOrder] = 1
                it[joinedAt] = java.time.Instant.now()
            }

            RoomPlayers.insert {
                it[roomId] = "rm_test_001"
                it[playerId] = "pl_test_002"
                it[isReady] = false
                it[isHost] = false
                it[joinOrder] = 2
                it[joinedAt] = java.time.Instant.now()
            }

            // Sample chat messages
            ChatMessages.insert {
                it[roomId] = "rm_test_001"
                it[playerId] = "pl_test_001"
                it[message] = "Hello everyone!"
                it[messageType] = "text"
                it[createdAt] = java.time.Instant.now()
            }

            ChatMessages.insert {
                it[roomId] = "rm_test_001"
                it[playerId] = "pl_test_002"
                it[message] = "👋"
                it[messageType] = "emoji"
                it[createdAt] = java.time.Instant.now()
            }
        }
    }
}