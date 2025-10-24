package com.speedmatch.presentation.plugin

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import com.speedmatch.presentation.routes.playerRoutes
import com.speedmatch.presentation.routes.roomRoutes
import com.speedmatch.presentation.routes.gameRoutes
import kotlinx.serialization.Serializable

@Serializable
data class HealthCheckResponse(
    val status: String,
    val timestamp: String,
    val version: String = "1.0.0"
)

fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Hello World!")
        }

        get("/health") {
            call.respond(
                HttpStatusCode.OK,
                HealthCheckResponse(
                    status = "OK",
                    timestamp = java.time.Instant.now().toString()
                )
            )
        }

        route("/api") {
            playerRoutes()
        }

        route("/api/v1") {
            get("/hello") {
                call.respondText("Hello, SpeedMatch API!")
            }
            playerRoutes()
            roomRoutes()
            gameRoutes()
        }
    }
}
