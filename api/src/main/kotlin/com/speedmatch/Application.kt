package com.speedmatch

import io.ktor.server.application.*
import com.speedmatch.presentation.plugin.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureLogging()
    configureSerialization()
    configureCORS()
    configureDatabase()
    configureSwagger()
    configureRouting()
}
