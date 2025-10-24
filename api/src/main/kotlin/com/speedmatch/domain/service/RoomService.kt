package com.speedmatch.domain.service

import com.speedmatch.domain.dto.*
import com.speedmatch.infrastructure.database.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.*

class RoomService {

    /**
     * 新規ルームを作成
     */
    fun create(request: RoomCreateRequest, hostId: String): RoomResponse {
        validateCreateRequest(request)

        return transaction {
            // ホストプレイヤーが存在するかチェック
            val hostExists = Players.selectAll().where { Players.playerId eq hostId }
                .singleOrNull() ?: throw NotFoundException("PLAYER_NOT_FOUND", "ホストプレイヤーが見つかりません")

            val now = Instant.now()
            val roomId = "rm_${UUID.randomUUID().toString().replace("-", "").substring(0, 16)}"
            val roomCode = generateUniqueRoomCode()

            // ルームを作成
            Rooms.insert {
                it[Rooms.roomId] = roomId
                it[Rooms.roomCode] = roomCode
                it[Rooms.roomName] = request.roomName
                it[Rooms.hostId] = hostId
                it[Rooms.maxPlayers] = request.maxPlayers
                it[Rooms.currentPlayers] = 1
                it[Rooms.initialHandSize] = request.initialHandSize
                it[Rooms.turnTimeLimit] = request.turnTimeLimit
                it[Rooms.isPublic] = request.isPublic
                it[Rooms.status] = "waiting"
                it[Rooms.createdAt] = now
                it[Rooms.updatedAt] = now
            }

            // ホストをルームプレイヤーとして追加
            RoomPlayers.insert {
                it[RoomPlayers.roomId] = roomId
                it[RoomPlayers.playerId] = hostId
                it[RoomPlayers.isReady] = false
                it[RoomPlayers.isHost] = true
                it[RoomPlayers.joinOrder] = 1
                it[RoomPlayers.joinedAt] = now
            }

            // レスポンスを作成
            val players = getRoomPlayers(roomId)
            RoomResponse(
                roomId = roomId,
                roomCode = roomCode,
                roomName = request.roomName,
                hostId = hostId,
                maxPlayers = request.maxPlayers,
                currentPlayers = 1,
                initialHandSize = request.initialHandSize,
                turnTimeLimit = request.turnTimeLimit,
                isPublic = request.isPublic,
                status = "waiting",
                players = players,
                createdAt = now.toString()
            )
        }
    }

    /**
     * ルーム一覧を取得
     */
    fun findRooms(status: String? = "waiting", maxPlayers: Int? = null, page: Int = 1, limit: Int = 20): RoomListResponse {
        return transaction {
            val query = Rooms.selectAll()
                .where {
                    (Rooms.isPublic eq true) and
                    (status?.let { Rooms.status eq it } ?: Op.TRUE) and
                    (maxPlayers?.let { Rooms.maxPlayers eq it } ?: Op.TRUE)
                }
                .orderBy(Rooms.createdAt, SortOrder.DESC)

            val total = query.count()
            val totalPages = ((total - 1) / limit + 1).toInt()

            val rooms = query
                .limit(limit, ((page - 1) * limit).toLong())
                .map { room ->
                    val hostUsername = Players.select(Players.username)
                        .where { Players.playerId eq room[Rooms.hostId] }
                        .singleOrNull()?.get(Players.username) ?: "Unknown"

                    RoomListItem(
                        roomId = room[Rooms.roomId],
                        roomCode = room[Rooms.roomCode],
                        roomName = room[Rooms.roomName],
                        hostUsername = hostUsername,
                        currentPlayers = room[Rooms.currentPlayers],
                        maxPlayers = room[Rooms.maxPlayers],
                        initialHandSize = room[Rooms.initialHandSize],
                        turnTimeLimit = room[Rooms.turnTimeLimit],
                        status = room[Rooms.status],
                        createdAt = room[Rooms.createdAt].toString()
                    )
                }

            RoomListResponse(
                rooms = rooms,
                pagination = PaginationInfo(
                    page = page,
                    limit = limit,
                    total = total.toInt(),
                    totalPages = totalPages
                )
            )
        }
    }

