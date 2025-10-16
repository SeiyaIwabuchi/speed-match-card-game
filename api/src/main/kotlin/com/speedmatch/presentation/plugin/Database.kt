package com.speedmatch.presentation.plugin

import com.speedmatch.infrastructure.database.DatabaseFactory
import io.ktor.server.application.*

fun Application.configureDatabase() {
    DatabaseFactory.init(environment.config)
}