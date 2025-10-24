package com.speedmatch.domain.dto

import kotlinx.serialization.Serializable

@Serializable
data class PlayerCreateRequest(
    val username: String,
    val avatar: String
)

@Serializable
data class PlayerUpdateRequest(
    val username: String? = null,
    val avatar: String? = null
)

@Serializable
data class PlayerResponse(
    val playerId: String,
    val username: String,
    val avatar: String,
    val stats: PlayerStats,
    val createdAt: String
)

@Serializable
data class PlayerStats(
    val totalGames: Int,
    val wins: Int,
    val losses: Int,
    val winRate: Double,
    val fastestWin: Int?,
    val totalCardsPlayed: Int
)

@Serializable
data class PlayerStatsResponse(
    val playerId: String,
    val stats: PlayerStats
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

@Serializable
data class ApiErrorResponse(
    val success: Boolean = false,
    val error: ErrorDetails
)

@Serializable
data class ErrorDetails(
    val code: String,
    val message: String,
    val details: Map<String, String>? = null
)