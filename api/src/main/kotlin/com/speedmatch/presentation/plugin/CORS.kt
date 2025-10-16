package com.speedmatch.presentation.plugin

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCORS() {
    install(CORS) {
        // Allow requests from frontend (local development)
        allowHost("localhost:3000")
        allowHost("127.0.0.1:3000")
        allowHost("localhost:5173") // Vite dev server
        allowHost("127.0.0.1:5173")
        
        // Allow Swagger UI
        allowHost("localhost:8080")
        allowHost("127.0.0.1:8080")
        
        // Allow common headers
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        
        // Allow common HTTP methods
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
        
        // Allow credentials for authentication
        allowCredentials = true
        
        // Cache preflight response
        maxAgeInSeconds = 3600
    }
}