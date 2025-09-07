-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create additional schemas if needed
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reporting;

-- Set timezone for consistent data
ALTER DATABASE platform_dev SET timezone TO 'Asia/Jakarta';

-- Create a simple health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(status text, timestamp timestamptz) AS $$
BEGIN
    RETURN QUERY SELECT 'healthy'::text, NOW();
END;
$$ LANGUAGE plpgsql;

-- Log initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;