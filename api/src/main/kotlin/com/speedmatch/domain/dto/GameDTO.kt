package com.speedmatch.domain.dto

import com.speedmatch.domain.game.Card
import com.speedmatch.domain.game.GameState
import com.speedmatch.domain.game.PlayerState
import com.speedmatch.domain.game.Suit
import kotlinx.serialization.Serializable

/**
 * ゲーム作成リクエスト
 */
@Serializable
data class CreateGameRequest(
    val roomId: String,
    val playerIds: List<String>
)

/**
 * カードDTO（API用）
 */
@Serializable
data class CardDTO(
    val suit: String, // "SPADES", "HEARTS", "DIAMONDS", "CLUBS"
    val rank: Int // 1-13
) {
    companion object {
        fun fromDomain(card: Card): CardDTO {
            return CardDTO(
                suit = card.suit.name,
                rank = card.rank
            )
        }

        fun toDomain(dto: CardDTO): Card {
            return Card(
                suit = Suit.valueOf(dto.suit),
                rank = dto.rank
            )
        }
    }
}

/**
 * プレイヤー状態DTO（API用）
 */
@Serializable
data class PlayerStateDTO(
    val playerId: String,
    val handSize: Int, // セキュリティのため他プレイヤーには手札内容は見せない
    val hand: List<CardDTO>? = null, // 自分の手札のみ含まれる
    val rank: Int? = null
) {
    companion object {
        fun fromDomain(playerState: PlayerState, includeHand: Boolean = false): PlayerStateDTO {
            return PlayerStateDTO(
                playerId = playerState.playerId,
                handSize = playerState.handSize,
                hand = if (includeHand) playerState.hand.map { CardDTO.fromDomain(it) } else null,
                rank = playerState.rank
            )
        }
    }
}

/**
 * ゲーム状態レスポンス
 */
@Serializable
data class GameStateResponse(
    val gameId: String,
    val roomId: String,
    val players: List<PlayerStateDTO>,
    val fieldCards: Pair<CardDTO, CardDTO>,
    val currentPlayerId: String,
    val currentPlayerIndex: Int,
    val deckRemaining: Int,
    val status: String, // "PLAYING", "FINISHED", "ABORTED"
    val playableCards: List<CardDTO>? = null, // 自分がcurrentPlayerの場合のみ
    val startedAt: Long,
    val lastUpdatedAt: Long
) {
    companion object {
        fun fromDomain(gameState: GameState, requestingPlayerId: String? = null): GameStateResponse {
            val isCurrentPlayer = requestingPlayerId == gameState.currentPlayerId
            
            return GameStateResponse(
                gameId = gameState.gameId,
                roomId = gameState.roomId,
                players = gameState.players.map { player ->
                    PlayerStateDTO.fromDomain(
                        player, 
                        includeHand = player.playerId == requestingPlayerId
                    )
                },
                fieldCards = Pair(
                    CardDTO.fromDomain(gameState.fieldCards.first),
                    CardDTO.fromDomain(gameState.fieldCards.second)
                ),
                currentPlayerId = gameState.currentPlayerId,
                currentPlayerIndex = gameState.currentPlayerIndex,
                deckRemaining = gameState.deckRemaining,
                status = gameState.status.name,
                playableCards = if (isCurrentPlayer) {
                    gameState.getPlayableCards(requestingPlayerId).map { CardDTO.fromDomain(it) }
                } else null,
                startedAt = gameState.startedAt,
                lastUpdatedAt = gameState.lastUpdatedAt
            )
        }
    }
}

/**
 * カードプレイリクエスト
 */
@Serializable
data class PlayCardRequest(
    val playerId: String,
    val card: CardDTO,
    val targetField: Int // 0 or 1
)

/**
 * カードドローリクエスト
 */
@Serializable
data class DrawCardRequest(
    val playerId: String
)

/**
 * ターンスキップリクエスト
 */
@Serializable
data class SkipTurnRequest(
    val playerId: String
)

/**
 * ゲームアクションレスポンス
 */
@Serializable
data class GameActionResponse(
    val success: Boolean,
    val message: String,
    val gameState: GameStateResponse? = null
)

/**
 * ゲーム作成レスポンス
 */
@Serializable
data class CreateGameResponse(
    val gameId: String,
    val roomId: String,
    val status: String,
    val message: String
)