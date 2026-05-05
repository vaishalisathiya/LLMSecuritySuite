-- Align `users` with SQLAlchemy models when DB was created from an older schema.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Unique usernames (PostgreSQL allows multiple NULLs in a UNIQUE index).
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);
