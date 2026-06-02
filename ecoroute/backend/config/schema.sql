-- Run this in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → paste this → Run

CREATE TABLE IF NOT EXISTS users (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100)        NOT NULL,
  email     VARCHAR(150) UNIQUE NOT NULL,
  password  VARCHAR(255)        NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
