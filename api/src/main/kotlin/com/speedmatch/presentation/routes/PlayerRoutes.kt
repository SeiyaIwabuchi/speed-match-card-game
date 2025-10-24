package com.speedmatch.presentation.routes

import com.speedmatch.domain.dto.*
import com.speedmatch.domain.service.PlayerService
import com.speedmatch.domain.service.ValidationException
import com.speedmatch.domain.service.NotFoundException
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("PlayerRoutes")

fun Route.playerRoutes() {
    val playerService = PlayerService()

    route("/players") {
        /**
         * POST /players - プレイヤー登録
         */
        post {
            try {
                logger.info("プレイヤー登録リクエスト受信")

                val request = call.receive<PlayerCreateRequest>()
                logger.debug("リクエストデータ: username=${request.username}, avatar=${request.avatar}")

                val response = playerService.create(request)

                call.respond(
                    HttpStatusCode.Created,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "プレイヤーが正常に作成されました"
                    )
                )

                logger.info("プレイヤー作成成功: playerId=${response.playerId}")

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
                logger.error("プレイヤー作成エラー", e)
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
         * GET /players/{playerId} - プレイヤー情報取得
         */
        get("/{playerId}") {
            try {
                val playerId = call.parameters["playerId"]
                    ?: throw ValidationException("MISSING_PLAYER_ID", "プレイヤーIDが指定されていません")
                val safePlayerId = playerId!!

                logger.info("プレイヤー情報取得リクエスト: playerId=$safePlayerId")

                val response = playerService.findById(safePlayerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("プレイヤー情報取得成功: playerId=$safePlayerId")

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
                logger.warn("プレイヤー見つからない: ${e.message ?: "Unknown error"}")
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
                logger.error("プレイヤー情報取得エラー", e)
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
         * PUT /players/{playerId} - プレイヤー情報更新
         */
        put("/{playerId}") {
            try {
                val playerId = call.parameters["playerId"]
                    ?: throw ValidationException("MISSING_PLAYER_ID", "プレイヤーIDが指定されていません")
                val safePlayerId = playerId!!

                logger.info("プレイヤー情報更新リクエスト: playerId=$safePlayerId")

                val request = call.receive<PlayerUpdateRequest>()
                logger.debug("更新リクエスト: username=${request.username}, avatar=${request.avatar}")

                val response = playerService.update(safePlayerId, request)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response,
                        message = "プレイヤー情報が正常に更新されました"
                    )
                )

                logger.info("プレイヤー情報更新成功: playerId=$safePlayerId")

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
                logger.warn("プレイヤー見つからない: ${e.message ?: "Unknown error"}")
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
                logger.error("プレイヤー情報更新エラー", e)
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
         * GET /players/{playerId}/stats - プレイヤー統計取得
         */
        get("/{playerId}/stats") {
            try {
                val playerId = call.parameters["playerId"]
                    ?: throw ValidationException("MISSING_PLAYER_ID", "プレイヤーIDが指定されていません")
                val safePlayerId = playerId!!

                logger.info("プレイヤー統計取得リクエスト: playerId=$safePlayerId")

                val response = playerService.getStats(safePlayerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("プレイヤー統計取得成功: playerId=$safePlayerId")

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
                logger.warn("プレイヤー見つからない: ${e.message ?: "Unknown error"}")
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
                logger.error("プレイヤー統計取得エラー", e)
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