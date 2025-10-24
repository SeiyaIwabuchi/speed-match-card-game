package com.speedmatch.domain.service

import com.speedmatch.domain.dto.CardDTO
import com.speedmatch.domain.game.*
import com.speedmatch.infrastructure.database.GameActions
import com.speedmatch.infrastructure.database.Games
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant

/**
 * ゲームビジネスロジックサービス
 * GameEngineとデータベースの橋渡しを行う
 */
class GameService {
    private val json = Json { ignoreUnknownKeys = true }

    /**
     * 新しいゲームを作成
     * 
     * @param roomId ルームID
     * @param playerIds プレイヤーIDリスト
     * @return 作成されたGameState
     */
    fun createGame(roomId: String, playerIds: List<String>): GameState {
        // GameEngineでゲーム初期化
        val gameState = GameEngine.initializeGame(roomId, playerIds)

        // データベースに保存
        transaction {
            Games.insert {
                it[gameId] = gameState.gameId
                it[Games.roomId] = gameState.roomId
                it[status] = gameState.status.name
                it[stateJson] = serializeGameState(gameState)
                it[currentTurnPlayerId] = gameState.currentPlayerId
                it[turnNumber] = 1
                it[deckRemaining] = gameState.deckRemaining
                it[startedAt] = Instant.now()
                it[createdAt] = Instant.now()
                it[updatedAt] = Instant.now()
            }

            // 初期化アクションを記録
            GameActions.insert {
                it[GameActions.gameId] = gameState.gameId
                it[playerId] = "system"
                it[actionType] = "INIT"
                it[turnNumber] = 0
                it[actionData] = json.encodeToString(mapOf(
                    "playerIds" to playerIds,
                    "deckSize" to 52
                ))
                it[createdAt] = Instant.now()
            }
        }

        return gameState
    }

    /**
     * ゲーム状態を取得
     * 
     * @param gameId ゲームID
     * @return GameState or null
     */
    fun getGameState(gameId: String): GameState? {
        return transaction {
            Games.selectAll().where { Games.gameId eq gameId }
                .singleOrNull()
                ?.let { row ->
                    deserializeGameState(row[Games.stateJson])
                }
        }
    }

    /**
     * カードをプレイ
     * 
     * @param gameId ゲームID
     * @param playerId プレイヤーID
     * @param card プレイするカード
     * @param targetField 場札のインデックス（0 or 1）
     * @return 更新されたGameState
     */
    fun playCard(gameId: String, playerId: String, card: Card, targetField: Int): GameState {
        return transaction {
            // 現在の状態を取得
            val currentState = getGameState(gameId)
                ?: throw IllegalStateException("ゲームが見つかりません: $gameId")

            // GameEngineでカードプレイ処理
            val newState = GameEngine.playCard(currentState, playerId, card, targetField)

            // データベースを更新
            Games.update({ Games.gameId eq gameId }) {
                it[stateJson] = serializeGameState(newState)
                it[status] = newState.status.name
                it[currentTurnPlayerId] = if (newState.status == GameStatus.PLAYING) newState.currentPlayerId else null
                it[deckRemaining] = newState.deckRemaining
                it[updatedAt] = Instant.now()
                if (newState.status == GameStatus.FINISHED) {
                    it[finishedAt] = Instant.now()
                    it[winnerId] = playerId
                }
            }

            // アクションを記録
            GameActions.insert {
                it[GameActions.gameId] = gameId
                it[GameActions.playerId] = playerId
                it[actionType] = "PLAY"
                it[turnNumber] = currentState.currentPlayerIndex + 1
                it[cardValue] = card.rank
                it[previousFieldCard] = if (targetField == 0) 
                    currentState.fieldCards.first.rank 
                else 
                    currentState.fieldCards.second.rank
                it[newFieldCard] = card.rank
                it[handSizeAfter] = newState.getPlayerHand(playerId)?.size
                it[actionData] = json.encodeToString(mapOf(
                    "card" to CardDTO.fromDomain(card),
                    "targetField" to targetField
                ))
                it[createdAt] = Instant.now()
            }

            newState
        }
    }

    /**
     * カードをドロー
     * 
     * @param gameId ゲームID
     * @param playerId プレイヤーID
     * @return 更新されたGameState
     */
    fun drawCard(gameId: String, playerId: String): GameState {
        return transaction {
            // 現在の状態を取得
            val currentState = getGameState(gameId)
                ?: throw IllegalStateException("ゲームが見つかりません: $gameId")

            // GameEngineでドロー処理
            val newState = GameEngine.drawCard(currentState, playerId)

            // データベースを更新
            Games.update({ Games.gameId eq gameId }) {
                it[stateJson] = serializeGameState(newState)
                it[currentTurnPlayerId] = newState.currentPlayerId
                it[deckRemaining] = newState.deckRemaining
                it[updatedAt] = Instant.now()
            }

            // アクションを記録
            GameActions.insert {
                it[GameActions.gameId] = gameId
                it[GameActions.playerId] = playerId
                it[actionType] = "DRAW"
                it[turnNumber] = currentState.currentPlayerIndex + 1
                it[handSizeAfter] = newState.getPlayerHand(playerId)?.size
                it[actionData] = json.encodeToString(mapOf(
                    "deckRemaining" to newState.deckRemaining
                ))
                it[createdAt] = Instant.now()
            }

            newState
        }
    }

