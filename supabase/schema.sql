-- Supabase Schema for Web3 Talent & Airdrop Hub

-- 1. Talents Table
CREATE TABLE IF NOT EXISTS talents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE, -- Link to Supabase Auth
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    wallet_address TEXT, -- Now optional as we use Google/Email
    socials JSONB DEFAULT '{}'::jsonb,
    roles TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    experience JSONB DEFAULT '[]'::jsonb,
    availability TEXT CHECK (availability IN ('Full-time', 'Part-time', 'Freelance')),
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ... (Jobs and Airdrops tables remain same)

-- Enable RLS
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrops ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies
CREATE POLICY "Public Read Access" ON talents FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON jobs FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON airdrops FOR SELECT USING (true);

-- 2. User Specific Update/Insert for Talents
CREATE POLICY "Users can update their own profile" ON talents 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON talents 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated Submissions
CREATE POLICY "Auth users can post jobs" ON jobs 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users can submit airdrops" ON airdrops 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
