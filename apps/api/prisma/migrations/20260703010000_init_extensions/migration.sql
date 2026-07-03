-- Phase 0: 検索・ID生成基盤として必要な PostgreSQL 拡張機能を有効化する
-- 設計書 ①③④⑩ 準拠 (pg_trgm: あいまい全文検索, pgvector: RAG埋め込み, pgcrypto: UUID生成補助)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
