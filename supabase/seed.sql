-- Seed Data for Web3 Talent & Airdrop Hub

-- 1. Seed Talents
INSERT INTO talents (username, display_name, bio, wallet_address, roles, skills, availability, experience, socials)
VALUES 
('vitalik.eth', 'Vitalik Buterin', 'Founder of Ethereum. Interested in cryptography, decentralized systems, and game theory.', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ARRAY['Developer', 'Researcher'], ARRAY['Solidity', 'Rust', 'EVM', 'ZK-Proofs'], 'Full-time', '[{"id": "e1", "role": "Core Researcher", "duration": "2014 - Present", "projectName": "Ethereum Foundation", "responsibilities": "Designing the consensus layer and scalability solutions."}]'::jsonb, '{"twitter": "@vitalikbuterin"}'::jsonb),
('satoshi_n', 'Satoshi Nakamoto', 'Digital gold architect. Expert in P2P networks and economic incentives.', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', ARRAY['Developer', 'Researcher'], ARRAY['C++', 'Cryptography', 'P2P'], 'Full-time', '[]'::jsonb, '{"twitter": "@satoshi"}'::jsonb)
ON CONFLICT (wallet_address) DO NOTHING;

-- 2. Seed Jobs
INSERT INTO jobs (project_name, website, twitter, role_needed, description, experience_level, payment_config, duration, is_remote, status)
VALUES 
('ZkSync', 'https://zksync.io', '@zksync', 'Senior Solidity Engineer', 'Help us build the most scalable L2 on Ethereum using ZK-rollups.', 'Senior', '{"type": "Salary", "amount": "120k - 180k", "currency": "USDC"}'::jsonb, 'Full-time', true, 'Open'),
('Uniswap Labs', 'https://uniswap.org', '@Uniswap', 'Protocol Architect', 'Design the next generation of decentralized liquidity protocols.', 'Lead', '{"type": "Salary", "amount": "200k+", "currency": "USDC"}'::jsonb, 'Full-time', true, 'Open');

-- 3. Seed Airdrops
INSERT INTO airdrops (project_name, website, twitter, description, blockchain, potential_reward, funding_amount, status, type, difficulty, participation_count, tasks)
VALUES 
('LayerZero', 'https://layerzero.network', '@LayerZero_Labs', 'Omnichain interoperability protocol connecting various blockchains.', 'Multichain', '$500 - $5,000', '$263M', 'Live', 'Confirmed', 'Medium', '1.2M+', ARRAY['Use Stargate Bridge', 'Vote on Snapshot proposals', 'Interact with LiquidSwap']),
('Berachain', 'https://berachain.com', '@berachain', 'DeFi-focused L1 blockchain built on Cosmos SDK.', 'Berachain', '$1,000 - $10,000', '$42M', 'Upcoming', 'Potential', 'Hard', '800k+', ARRAY['Melt "Bera" NFTs', 'Interact with Testnet DEX', 'Join Discord and get roles']);
