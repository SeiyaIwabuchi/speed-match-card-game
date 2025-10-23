package com.speedmatch.domain.service

import com.speedmatch.domain.dto.*
import com.speedmatch.infrastructure.database.Players
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.time.format.DateTimeFormatter

class PlayerService {

    /**
     * 新規プレイヤーを作成
     */
    fun create(request: PlayerCreateRequest): PlayerResponse {
        validateCreateRequest(request)

        return transaction {
            // ユーザー名の重複チェック
            val existingPlayer = Players.selectAll().where { Players.username eq request.username }
                .singleOrNull()

            if (existingPlayer != null) {
                throw ValidationException("USERNAME_EXISTS", "このユーザー名は既に使用されています")
            }

            // 新しいプレイヤーIDを生成
            val playerId = "pl_${java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16)}"

            val now = Instant.now()

            // プレイヤーを挿入
            Players.insert {
                it[Players.playerId] = playerId
                it[username] = request.username
                it[avatar] = request.avatar
                it[totalGames] = 0
                it[totalWins] = 0
                it[totalLosses] = 0
                it[totalCardsPlayed] = 0
                it[createdAt] = now
                it[updatedAt] = now
            }

            // レスポンスを作成
            val stats = PlayerStats(
                totalGames = 0,
                wins = 0,
                losses = 0,
                winRate = 0.0,
                fastestWin = null,
                totalCardsPlayed = 0
            )

            PlayerResponse(
                playerId = playerId,
                username = request.username,
                avatar = request.avatar,
                stats = stats,
                createdAt = now.toString()
            )
        }
    }

    /**
     * プレイヤーIDでプレイヤー情報を取得
     */
    fun findById(playerId: String): PlayerResponse {
        return transaction {
            val player = Players.selectAll().where { Players.playerId eq playerId }
                .singleOrNull()
                ?: throw NotFoundException("PLAYER_NOT_FOUND", "プレイヤーが見つかりません")

            val stats = PlayerStats(
                totalGames = player[Players.totalGames],
                wins = player[Players.totalWins],
                losses = player[Players.totalLosses],
                winRate = if (player[Players.totalGames] > 0) {
                    player[Players.totalWins].toDouble() / player[Players.totalGames]
                } else 0.0,
                fastestWin = player[Players.fastestWin],
                totalCardsPlayed = player[Players.totalCardsPlayed]
            )

            PlayerResponse(
                playerId = player[Players.playerId],
                username = player[Players.username],
                avatar = player[Players.avatar],
                stats = stats,
                createdAt = player[Players.createdAt].toString()
            )
        }
    }

    /**
     * プレイヤー情報を更新
     */
    fun update(playerId: String, request: PlayerUpdateRequest): PlayerResponse {
        validateUpdateRequest(request)

        return transaction {
            // プレイヤーが存在するかチェック
            val existingPlayer = Players.selectAll().where { Players.playerId eq playerId }
                .singleOrNull()
                ?: throw NotFoundException("PLAYER_NOT_FOUND", "プレイヤーが見つかりません")

            // ユーザー名の重複チェック（変更する場合）
            if (request.username != null && request.username != existingPlayer[Players.username]) {
                val duplicatePlayer = Players.selectAll().where {
                    (Players.username eq request.username!!) and (Players.playerId neq playerId)
                }.singleOrNull()

                if (duplicatePlayer != null) {
                    throw ValidationException("USERNAME_EXISTS", "このユーザー名は既に使用されています")
                }
            }

            // 更新
            val now = Instant.now()
            Players.update({ Players.playerId eq playerId }) {
                if (request.username != null) it[username] = request.username!!
                if (request.avatar != null) it[avatar] = request.avatar!!
                it[updatedAt] = now
            }

            // 更新後のデータを取得
            findById(playerId)
        }
    }

    /**
     * プレイヤーの統計情報を取得
     */
    fun getStats(playerId: String): PlayerStatsResponse {
        return transaction {
            val player = Players.selectAll().where { Players.playerId eq playerId }
                .singleOrNull()
                ?: throw NotFoundException("PLAYER_NOT_FOUND", "プレイヤーが見つかりません")

            val stats = PlayerStats(
                totalGames = player[Players.totalGames],
                wins = player[Players.totalWins],
                losses = player[Players.totalLosses],
                winRate = if (player[Players.totalGames] > 0) {
                    player[Players.totalWins].toDouble() / player[Players.totalGames]
                } else 0.0,
                fastestWin = player[Players.fastestWin],
                totalCardsPlayed = player[Players.totalCardsPlayed]
            )

            PlayerStatsResponse(
                playerId = playerId,
                stats = stats
            )
        }
    }

    /**
     * 作成リクエストのバリデーション
     */
    private fun validateCreateRequest(request: PlayerCreateRequest) {
        // ユーザー名バリデーション
        if (request.username.length !in 3..12) {
            throw ValidationException("INVALID_USERNAME", "ユーザー名は3-12文字である必要があります")
        }

        if (!request.username.matches(Regex("^[a-zA-Z0-9_]+$"))) {
            throw ValidationException("INVALID_USERNAME", "ユーザー名は英数字とアンダースコアのみ使用できます")
        }

        // アバターバリデーション
        if (request.avatar.length != 1) {
            throw ValidationException("INVALID_AVATAR", "アバターは1文字である必要があります")
        }

        // 絵文字または英字チェック
        val isEmoji = request.avatar.matches(Regex("[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+"))
        val isLetter = request.avatar.matches(Regex("[a-zA-Z]"))

        if (!isEmoji && !isLetter) {
            throw ValidationException("INVALID_AVATAR", "アバターは絵文字または英字1文字である必要があります")
        }
    }

    /**
     * 更新リクエストのバリデーション
     */
    private fun validateUpdateRequest(request: PlayerUpdateRequest) {
        // ユーザー名バリデーション（指定されている場合）
        if (request.username != null) {
            if (request.username.length !in 3..12) {
                throw ValidationException("INVALID_USERNAME", "ユーザー名は3-12文字である必要があります")
            }

            if (!request.username.matches(Regex("^[a-zA-Z0-9_]+$"))) {
                throw ValidationException("INVALID_USERNAME", "ユーザー名は英数字とアンダースコアのみ使用できます")
            }
        }

        // アバターバリデーション（指定されている場合）
        if (request.avatar != null) {
            if (request.avatar.length != 1) {
                throw ValidationException("INVALID_AVATAR", "アバターは1文字である必要があります")
            }

            // 絵文字または英字チェック
            val isEmoji = request.avatar.matches(Regex("[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+"))
            val isLetter = request.avatar.matches(Regex("[a-zA-Z]"))

            if (!isEmoji && !isLetter) {
                throw ValidationException("INVALID_AVATAR", "アバターは絵文字または英字1文字である必要があります")
            }
        }

        // 少なくとも1つのフィールドが指定されているかチェック
        if (request.username == null && request.avatar == null) {
            throw ValidationException("NO_FIELDS_TO_UPDATE", "更新するフィールドを指定してください")
        }
    }
}

/**
 * カスタム例外クラス
 */
class ValidationException(val code: String, message: String) : Exception(message)
class NotFoundException(val code: String, message: String) : Exception(message)