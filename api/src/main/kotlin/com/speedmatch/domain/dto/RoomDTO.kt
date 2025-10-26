package com.speedmatch.domain.dto

import kotlinx.serialization.Serializable

/**
 * Room creation request DTO
 */
@Serializable
data class RoomCreateRequest(
    val hostId: String,
    val roomName: String? = null,
    val maxPlayers: Int = 4,
    val initialHandSize: Int = 7,
    val turnTimeLimit: Int = 60,
    val isPublic: Boolean = true
)

/**
 * Room join request DTO
 */
@Serializable
data class RoomJoinRequest(
    val playerId: String
)

/**
 * Room leave request DTO
 */
@Serializable
data class RoomLeaveRequest(
    val playerId: String
)

/**
 * Room ready request DTO
 */
@Serializable
data class RoomReadyRequest(
    val playerId: String,
    val isReady: Boolean
)

/**
 * Room start request DTO
 */
@Serializable
data class RoomStartRequest(
    val hostId: String
)

/**
 * Room player info DTO
 */
@Serializable
data class RoomPlayerInfo(
    val playerId: String,
    val username: String,
    val avatar: String,
    val isReady: Boolean,
    val isHost: Boolean
)

/**
 * Room response DTO
 */
@Serializable
data class RoomResponse(
    val roomId: String,
    val roomCode: String,
    val roomName: String?,
    val hostId: String,
    val maxPlayers: Int,
    val currentPlayers: Int,
    val initialHandSize: Int,
    val turnTimeLimit: Int,
    val isPublic: Boolean,
    val status: String,
    val players: List<RoomPlayerInfo>,
    val gameId: String? = null, // ゲーム開始時のみ設定
    val createdAt: String
)

/**
 * Room list item DTO (for room listing)
 */
@Serializable
data class RoomListItem(
    val roomId: String,
    val roomCode: String,
    val roomName: String?,
    val hostUsername: String,
    val currentPlayers: Int,
    val maxPlayers: Int,
    val initialHandSize: Int,
    val turnTimeLimit: Int,
    val status: String,
    val createdAt: String
)

/**
 * Room list response DTO
 */
@Serializable
data class RoomListResponse(
    val rooms: List<RoomListItem>,
    val pagination: PaginationInfo
)

/**
 * Room code lookup response DTO
 */
@Serializable
data class RoomCodeResponse(
    val roomId: String,
    val roomCode: String,
    val roomName: String?,
    val currentPlayers: Int,
    val maxPlayers: Int,
    val status: String
)

/**
 * Room join response DTO
 */
@Serializable
data class RoomJoinResponse(
    val roomId: String,
    val playerId: String,
    val joinedAt: String
)

/**
 * Room leave response DTO
 */
@Serializable
data class RoomLeaveResponse(
    val roomId: String,
    val playerId: String,
    val leftAt: String
)

/**
 * Room ready response DTO
 */
@Serializable
data class RoomReadyResponse(
    val playerId: String,
    val isReady: Boolean
)

/**
 * Room start response DTO
 */
@Serializable
data class RoomStartResponse(
    val roomId: String,
    val gameId: String,
    val status: String,
    val startedAt: String
)

/**
 * Pagination info DTO
 */
@Serializable
data class PaginationInfo(
    val page: Int,
    val limit: Int,
    val total: Int,
    val totalPages: Int
)

/**
 * Room state response DTO (for polling)
 */
@Serializable
data class RoomStateResponse(
    val roomId: String,
    val roomCode: String,
    val roomName: String?,
    val status: String,
    val players: List<RoomPlayerInfo>,
    val updatedAt: String
)

/**
 * Chat message send request DTO
 */
@Serializable
data class ChatMessageRequest(
    val playerId: String,
    val message: String,
    val type: String = "text" // "text" | "emoji" | "preset"
)

/**
 * Chat message response DTO
 */
@Serializable
data class ChatMessageResponse(
    val messageId: String,
    val roomId: String,
    val playerId: String,
    val username: String,
    val avatar: String,
    val message: String,
    val type: String,
    val createdAt: String
)

/**
 * Chat messages list response DTO
 */
@Serializable
data class ChatMessagesResponse(
    val messages: List<ChatMessageResponse>,
    val hasMore: Boolean
)