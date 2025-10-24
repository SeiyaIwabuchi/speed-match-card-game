package com.speedmatch.presentation.routes

import com.speedmatch.domain.dto.*
import com.speedmatch.domain.service.RoomService
import com.speedmatch.domain.service.ValidationException
import com.speedmatch.domain.service.NotFoundException
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("RoomRoutes")

fun Route.roomRoutes() {
    val roomService = RoomService()

    route("/rooms") {
        /**
         * POST /rooms - ルーム作成
         */
        post {
            try {
                logger.info("ルーム作成リクエスト受信")

                val request = call.receive<RoomCreateRequest>()
                logger.debug("リクエストデータ: roomName=${request.roomName}, maxPlayers=${request.maxPlayers}")

                // TODO: 認証からホストIDを取得（暫定で固定値）
                val hostId = "pl_test_001" // 実際はJWTから取得

                val response = roomService.create(request, hostId)

                call.respond(
                    HttpStatusCode.Created,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "ルームが正常に作成されました"
                    )
                )

                logger.info("ルーム作成成功: roomId=${response.roomId}, roomCode=${response.roomCode}")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ルーム作成エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * GET /rooms - ルーム一覧取得
         */
        get {
            try {
                val status = call.request.queryParameters["status"]
                val maxPlayers = call.request.queryParameters["maxPlayers"]?.toIntOrNull()
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20

                logger.info("ルーム一覧取得リクエスト: status=$status, maxPlayers=$maxPlayers, page=$page, limit=$limit")

                val response = roomService.findRooms(status, maxPlayers, page, limit)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("ルーム一覧取得成功: ${response.rooms.size}件")

            } catch (e: Exception) {
                logger.error("ルーム一覧取得エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * GET /rooms/{roomId} - ルーム詳細取得
         */
        get("/{roomId}") {
            try {
                val roomId = call.parameters["roomId"]
                    ?: throw ValidationException("MISSING_ROOM_ID", "ルームIDが指定されていません")
                val safeRoomId = roomId!!

                logger.info("ルーム詳細取得リクエスト: roomId=$safeRoomId")

                val response = roomService.findById(safeRoomId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("ルーム詳細取得成功: roomId=$safeRoomId")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("ルーム見つからない: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ルーム詳細取得エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * POST /rooms/{roomId}/join - ルーム参加
         */
        post("/{roomId}/join") {
            try {
                val roomId = call.parameters["roomId"]
                    ?: throw ValidationException("MISSING_ROOM_ID", "ルームIDが指定されていません")
                val safeRoomId = roomId!!

                logger.info("ルーム参加リクエスト: roomId=$safeRoomId")

                val request = call.receive<RoomJoinRequest>()
                logger.debug("参加リクエスト: playerId=${request.playerId}")

                val response = roomService.join(safeRoomId, request.playerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "ルームに参加しました"
                    )
                )

                logger.info("ルーム参加成功: roomId=$safeRoomId, playerId=${request.playerId}")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("ルームまたはプレイヤー見つからない: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ルーム参加エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * POST /rooms/{roomId}/leave - ルーム退出
         */
        post("/{roomId}/leave") {
            try {
                val roomId = call.parameters["roomId"]
                    ?: throw ValidationException("MISSING_ROOM_ID", "ルームIDが指定されていません")
                val safeRoomId = roomId!!

                logger.info("ルーム退出リクエスト: roomId=$safeRoomId")

                val request = call.receive<RoomLeaveRequest>()
                logger.debug("退出リクエスト: playerId=${request.playerId}")

                val response = roomService.leave(safeRoomId, request.playerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "ルームから退出しました"
                    )
                )

                logger.info("ルーム退出成功: roomId=$safeRoomId, playerId=${request.playerId}")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("ルーム見つからない: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ルーム退出エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * POST /rooms/{roomId}/ready - 準備完了設定
         */
        post("/{roomId}/ready") {
            try {
                val roomId = call.parameters["roomId"]
                    ?: throw ValidationException("MISSING_ROOM_ID", "ルームIDが指定されていません")
                val safeRoomId = roomId!!

                logger.info("準備完了設定リクエスト: roomId=$safeRoomId")

                val request = call.receive<RoomReadyRequest>()
                logger.debug("準備完了リクエスト: playerId=${request.playerId}, isReady=${request.isReady}")

                val response = roomService.setReady(safeRoomId, request.playerId, request.isReady)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "準備状態が更新されました"
                    )
                )

                logger.info("準備完了設定成功: roomId=$safeRoomId, playerId=${request.playerId}, isReady=${request.isReady}")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("ルーム見つからない: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("準備完了設定エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * POST /rooms/{roomId}/start - ゲーム開始
         */
        post("/{roomId}/start") {
            try {
                val roomId = call.parameters["roomId"]
                    ?: throw ValidationException("MISSING_ROOM_ID", "ルームIDが指定されていません")
                val safeRoomId = roomId!!

                logger.info("ゲーム開始リクエスト: roomId=$safeRoomId")

                val request = call.receive<RoomStartRequest>()
                logger.debug("ゲーム開始リクエスト: hostId=${request.hostId}")

                val response = roomService.startGame(safeRoomId, request.hostId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "ゲームを開始しました"
                    )
                )

                logger.info("ゲーム開始成功: roomId=$safeRoomId, gameId=${response.gameId}")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("ルーム見つからない: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ゲーム開始エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * GET /rooms/code/{roomCode}/state - ルーム状態取得（ポーリング用）
         */
        get("/code/{roomCode}/state") {
            try {
                val roomCode = call.parameters["roomCode"]
                    ?: throw ValidationException("MISSING_ROOM_CODE", "ルームコードが指定されていません")
                val safeRoomCode = roomCode!!

                logger.info("ルーム状態取得リクエスト: roomCode=$safeRoomCode")

                val response = roomService.getRoomState(safeRoomCode)

                // Last-Modifiedヘッダーを設定
                call.response.headers.append("Last-Modified", response.updatedAt)

                // If-Modified-Sinceヘッダーが送信された場合、変更がないかチェック
                val ifModifiedSince = call.request.headers["If-Modified-Since"]
                if (ifModifiedSince != null && ifModifiedSince == response.updatedAt) {
                    call.respond(HttpStatusCode.NotModified)
                    return@get
                }

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("ルーム状態取得成功: roomCode=$safeRoomCode")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("ルーム見つからない: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ルーム状態取得エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * GET /rooms/code/{roomCode} - ルームコードでルーム取得
         */
        get("/code/{roomCode}") {
            try {
                val roomCode = call.parameters["roomCode"]
                    ?: throw ValidationException("MISSING_ROOM_CODE", "ルームコードが指定されていません")
                val safeRoomCode = roomCode!!

                logger.info("ルームコード検索リクエスト: roomCode=$safeRoomCode")

                val response = roomService.findByCode(safeRoomCode)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("ルームコード検索成功: roomCode=$safeRoomCode, roomId=${response.roomId}")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("ルームコード無効: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ルームコード検索エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * POST /rooms/{roomId}/chat - チャットメッセージ送信
         */
        post("/{roomId}/chat") {
            try {
                val roomId = call.parameters["roomId"]
                if (roomId.isNullOrBlank()) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ApiErrorResponse(
                            error = ErrorDetails(
                                code = "INVALID_ROOM_ID",
                                message = "ルームIDが無効です"
                            )
                        )
                    )
                    return@post
                }

                logger.info("チャットメッセージ送信リクエスト: roomId=$roomId")

                val request = call.receive<ChatMessageRequest>()
                logger.debug("メッセージ: playerId=${request.playerId}, message=${request.message}, type=${request.type}")

                val response = roomService.sendMessage(roomId, request)

                call.respond(
                    HttpStatusCode.Created,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "メッセージが正常に送信されました"
                    )
                )

                logger.info("チャットメッセージ送信成功: messageId=${response.messageId}")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("リソースが見つかりません: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("チャットメッセージ送信エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }

        /**
         * GET /rooms/{roomId}/chat - チャットメッセージ履歴取得
         */
        get("/{roomId}/chat") {
            try {
                val roomId = call.parameters["roomId"]
                if (roomId.isNullOrBlank()) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        ApiErrorResponse(
                            error = ErrorDetails(
                                code = "INVALID_ROOM_ID",
                                message = "ルームIDが無効です"
                            )
                        )
                    )
                    return@get
                }

                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
                val before = call.request.queryParameters["before"]

                logger.info("チャットメッセージ履歴取得リクエスト: roomId=$roomId, limit=$limit, before=$before")

                val response = roomService.getMessages(roomId, limit, before)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("チャットメッセージ履歴取得成功: ${response.messages.size}件")

            } catch (e: ValidationException) {
                logger.warn("バリデーションエラー: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: NotFoundException) {
                logger.warn("リソースが見つかりません: ${e.message ?: "Unknown error"}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = e.code,
                            message = e.message ?: "Unknown error"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("チャットメッセージ履歴取得エラー", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "INTERNAL_ERROR",
                            message = "サーバー内部エラーが発生しました"
                        )
                    )
                )
            }
        }
    }
}
