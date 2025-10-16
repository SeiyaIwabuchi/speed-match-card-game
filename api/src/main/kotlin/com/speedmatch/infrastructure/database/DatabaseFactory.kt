package com.speedmatch.infrastructure.database

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.*
import io.ktor.server.config.*
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.TransactionManager
import java.sql.Connection

object DatabaseFactory {
    fun init(config: ApplicationConfig) {
        val driverClassName = config.property("database.driver").getString()
        val jdbcURL = config.property("database.url").getString()
        val user = config.property("database.user").getString()
        val password = config.property("database.password").getString()
        val maxPoolSize = config.property("database.maxPoolSize").getString().toInt()
        
        val hikariConfig = HikariConfig().apply {
            this.driverClassName = driverClassName
            this.jdbcUrl = jdbcURL
            this.username = user
            this.password = password
            this.maximumPoolSize = maxPoolSize
            this.isAutoCommit = false
            this.transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }
        
        val dataSource = HikariDataSource(hikariConfig)
        Database.connect(dataSource)
        TransactionManager.manager.defaultIsolationLevel = Connection.TRANSACTION_REPEATABLE_READ
        
        // Create tables if they don't exist
        SchemaUtils.createTables()
        
        // Insert seed data in development environment (safe: ignore duplicates/errors)
        val environment = config.propertyOrNull("ktor.environment")?.getString() ?: "development"
        if (environment == "development") {
            try {
                SeedData.insertSampleData()
            } catch (e: Exception) {
                // Don't fail app startup if seed already exists or insertion fails in development
                println("SeedData insertion skipped or failed: ${'$'}{e.message}")
            }
        }
    }
}