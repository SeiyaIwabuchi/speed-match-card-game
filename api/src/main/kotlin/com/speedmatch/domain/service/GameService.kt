package com.speedmatch.domain.service

import com.speedmatch.domain.dto.*
import com.speedmatch.infrastructure.database.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

class GameService {

    /**
     * ゲーム状態を取得（ポーリング用）
     */
    fun getGameState(gameId: String): GameStateResponse {
        return transaction {
            val game = Games.selectAll().where { Games.gameId eq gameId }
                .singleOrNull() ?: throw NotFoundException("GAME_NOT_FOUND", "ゲームが見つかりません")

            val players = getGamePlayers(gameId)
            val fieldCards = getFieldCards(gameId)

            GameStateResponse(
                gameId = game[Games.gameId],
                roomId = game[Games.roomId],
                status = game[Games.status],
                currentTurn = game[Games.turnNumber],
                currentPlayerId = game[Games.currentTurnPlayerId] ?: "",
                players = players,
                fieldCards = fieldCards,
                updatedAt = game[Games.startedAt].toString() // TODO: Phase 13でupdated_atカラムが追加されたら変更
            )
        }
    }

    /**
     * ゲームのプレイヤー情報を取得
     */
    private fun getGamePlayers(gameId: String): List<GamePlayerInfo> {
        return GamePlayers
            .innerJoin(Players, { GamePlayers.playerId }, { Players.playerId })
            .select(
                GamePlayers.playerId,
                Players.username,
                Players.avatar,
                GamePlayers.handSize,
                GamePlayers.playerOrder
            )
            .where { GamePlayers.gameId eq gameId }
            .orderBy(GamePlayers.playerOrder)
            .map { row ->
                val playerId = row[GamePlayers.playerId]
                val currentTurnPlayerId = Games.select(Games.currentTurnPlayerId)
                    .where { Games.gameId eq gameId }
                    .singleOrNull()?.get(Games.currentTurnPlayerId)

                GamePlayerInfo(
                    playerId = playerId,
                    username = row[Players.username],
                    avatar = row[Players.avatar],
                    handCount = row[GamePlayers.handSize],
                    isCurrentTurn = playerId == currentTurnPlayerId
                )
            }
    }

    /**
     * 場のカードを取得
     */
    private fun getFieldCards(gameId: String): List<String> {
        val fieldCardValue = Games.select(Games.fieldCardValue)
            .where { Games.gameId eq gameId }
            .singleOrNull()?.get(Games.fieldCardValue)

        // Phase 11では場のカードは1枚のみ対応
        // Phase 13で複数カード対応になる可能性あり
        return if (fieldCardValue != null) {
            listOf("card_$fieldCardValue") // カードID形式に変換
        } else {
            emptyList()
        }
    }
}