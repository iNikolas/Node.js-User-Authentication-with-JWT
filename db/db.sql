CREATE DATABASE todousers;

\c todousers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users(
    uid UUID NOT NULL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    password TEXT NOT NULL,
    rights VARCHAR(6) NOT NULL,
    UNIQUE(name)
);

CREATE TABLE refreshTokens (
	uid UUID NOT NULL PRIMARY KEY,
	token TEXT NOT NULL,
    user_uid UUID REFERENCES users (uid),
	UNIQUE(user_uid)
);