    /**
     * ルームIDでルーム詳細を取得
     */
    fun findById(roomId: String): RoomResponse {
        return transaction {
            val room = Rooms.selectAll().where { Rooms.roomId eq roomId }
                .singleOrNull() ?: throw NotFoundException("ROOM_NOT_FOUND", "ルームが見つかりません")

            val players = getRoomPlayers(roomId)

            RoomResponse(
                roomId = room[Rooms.roomId],
                roomCode = room[Rooms.roomCode],
                roomName = room[Rooms.roomName],
                hostId = room[Rooms.hostId],
                maxPlayers = room[Rooms.maxPlayers],
                currentPlayers = room[Rooms.currentPlayers],
                initialHandSize = room[Rooms.initialHandSize],
                turnTimeLimit = room[Rooms.turnTimeLimit],
                isPublic = room[Rooms.isPublic],
                status = room[Rooms.status],
                players = players,
                createdAt = room[Rooms.createdAt].toString()
            )
        }
    }

    /**
     * ルームコードでルーム情報を取得
     */
    fun findByCode(roomCode: String): RoomCodeResponse {
        return transaction {
            val room = Rooms.selectAll().where { Rooms.roomCode eq roomCode }
                .singleOrNull() ?: throw NotFoundException("ROOM_NOT_FOUND", "ルームコードが無効です")

            RoomCodeResponse(
                roomId = room[Rooms.roomId],
                roomCode = room[Rooms.roomCode],
                roomName = room[Rooms.roomName],
                currentPlayers = room[Rooms.currentPlayers],
                maxPlayers = room[Rooms.maxPlayers],
                status = room[Rooms.status]
            )
        }
    }

    /**
     * ルームに参加
     */
    fun join(roomId: String, playerId: String): RoomJoinResponse {
        return transaction {
            // ルームが存在するかチェック
            val room = Rooms.selectAll().where { Rooms.roomId eq roomId }
                .singleOrNull() ?: throw NotFoundException("ROOM_NOT_FOUND", "ルームが見つかりません")

            // プレイヤーが存在するかチェック
            val playerExists = Players.selectAll().where { Players.playerId eq playerId }
                .singleOrNull() ?: throw NotFoundException("PLAYER_NOT_FOUND", "プレイヤーが見つかりません")

            // ルームが満員でないかチェック
            if (room[Rooms.currentPlayers] >= room[Rooms.maxPlayers]) {
                throw ValidationException("ROOM_FULL", "ルームが満員です")
            }

            // ゲームが開始済みでないかチェック
            if (room[Rooms.status] != "waiting") {
                throw ValidationException("GAME_STARTED", "ゲームが既に開始されています")
            }

            // 既に参加していないかチェック
            val existingJoin = RoomPlayers.selectAll()
                .where { (RoomPlayers.roomId eq roomId) and (RoomPlayers.playerId eq playerId) and RoomPlayers.leftAt.isNull() }
                .singleOrNull()

            if (existingJoin != null) {
                throw ValidationException("ALREADY_JOINED", "既にこのルームに参加しています")
            }

            val now = Instant.now()
            val joinOrder = RoomPlayers.select(RoomPlayers.joinOrder)
                .where { RoomPlayers.roomId eq roomId }
                .map { it[RoomPlayers.joinOrder] }
                .maxOrNull()?.plus(1) ?: 1

            // ルームプレイヤーに追加
            RoomPlayers.insert {
                it[RoomPlayers.roomId] = roomId
                it[RoomPlayers.playerId] = playerId
                it[isReady] = false
                it[isHost] = false
                it[RoomPlayers.joinOrder] = joinOrder
                it[joinedAt] = now
            }

            // ルームの現在のプレイヤー数を更新
            val newCurrentPlayers = room[Rooms.currentPlayers] + 1
            Rooms.update({ Rooms.roomId eq roomId }) {
                it[currentPlayers] = newCurrentPlayers
                it[updatedAt] = java.time.Instant.now()
            }

            RoomJoinResponse(
                roomId = roomId,
                playerId = playerId,
                joinedAt = now.toString()
            )
        }
    }

