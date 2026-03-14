-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    iv TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mint Jobs table
CREATE TABLE IF NOT EXISTS mint_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_user_id TEXT NOT NULL,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    rpc_url TEXT NOT NULL,
    mint_function TEXT DEFAULT 'mint',
    mint_amount INTEGER DEFAULT 1,
    mint_price TEXT DEFAULT '0',
    gas_multiplier REAL DEFAULT 1.2,
    max_retries INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'monitoring', 'minting', 'success', 'failed', 'stopped')),
    tx_hash TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bot Logs table
CREATE TABLE IF NOT EXISTS bot_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES mint_jobs(id) ON DELETE CASCADE,
    firebase_user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'error', 'warn')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mint_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_logs ENABLE ROW LEVEL SECURITY;

-- Note: Since authentication is handled by Firebase, we'll use service role or basic policies for now.
-- In a production environment, you might want more granular PGs based on custom claims if using Supabase Auth together.
-- For this migration, we'll assume the API routes use service role or the app handles validation before calling Supabase.

-- Allow service role access (Idempotent policies)
DROP POLICY IF EXISTS "Allow service role access" ON wallets;
CREATE POLICY "Allow service role access" ON wallets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role access" ON mint_jobs;
CREATE POLICY "Allow service role access" ON mint_jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role access" ON bot_logs;
CREATE POLICY "Allow service role access" ON bot_logs FOR ALL USING (true) WITH CHECK (true);
