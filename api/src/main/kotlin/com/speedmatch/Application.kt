package com.speedmatch

import io.ktor.server.application.*
import com.speedmatch.presentation.plugin.configureRouting
import com.speedmatch.presentation.plugin.configureSwagger

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureSwagger()
    configureRouting()
}