    /**
     * ルームから退出
     */
    fun leave(roomId: String, playerId: String): RoomLeaveResponse {
        return transaction {
            // ルームが存在するかチェック
            val room = Rooms.selectAll().where { Rooms.roomId eq roomId }
                .singleOrNull() ?: throw NotFoundException("ROOM_NOT_FOUND", "ルームが見つかりません")

            // 参加情報を取得
            val roomPlayer = RoomPlayers.selectAll()
                .where { (RoomPlayers.roomId eq roomId) and (RoomPlayers.playerId eq playerId) and RoomPlayers.leftAt.isNull() }
                .singleOrNull() ?: throw ValidationException("NOT_JOINED", "このルームに参加していません")

            val now = Instant.now()

            // 退出時間を設定
            RoomPlayers.update({ (RoomPlayers.roomId eq roomId) and (RoomPlayers.playerId eq playerId) }) {
                it[leftAt] = now
            }

            // ルームの現在のプレイヤー数を更新
            val newCurrentPlayers = room[Rooms.currentPlayers] - 1
            Rooms.update({ Rooms.roomId eq roomId }) {
                it[currentPlayers] = newCurrentPlayers
                it[updatedAt] = java.time.Instant.now()
            }

            // ホストが退出した場合、新しいホストを決定
            if (roomPlayer[RoomPlayers.isHost] && newCurrentPlayers > 0) {
                val newHost = RoomPlayers.selectAll()
                    .where { (RoomPlayers.roomId eq roomId) and RoomPlayers.leftAt.isNull() }
                    .orderBy(RoomPlayers.joinedAt)
                    .firstOrNull()

                if (newHost != null) {
                    RoomPlayers.update({ (RoomPlayers.roomId eq roomId) and (RoomPlayers.playerId eq newHost[RoomPlayers.playerId]) }) {
                        it[isHost] = true
                    }
                    Rooms.update({ Rooms.roomId eq roomId }) {
                        it[hostId] = newHost[RoomPlayers.playerId]
                    }
                }
            }

            RoomLeaveResponse(
                roomId = roomId,
                playerId = playerId,
                leftAt = now.toString()
            )
        }
    }

    /**
     * 準備完了状態を更新
     */
    fun setReady(roomId: String, playerId: String, isReady: Boolean): RoomReadyResponse {
        transaction {
            // ルームが存在するかチェック
            Rooms.selectAll().where { Rooms.roomId eq roomId }
                .singleOrNull() ?: throw NotFoundException("ROOM_NOT_FOUND", "ルームが見つかりません")

            // 参加情報を取得
            RoomPlayers.selectAll()
                .where { (RoomPlayers.roomId eq roomId) and (RoomPlayers.playerId eq playerId) and RoomPlayers.leftAt.isNull() }
                .singleOrNull() ?: throw ValidationException("NOT_JOINED", "このルームに参加していません")

            // 準備状態を更新
            RoomPlayers.update({ (RoomPlayers.roomId eq roomId) and (RoomPlayers.playerId eq playerId) }) {
                it[RoomPlayers.isReady] = isReady
            }

            Rooms.update({ Rooms.roomId eq roomId }) {
                it[updatedAt] = java.time.Instant.now()
            }
        }

        return RoomReadyResponse(
            playerId = playerId,
            isReady = isReady
        )
    }

