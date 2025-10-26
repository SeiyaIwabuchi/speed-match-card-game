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
        
        // Allow requests from production frontend (S3)
        allowHost("speed-match-card-game.s3-website-ap-northeast-1.amazonaws.com", schemes = listOf("http"))
        
        // Allow Swagger UI
        allowHost("localhost:8080")
        allowHost("127.0.0.1:8080")
        
        // Allow common headers
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowHeader(HttpHeaders.Accept)
        allowHeader(HttpHeaders.AccessControlAllowOrigin)
        allowHeader(HttpHeaders.AccessControlAllowHeaders)
        allowHeader(HttpHeaders.AccessControlAllowMethods)
        
        // Allow custom headers for polling
        allowHeader("If-Modified-Since")
        allowHeader("Last-Modified")
        
        // Expose headers to frontend
        exposeHeader(HttpHeaders.ContentType)
        exposeHeader("Last-Modified")
        
        // Allow common HTTP methods
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Head)
        
        // Allow credentials for authentication
        allowCredentials = true
        
        // Cache preflight response for 1 hour
        maxAgeInSeconds = 3600
        
        // Allow any header for preflight requests
        allowNonSimpleContentTypes = true
    }
}