    /**
     * ターンをスキップ
     * 
     * @param gameId ゲームID
     * @param playerId プレイヤーID
     * @return 更新されたGameState
     */
    fun skipTurn(gameId: String, playerId: String): GameState {
        return transaction {
            // 現在の状態を取得
            val currentState = getGameState(gameId)
                ?: throw IllegalStateException("ゲームが見つかりません: $gameId")

            // GameEngineでスキップ処理
            val newState = GameEngine.skipTurn(currentState, playerId)

            // データベースを更新
            Games.update({ Games.gameId eq gameId }) {
                it[stateJson] = serializeGameState(newState)
                it[currentTurnPlayerId] = newState.currentPlayerId
                it[updatedAt] = Instant.now()
            }

            // アクションを記録
            GameActions.insert {
                it[GameActions.gameId] = gameId
                it[GameActions.playerId] = playerId
                it[actionType] = "SKIP"
                it[turnNumber] = currentState.currentPlayerIndex + 1
                it[actionData] = json.encodeToString(mapOf(
                    "reason" to "no_playable_cards_and_empty_deck"
                ))
                it[createdAt] = Instant.now()
            }

            newState
        }
    }

    /**
     * 行き詰まりをチェックしてゲームを終了
     * 
     * @param gameId ゲームID
     * @return 更新されたGameState or null
     */
    fun checkAndFinishStalemateGame(gameId: String): GameState? {
        return transaction {
            val currentState = getGameState(gameId) ?: return@transaction null

            if (GameEngine.isStalemate(currentState)) {
                val finishedState = GameEngine.finishGame(currentState)

                Games.update({ Games.gameId eq gameId }) {
                    it[stateJson] = serializeGameState(finishedState)
                    it[status] = finishedState.status.name
                    it[finishedAt] = Instant.now()
                    it[updatedAt] = Instant.now()
                }

                // 行き詰まり終了アクションを記録
                GameActions.insert {
                    it[GameActions.gameId] = gameId
                    it[playerId] = "system"
                    it[actionType] = "STALEMATE"
                    it[turnNumber] = currentState.currentPlayerIndex + 1
                    it[actionData] = json.encodeToString(mapOf(
                        "reason" to "all_players_cannot_play"
                    ))
                    it[createdAt] = Instant.now()
                }

                finishedState
            } else {
                null
            }
        }
    }

    /**
     * GameStateをJSON文字列にシリアライズ
     */
    private fun serializeGameState(gameState: GameState): String {
        // GameStateを直接シリアライズできないため、手動でマップに変換
        val stateMap = mapOf(
            "gameId" to gameState.gameId,
            "roomId" to gameState.roomId,
            "players" to gameState.players.map { player ->
                mapOf(
                    "playerId" to player.playerId,
                    "hand" to player.hand.map { mapOf("suit" to it.suit.name, "rank" to it.rank) },
                    "rank" to player.rank
                )
            },
            "deck" to gameState.deck.map { mapOf("suit" to it.suit.name, "rank" to it.rank) },
            "fieldCards" to mapOf(
                "first" to mapOf("suit" to gameState.fieldCards.first.suit.name, "rank" to gameState.fieldCards.first.rank),
                "second" to mapOf("suit" to gameState.fieldCards.second.suit.name, "rank" to gameState.fieldCards.second.rank)
            ),
            "currentPlayerIndex" to gameState.currentPlayerIndex,
            "turnOrder" to gameState.turnOrder,
            "status" to gameState.status.name,
            "startedAt" to gameState.startedAt,
            "lastUpdatedAt" to gameState.lastUpdatedAt
        )
        return json.encodeToString(stateMap)
    }

    /**
     * JSON文字列からGameStateをデシリアライズ
     */
    private fun deserializeGameState(stateJson: String): GameState {
        val stateMap = json.decodeFromString<Map<String, Any>>(stateJson)
        
        @Suppress("UNCHECKED_CAST")
        val playersData = stateMap["players"] as List<Map<String, Any>>
        @Suppress("UNCHECKED_CAST")
        val deckData = stateMap["deck"] as List<Map<String, Any>>
        @Suppress("UNCHECKED_CAST")
        val fieldCardsData = stateMap["fieldCards"] as Map<String, Map<String, Any>>
        @Suppress("UNCHECKED_CAST")
        val turnOrder = stateMap["turnOrder"] as List<String>
        
        val players = playersData.map { playerMap ->
            @Suppress("UNCHECKED_CAST")
            val handData = playerMap["hand"] as List<Map<String, Any>>
            PlayerState(
                playerId = playerMap["playerId"] as String,
                hand = handData.map { cardMap ->
                    Card(
                        Suit.valueOf(cardMap["suit"] as String),
                        (cardMap["rank"] as Double).toInt()
                    )
                },
                rank = (playerMap["rank"] as? Double)?.toInt()
            )
        }
        
        val deck = deckData.map { cardMap ->
            Card(
                Suit.valueOf(cardMap["suit"] as String),
                (cardMap["rank"] as Double).toInt()
            )
        }
        
        @Suppress("UNCHECKED_CAST")
        val firstFieldData = fieldCardsData["first"] as Map<String, Any>
        @Suppress("UNCHECKED_CAST")
        val secondFieldData = fieldCardsData["second"] as Map<String, Any>
        
        val fieldCards = Pair(
            Card(Suit.valueOf(firstFieldData["suit"] as String), (firstFieldData["rank"] as Double).toInt()),
            Card(Suit.valueOf(secondFieldData["suit"] as String), (secondFieldData["rank"] as Double).toInt())
        )
        
        return GameState(
            gameId = stateMap["gameId"] as String,
            roomId = stateMap["roomId"] as String,
            players = players,
            deck = deck,
            fieldCards = fieldCards,
            currentPlayerIndex = (stateMap["currentPlayerIndex"] as Double).toInt(),
            turnOrder = turnOrder,
            status = GameStatus.valueOf(stateMap["status"] as String),
            startedAt = (stateMap["startedAt"] as Double).toLong(),
            lastUpdatedAt = (stateMap["lastUpdatedAt"] as Double).toLong()
        )
    }
}