-- Add token storage columns to users table
-- Run this script in your MySQL database

USE styles;

-- Add auth_token column to store JWT tokens
ALTER TABLE users ADD COLUMN auth_token VARCHAR(500) NULL;

-- Add token_expires_at column to store token expiration
ALTER TABLE users ADD COLUMN token_expires_at TIMESTAMP NULL;

-- Add index for better performance on token lookups
CREATE INDEX idx_users_auth_token ON users(auth_token);
CREATE INDEX idx_users_token_expires ON users(token_expires_at);

-- Optional: Clean up any existing expired tokens
UPDATE users SET auth_token = NULL, token_expires_at = NULL WHERE token_expires_at < NOW(); 