package com.speedmatch.domain.service

import com.speedmatch.domain.dto.CardDTO
import com.speedmatch.domain.game.*
import com.speedmatch.infrastructure.database.GameActions
import com.speedmatch.infrastructure.database.Games
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
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

            // 初期化アクションを記録（player_idは最初のプレイヤーを使用）
            GameActions.insert {
                it[GameActions.gameId] = gameState.gameId
                it[playerId] = playerIds.first()  // "system"ではなく実際のplayer_idを使用
                it[actionType] = "INIT"
                it[turnNumber] = 0
                val playerIdsJson = playerIds.joinToString(",") { "\"$it\"" }
                it[actionData] = "{\"playerIds\":[$playerIdsJson],\"deckSize\":52}"
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
        val newState = transaction {
            // 現在の状態を取得
            val currentState = getGameState(gameId)
                ?: throw IllegalStateException("ゲームが見つかりません: $gameId")

            // GameEngineでカードプレイ処理
            val updatedState = GameEngine.playCard(currentState, playerId, card, targetField)

            // データベースを更新
            val finishedAt = Instant.now()
            Games.update({ Games.gameId eq gameId }) {
                it[stateJson] = serializeGameState(updatedState)
                it[status] = updatedState.status.name
                it[currentTurnPlayerId] = if (updatedState.status == GameStatus.PLAYING) updatedState.currentPlayerId else null
                it[deckRemaining] = updatedState.deckRemaining
                it[updatedAt] = finishedAt
                if (updatedState.status == GameStatus.FINISHED) {
                    it[Games.finishedAt] = finishedAt
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
                it[handSizeAfter] = updatedState.getPlayerHand(playerId)?.size
                it[actionData] = "{\"card\":{\"suit\":\"${card.suit.name}\",\"rank\":${card.rank}},\"targetField\":$targetField,\"deckRemaining\":${updatedState.deckRemaining}}"
                it[createdAt] = finishedAt
            }

            updatedState
        }
        
        // トランザクション外で統計を更新（別トランザクションで実行）
        if (newState.status == GameStatus.FINISHED) {
            val gameRow = transaction {
                Games.selectAll().where { Games.gameId eq gameId }.single()
            }
            val startedAt = gameRow[Games.startedAt]
            val finishedAt = gameRow[Games.finishedAt]!!
            val playTimeSeconds = (finishedAt.epochSecond - startedAt.epochSecond)
            
            val ranking = newState.players.map { player ->
                player.playerId to (player.rank ?: 99)
            }
            PlayerStatsService().updateGameStats(gameId, ranking, playTimeSeconds)
        }
        
        return newState
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
                it[actionData] = "{\"deckRemaining\":${newState.deckRemaining}}"
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
                it[actionData] = "{\"reason\":\"no_playable_cards_and_empty_deck\"}"
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
        val finishedState = transaction {
            val currentState = getGameState(gameId) ?: return@transaction null

            if (GameEngine.isStalemate(currentState)) {
                val staleGameState = GameEngine.finishGame(currentState)

                val gameRow = Games.selectAll().where { Games.gameId eq gameId }.single()
                val startedAt = gameRow[Games.startedAt]
                val finishedAt = Instant.now()

                Games.update({ Games.gameId eq gameId }) {
                    it[stateJson] = serializeGameState(staleGameState)
                    it[status] = staleGameState.status.name
                    it[Games.finishedAt] = finishedAt
                    it[updatedAt] = finishedAt
                }

                // 行き詰まり終了アクションを記録
                GameActions.insert {
                    it[GameActions.gameId] = gameId
                    it[playerId] = staleGameState.turnOrder.first()  // "system"ではなく実際のプレイヤーIDを使用
                    it[actionType] = "STALEMATE"
                    it[turnNumber] = currentState.currentPlayerIndex + 1
                    it[actionData] = "{\"reason\":\"all_players_cannot_play\"}"
                    it[createdAt] = finishedAt
                }

                staleGameState
            } else {
                null
            }
        }
        
        // トランザクション外で統計を更新（別トランザクションで実行）
        if (finishedState != null) {
            val gameRow = transaction {
                Games.selectAll().where { Games.gameId eq gameId }.single()
            }
            val startedAt = gameRow[Games.startedAt]
            val finishedAt = gameRow[Games.finishedAt]!!
            val playTimeSeconds = (finishedAt.epochSecond - startedAt.epochSecond)
            
            val ranking = finishedState.players.map { player ->
                player.playerId to (player.rank ?: 99)
            }
            PlayerStatsService().updateGameStats(gameId, ranking, playTimeSeconds)
        }
        
        return finishedState
    }

    /**
     * GameStateをJSON文字列にシリアライズ
     */
    private fun serializeGameState(gameState: GameState): String {
        // 手動でJSON文字列を構築（Kotlinx Serializationの制限を回避）
        val playersJson = gameState.players.joinToString(",") { player ->
            val handJson = player.hand.joinToString(",") { card ->
                """{"suit":"${card.suit.name}","rank":${card.rank}}"""
            }
            val rankJson = player.rank?.let { """"rank":$it""" } ?: """"rank":null"""
            """{"playerId":"${player.playerId}","hand":[$handJson],$rankJson}"""
        }
        
        val deckJson = gameState.deck.joinToString(",") { card ->
            """{"suit":"${card.suit.name}","rank":${card.rank}}"""
        }
        
        val turnOrderJson = gameState.turnOrder.joinToString(",") { """"$it"""" }
        
        return """{
            "gameId":"${gameState.gameId}",
            "roomId":"${gameState.roomId}",
            "players":[$playersJson],
            "deck":[$deckJson],
            "fieldCards":{
                "first":{"suit":"${gameState.fieldCards.first.suit.name}","rank":${gameState.fieldCards.first.rank}},
                "second":{"suit":"${gameState.fieldCards.second.suit.name}","rank":${gameState.fieldCards.second.rank}}
            },
            "currentPlayerIndex":${gameState.currentPlayerIndex},
            "turnOrder":[$turnOrderJson],
            "status":"${gameState.status.name}",
            "startedAt":${gameState.startedAt},
            "lastUpdatedAt":${gameState.lastUpdatedAt}
        }""".replace("\n", "").replace(" ", "")
    }

    /**
     * JSON文字列からGameStateをデシリアライズ
     */
    private fun deserializeGameState(stateJson: String): GameState {
        val jsonElement = json.parseToJsonElement(stateJson).jsonObject
        
        val playersData = jsonElement["players"]!!.jsonArray
        val deckData = jsonElement["deck"]!!.jsonArray
        val fieldCardsData = jsonElement["fieldCards"]!!.jsonObject
        val turnOrder = jsonElement["turnOrder"]!!.jsonArray.map { it.jsonPrimitive.content }
        
        val players = playersData.map { playerElement ->
            val playerMap = playerElement.jsonObject
            val handData = playerMap["hand"]!!.jsonArray
            PlayerState(
                playerId = playerMap["playerId"]!!.jsonPrimitive.content,
                hand = handData.map { cardElement ->
                    val cardMap = cardElement.jsonObject
                    Card(
                        Suit.valueOf(cardMap["suit"]!!.jsonPrimitive.content),
                        cardMap["rank"]!!.jsonPrimitive.int
                    )
                },
                rank = playerMap["rank"]?.jsonPrimitive?.intOrNull
            )
        }
        
        val deck = deckData.map { cardElement ->
            val cardMap = cardElement.jsonObject
            Card(
                Suit.valueOf(cardMap["suit"]!!.jsonPrimitive.content),
                cardMap["rank"]!!.jsonPrimitive.int
            )
        }
        
        val firstFieldData = fieldCardsData["first"]!!.jsonObject
        val secondFieldData = fieldCardsData["second"]!!.jsonObject
        
        val fieldCards = Pair(
            Card(Suit.valueOf(firstFieldData["suit"]!!.jsonPrimitive.content), firstFieldData["rank"]!!.jsonPrimitive.int),
            Card(Suit.valueOf(secondFieldData["suit"]!!.jsonPrimitive.content), secondFieldData["rank"]!!.jsonPrimitive.int)
        )
        
        return GameState(
            gameId = jsonElement["gameId"]!!.jsonPrimitive.content,
            roomId = jsonElement["roomId"]!!.jsonPrimitive.content,
            players = players,
            deck = deck,
            fieldCards = fieldCards,
            currentPlayerIndex = jsonElement["currentPlayerIndex"]!!.jsonPrimitive.int,
            turnOrder = turnOrder,
            status = GameStatus.valueOf(jsonElement["status"]!!.jsonPrimitive.content),
            startedAt = jsonElement["startedAt"]!!.jsonPrimitive.long,
            lastUpdatedAt = jsonElement["lastUpdatedAt"]!!.jsonPrimitive.long
        )
    }

    /**
     * ゲーム結果を取得
     * 
     * @param gameId ゲームID
     * @return Pair<GameState, Map<String, Int>> (GameState, プレイヤーごとのカードプレイ数)
     * @throws IllegalStateException ゲームが終了していない場合
     */
    fun getGameResult(gameId: String): Pair<GameState, Map<String, Int>> {
        return transaction {
            // ゲーム状態を取得
            val gameRow = Games.selectAll().where { Games.gameId eq gameId }
                .singleOrNull()
                ?: throw IllegalArgumentException("Game not found: $gameId")
            
            val gameState = deserializeGameState(gameRow[Games.stateJson])
            
            // ゲームが終了していない場合はエラー
            if (gameState.status != GameStatus.FINISHED && gameState.status != GameStatus.ABORTED) {
                throw IllegalStateException("Game is not finished yet: $gameId (status=${gameState.status})")
            }
            
            // 各プレイヤーのカードプレイ数を取得
            val cardsPlayedMap = mutableMapOf<String, Int>()
            gameState.players.forEach { player ->
                val cardsPlayed = GameActions.selectAll()
                    .where { 
                        (GameActions.gameId eq gameId) and 
                        (GameActions.playerId eq player.playerId) and
                        (GameActions.actionType eq "PLAY")
                    }
                    .count()
                    .toInt()
                cardsPlayedMap[player.playerId] = cardsPlayed
            }
            
            Pair(gameState, cardsPlayedMap)
        }
    }
}