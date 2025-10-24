package com.speedmatch.domain.dto

import kotlinx.serialization.Serializable

/**
 * Game state response DTO (for polling)
 */
@Serializable
data class GameStateResponse(
    val gameId: String,
    val roomId: String,
    val status: String,
    val currentTurn: Int,
    val currentPlayerId: String,
    val players: List<GamePlayerInfo>,
    val fieldCards: List<String>, // 場札のカードIDリスト
    val updatedAt: String
)

/**
 * Game player info DTO
 */
@Serializable
data class GamePlayerInfo(
    val playerId: String,
    val username: String,
    val avatar: String,
    val handCount: Int, // 手札枚数（セキュリティのため実際の手札は非公開）
    val isCurrentTurn: Boolean
)