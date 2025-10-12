package com.speedmatch.presentation.plugin

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureSwagger() {
    routing {
        // OpenAPI仕様を提供
        get("/openapi.yaml") {
            val openApiSpec = this::class.java.classLoader.getResource("openapi/documentation.yaml")?.readText()
            if (openApiSpec == null) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    "OpenAPI specification file not found: resources/openapi/documentation.yaml"
                )
                return@get
            }
            call.respondText(openApiSpec, ContentType.Text.Plain)
        }

        // Swagger UI HTMLページ
        get("/swagger") {
            call.respondText(generateSwaggerUI(), ContentType.Text.Html)
        }
    }
}

private fun generateSwaggerUI(): String = """
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Speed Match API - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css">
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; padding:0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                url: "/openapi.yaml",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
""".trimIndent()
