package com.speedmatch.presentation.routes

import com.speedmatch.domain.dto.*
import com.speedmatch.domain.service.GameService
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
         * POST /api/v1/games - ゲーム作成
         */
        post {
            try {
                val request = call.receive<CreateGameRequest>()
                logger.info("ゲーム作成リクエスト: roomId=${request.roomId}, playerIds=${request.playerIds}")

                // バリデーション
                require(request.playerIds.size in 2..4) {
                    "プレイヤー数は2～4人である必要があります"
                }

                val gameState = gameService.createGame(request.roomId, request.playerIds)

                call.respond(
                    HttpStatusCode.Created,
                    ApiResponse(
                        success = true,
                        data = CreateGameResponse(
                            gameId = gameState.gameId,
                            roomId = gameState.roomId,
                            status = gameState.status.name,
                            message = "ゲームが作成されました"
                        )
                    )
                )

                logger.info("ゲーム作成成功: gameId=${gameState.gameId}")

            } catch (e: IllegalArgumentException) {
                logger.warn("バリデーションエラー: ${e.message}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "VALIDATION_ERROR",
                            message = e.message ?: "バリデーションエラー"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ゲーム作成エラー", e)
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
         * GET /api/v1/games/{gameId}/state - ゲーム状態取得（ポーリング用）
         */
        get("/{gameId}/state") {
            try {
                val gameId = call.parameters["gameId"]
                    ?: throw IllegalArgumentException("ゲームIDが指定されていません")
                val playerId = call.request.queryParameters["playerId"]

                logger.info("ゲーム状態取得リクエスト: gameId=$gameId, playerId=$playerId")

                val gameState = gameService.getGameState(gameId)
                    ?: throw IllegalStateException("ゲームが見つかりません")

                val response = GameStateResponse.fromDomain(gameState, playerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = response
                    )
                )

                logger.debug("ゲーム状態取得成功: gameId=$gameId")

            } catch (e: IllegalArgumentException) {
                logger.warn("バリデーションエラー: ${e.message}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "VALIDATION_ERROR",
                            message = e.message ?: "バリデーションエラー"
                        )
                    )
                )
            } catch (e: IllegalStateException) {
                logger.warn("ゲームが見つかりません: ${e.message}")
                call.respond(
                    HttpStatusCode.NotFound,
                    ApiErrorResponse(
                        error = ErrorDetails(
                            code = "GAME_NOT_FOUND",
                            message = e.message ?: "ゲームが見つかりません"
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

        /**
         * POST /api/v1/games/{gameId}/actions/play - カードプレイ
         */
        post("/{gameId}/actions/play") {
            try {
                val gameId = call.parameters["gameId"]
                    ?: throw IllegalArgumentException("ゲームIDが指定されていません")
                val request = call.receive<PlayCardRequest>()

                logger.info("カードプレイリクエスト: gameId=$gameId, playerId=${request.playerId}, card=${request.card}, targetField=${request.targetField}")

                val card = CardDTO.toDomain(request.card)
                val newState = gameService.playCard(gameId, request.playerId, card, request.targetField)

                val response = GameStateResponse.fromDomain(newState, request.playerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = GameActionResponse(
                            success = true,
                            message = "カードをプレイしました",
                            gameState = response
                        )
                    )
                )

                logger.info("カードプレイ成功: gameId=$gameId, playerId=${request.playerId}")

            } catch (e: IllegalArgumentException) {
                logger.warn("カードプレイエラー: ${e.message}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse(
                        success = false,
                        data = GameActionResponse(
                            success = false,
                            message = e.message ?: "不正なカードプレイです"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("カードプレイエラー", e)
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
         * POST /api/v1/games/{gameId}/actions/draw - カードドロー
         */
        post("/{gameId}/actions/draw") {
            try {
                val gameId = call.parameters["gameId"]
                    ?: throw IllegalArgumentException("ゲームIDが指定されていません")
                val request = call.receive<DrawCardRequest>()

                logger.info("カードドローリクエスト: gameId=$gameId, playerId=${request.playerId}")

                val newState = gameService.drawCard(gameId, request.playerId)

                val response = GameStateResponse.fromDomain(newState, request.playerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = GameActionResponse(
                            success = true,
                            message = "カードを引きました",
                            gameState = response
                        )
                    )
                )

                logger.info("カードドロー成功: gameId=$gameId, playerId=${request.playerId}")

            } catch (e: IllegalArgumentException) {
                logger.warn("カードドローエラー: ${e.message}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse(
                        success = false,
                        data = GameActionResponse(
                            success = false,
                            message = e.message ?: "カードを引けません"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("カードドローエラー", e)
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
         * POST /api/v1/games/{gameId}/actions/skip - ターンスキップ
         */
        post("/{gameId}/actions/skip") {
            try {
                val gameId = call.parameters["gameId"]
                    ?: throw IllegalArgumentException("ゲームIDが指定されていません")
                val request = call.receive<SkipTurnRequest>()

                logger.info("ターンスキップリクエスト: gameId=$gameId, playerId=${request.playerId}")

                val newState = gameService.skipTurn(gameId, request.playerId)

                val response = GameStateResponse.fromDomain(newState, request.playerId)

                call.respond(
                    HttpStatusCode.OK,
                    ApiResponse(
                        success = true,
                        data = GameActionResponse(
                            success = true,
                            message = "ターンをスキップしました",
                            gameState = response
                        )
                    )
                )

                logger.info("ターンスキップ成功: gameId=$gameId, playerId=${request.playerId}")

            } catch (e: IllegalArgumentException) {
                logger.warn("ターンスキップエラー: ${e.message}")
                call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse(
                        success = false,
                        data = GameActionResponse(
                            success = false,
                            message = e.message ?: "ターンをスキップできません"
                        )
                    )
                )
            } catch (e: Exception) {
                logger.error("ターンスキップエラー", e)
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