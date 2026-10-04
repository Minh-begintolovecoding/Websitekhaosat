-- Migration 0001: Initial schema for Witte et al. (2025) replication
-- Information Manipulation Theory in Online Retailing

CREATE TABLE IF NOT EXISTS "participants" (
    "participant_uuid" TEXT PRIMARY KEY,
    "group_type" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "responses" (
    "response_id" SERIAL PRIMARY KEY,
    "participant_uuid" TEXT NOT NULL UNIQUE REFERENCES "participants"("participant_uuid") ON DELETE CASCADE,
    "group_type" TEXT NOT NULL,
    
    -- Quality
    "qual1" INTEGER NOT NULL,
    "qual2" INTEGER NOT NULL,
    "qual3" INTEGER NOT NULL,
    "qual4" INTEGER NOT NULL,
    
    -- Quantity
    "quan1" INTEGER NOT NULL,
    "quan2" INTEGER NOT NULL,
    "quan3" INTEGER NOT NULL,
    "quan4" INTEGER NOT NULL,
    
    -- Relevance
    "rel1" INTEGER NOT NULL,
    "rel2" INTEGER NOT NULL,
    "rel3" INTEGER NOT NULL,
    
    -- Clarity
    "cla1" INTEGER NOT NULL,
    "cla2" INTEGER NOT NULL,
    "cla3" INTEGER NOT NULL,
    "cla4" INTEGER NOT NULL,
    
    -- Perceived Customer Manipulation
    "pcm1" INTEGER NOT NULL,
    "pcm2" INTEGER NOT NULL,
    "pcm3" INTEGER NOT NULL,
    "pcm4" INTEGER NOT NULL,
    "pcm5" INTEGER NOT NULL,
    "pcm6" INTEGER NOT NULL,
    
    -- Attitude Toward Website
    "att1" INTEGER NOT NULL,
    "att2" INTEGER NOT NULL,
    "att3" INTEGER NOT NULL,
    "att4" INTEGER NOT NULL,
    
    -- Purchase Intention
    "pi1" INTEGER NOT NULL,
    "pi2" INTEGER NOT NULL,
    "pi3" INTEGER NOT NULL,
    
    -- Loyalty Intention
    "loy1" INTEGER NOT NULL,
    "loy2" INTEGER NOT NULL,
    "loy3" INTEGER NOT NULL,
    
    -- Online Shopping Familiarity
    "fam1" INTEGER NOT NULL,
    "fam2" INTEGER NOT NULL,
    "fam3" INTEGER NOT NULL,
    "fam4" INTEGER NOT NULL,
    
    -- Manipulation Checks
    "sc1" TEXT,
    "sc2" TEXT,
    "sn1" TEXT,
    
    -- Timings & Durations (seconds)
    "product_page_duration" INTEGER NOT NULL,
    "cart_page_duration" INTEGER NOT NULL,
    "survey_duration" INTEGER NOT NULL,
    "total_duration" INTEGER NOT NULL,
    
    -- Data Cleaning Flags
    "is_speeding" BOOLEAN DEFAULT FALSE NOT NULL,
    "failed_manipulation" BOOLEAN DEFAULT FALSE NOT NULL,
    
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "submitted_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "uid" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "role" TEXT DEFAULT 'researcher' NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_participants_group" ON "participants"("group_type");
CREATE INDEX IF NOT EXISTS "idx_responses_group" ON "responses"("group_type");
CREATE INDEX IF NOT EXISTS "idx_responses_speeding" ON "responses"("is_speeding");
