package com.speedmatch.presentation.routes

import com.speedmatch.domain.dto.*
import com.speedmatch.domain.service.GameService
import com.speedmatch.domain.service.ValidationException
import com.speedmatch.domain.service.NotFoundException
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("GameRoutes")

fun Route.gameRoutes() {
    val gameService = GameService()

    route("/games") {
        /**
         * GET /games/{gameId}/state - ゲーム状態取得（ポーリング用）
         */
        get("/{gameId}/state") {
            try {
                val gameId = call.parameters["gameId"]
                    ?: throw ValidationException("MISSING_GAME_ID", "ゲームIDが指定されていません")
                val safeGameId = gameId!!

                logger.info("ゲーム状態取得リクエスト: gameId=$safeGameId")

                val response = gameService.getGameState(safeGameId)

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

                logger.debug("ゲーム状態取得成功: gameId=$safeGameId")

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
                logger.warn("ゲーム見つからない: ${e.message ?: "Unknown error"}")
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
                logger.error("ゲーム状態取得エラー", e)
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