    /**
     * ゲームを開始
     */
    fun startGame(roomId: String, hostId: String): RoomStartResponse {
        return transaction {
            // ルームが存在するかチェック
            val room = Rooms.selectAll().where { Rooms.roomId eq roomId }
                .singleOrNull() ?: throw NotFoundException("ROOM_NOT_FOUND", "ルームが見つかりません")

            // ホストかどうかチェック
            if (room[Rooms.hostId] != hostId) {
                throw ValidationException("NOT_HOST", "ホストのみゲームを開始できます")
            }

            // 全員準備完了かチェック
            val totalPlayers = RoomPlayers.selectAll()
                .where { (RoomPlayers.roomId eq roomId) and RoomPlayers.leftAt.isNull() }
                .count()

            val readyPlayers = RoomPlayers.selectAll()
                .where { (RoomPlayers.roomId eq roomId) and RoomPlayers.leftAt.isNull() and (RoomPlayers.isReady eq true) }
                .count()

            if (totalPlayers != readyPlayers) {
                throw ValidationException("NOT_ALL_READY", "全員が準備完了になるまで待ってください")
            }

            // 最低人数チェック
            if (totalPlayers < 2) {
                throw ValidationException("NOT_ENOUGH_PLAYERS", "最低2人必要です")
            }

            val now = Instant.now()
            val gameId = "gm_${UUID.randomUUID().toString().replace("-", "").substring(0, 16)}"

            // ルームのステータスを更新
            Rooms.update({ Rooms.roomId eq roomId }) {
                it[status] = "playing"
                it[startedAt] = now
                it[updatedAt] = java.time.Instant.now()
            }

            // ゲームを作成
            Games.insert {
                it[Games.gameId] = gameId
                it[Games.roomId] = roomId
                it[Games.status] = "playing"
                it[Games.startedAt] = now
            }

            RoomStartResponse(
                roomId = roomId,
                gameId = gameId,
                status = "playing",
                startedAt = now.toString()
            )
        }
    }

    /**
     * ルームのプレイヤー情報を取得
     */
    private fun getRoomPlayers(roomId: String): List<RoomPlayerInfo> {
        return RoomPlayers
            .innerJoin(Players, { RoomPlayers.playerId }, { Players.playerId })
            .select(
                RoomPlayers.playerId,
                Players.username,
                Players.avatar,
                RoomPlayers.isReady,
                RoomPlayers.isHost
            )
            .where { (RoomPlayers.roomId eq roomId) and RoomPlayers.leftAt.isNull() }
            .orderBy(RoomPlayers.joinOrder)
            .map { row ->
                RoomPlayerInfo(
                    playerId = row[RoomPlayers.playerId],
                    username = row[Players.username],
                    avatar = row[Players.avatar],
                    isReady = row[RoomPlayers.isReady],
                    isHost = row[RoomPlayers.isHost]
                )
            }
    }

    /**
     * ユニークなルームコードを生成
     */
    private fun generateUniqueRoomCode(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        var code: String
        do {
            code = (1..6).map { chars.random() }.joinToString("")
        } while (Rooms.selectAll().where { Rooms.roomCode eq code }.singleOrNull() != null)
        return code
    }

    /**
     * 作成リクエストのバリデーション
     */
    private fun validateCreateRequest(request: RoomCreateRequest) {
        if (request.roomName != null && request.roomName.length > 30) {
            throw ValidationException("INVALID_ROOM_NAME", "ルーム名は30文字以内である必要があります")
        }

        if (request.maxPlayers !in 2..4) {
            throw ValidationException("INVALID_MAX_PLAYERS", "最大プレイヤー数は2-4人である必要があります")
        }

        if (request.initialHandSize !in 5..10) {
            throw ValidationException("INVALID_HAND_SIZE", "初期手札枚数は5-10枚である必要があります")
        }

        if (request.turnTimeLimit != 0 && request.turnTimeLimit != 30 && request.turnTimeLimit != 60) {
            throw ValidationException("INVALID_TIME_LIMIT", "ターン時間制限は0（なし）、30秒、または60秒である必要があります")
        }
    }

    /**
     * ルーム状態を取得（ポーリング用）
     */
    fun getRoomState(roomCode: String): RoomStateResponse {
        return transaction {
            val room = Rooms.selectAll().where { Rooms.roomCode eq roomCode }
                .singleOrNull() ?: throw NotFoundException("ROOM_NOT_FOUND", "ルームが見つかりません")

            val players = getRoomPlayers(room[Rooms.roomId])

            RoomStateResponse(
                roomId = room[Rooms.roomId],
                roomCode = room[Rooms.roomCode],
                roomName = room[Rooms.roomName],
                status = room[Rooms.status],
                players = players,
                updatedAt = room[Rooms.updatedAt].toString()
            )
        }
    }
}