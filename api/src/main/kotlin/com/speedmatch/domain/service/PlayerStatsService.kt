package com.speedmatch.domain.service

import com.speedmatch.infrastructure.database.GameActions
import com.speedmatch.infrastructure.database.Games
import com.speedmatch.infrastructure.database.Players
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory

/**
 * プレイヤー統計サービス
 * ゲーム終了時にプレイヤーの統計情報を更新する
 */
class PlayerStatsService {
    private val logger = LoggerFactory.getLogger(PlayerStatsService::class.java)

    /**
     * ゲーム終了時にプレイヤー統計を更新
     * @param gameId ゲームID
     * @param ranking プレイヤーランキング（順位順）
     * @param playTimeSeconds ゲームプレイ時間（秒）
     */
    fun updateGameStats(gameId: String, ranking: List<Pair<String, Int>>, playTimeSeconds: Long) {
        transaction {
            ranking.forEachIndexed { index, (playerId, _) ->
                val isWinner = index == 0 // 1位が勝者
                
                // 現在の統計を取得
                val currentStats = Players.selectAll()
                    .where { Players.playerId eq playerId }
                    .singleOrNull()
                
                if (currentStats == null) {
                    logger.warn("Player not found: $playerId")
                    return@forEachIndexed
                }
                
                val currentTotalGames = currentStats[Players.totalGames]
                val currentTotalWins = currentStats[Players.totalWins]
                val currentTotalLosses = currentStats[Players.totalLosses]
                val currentFastestWin = currentStats[Players.fastestWin]
                val currentTotalCardsPlayed = currentStats[Players.totalCardsPlayed]
                
                // このゲームでプレイしたカード枚数を計算
                val cardsPlayed = GameActions.selectAll()
                    .where { 
                        (GameActions.gameId eq gameId) and 
                        (GameActions.playerId eq playerId) and
                        (GameActions.actionType eq "PLAY")
                    }
                    .count()
                    .toInt()
                
                // 統計を更新
                val newTotalGames = currentTotalGames + 1
                val newTotalWins = if (isWinner) currentTotalWins + 1 else currentTotalWins
                val newTotalLosses = if (!isWinner) currentTotalLosses + 1 else currentTotalLosses
                val newTotalCardsPlayed = currentTotalCardsPlayed + cardsPlayed
                
                // 最速記録の更新（勝者の場合のみ）
                val newFastestWin = if (isWinner) {
                    if (currentFastestWin == null || playTimeSeconds < currentFastestWin) {
                        playTimeSeconds.toInt()
                    } else {
                        currentFastestWin
                    }
                } else {
                    currentFastestWin
                }
                
                // データベース更新
                Players.update({ Players.playerId eq playerId }) {
                    it[totalGames] = newTotalGames
                    it[totalWins] = newTotalWins
                    it[totalLosses] = newTotalLosses
                    it[totalCardsPlayed] = newTotalCardsPlayed
                    it[fastestWin] = newFastestWin
                }
                
                logger.info(
                    "Updated stats for player $playerId: " +
                    "games=$newTotalGames, wins=$newTotalWins, losses=$newTotalLosses, " +
                    "cardsPlayed=$newTotalCardsPlayed, fastestWin=$newFastestWin"
                )
            }
        }
    }
}
