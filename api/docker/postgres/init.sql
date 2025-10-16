-- Speed Match Card Game Database Initialization
-- This file is executed when PostgreSQL container starts for the first time

-- Create database if not exists (this is handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS speedmatch_dev;

-- Connect to the database
\c speedmatch_dev;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables will be handled by Exposed schema creation in Kotlin code
-- This file is mainly for database setup and initial data if needed

-- Log successful initialization
INSERT INTO pg_stat_statements_info VALUES ('Database speedmatch_dev initialized successfully') 
ON CONFLICT DO NOTHING;