'use client';

// X (Twitter) OAuth 2.0 PKCE helpers — custom auth without Privy

const CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID || '';

function b64url(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function randomB64(): string {
    return b64url(crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer);
}

async function sha256B64(str: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return b64url(buf);
}

export interface XUser {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
}

export async function startXLogin(): Promise<void> {
    if (typeof window === 'undefined') return;
    const redirectUri = window.location.origin + '/';
    const code_verifier = randomB64();
    const code_challenge = await sha256B64(code_verifier);
    const state = randomB64();

    localStorage.setItem('x_pkce', JSON.stringify({ code_verifier, state, redirect_uri: redirectUri }));

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'tweet.read users.read',
        state,
        code_challenge,
        code_challenge_method: 'S256',
    });

    window.location.href = `https://twitter.com/i/oauth2/authorize?${params}`;
}

export async function handleXCallback(): Promise<XUser | null> {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) return null;

    const raw = localStorage.getItem('x_pkce');
    if (!raw) return null;

    let stored: { code_verifier: string; state: string; redirect_uri: string };
    try { stored = JSON.parse(raw); } catch { return null; }
    if (stored.state !== state) return null;

    localStorage.removeItem('x_pkce');
    window.history.replaceState({}, '', window.location.pathname);

    // Exchange code for access token via server proxy
    let access_token: string | null = null;
    try {
        const r = await fetch('/api/x-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, code_verifier: stored.code_verifier, redirect_uri: stored.redirect_uri }),
        });
        if (r.ok) ({ access_token } = await r.json());
        else console.error('[xAuth] token exchange failed:', await r.text());
    } catch (e) {
        console.error('[xAuth] /api/x-token error:', e);
    }

    if (!access_token) return null;
    localStorage.setItem('x_access_token', access_token);

    // Fetch user profile
    let user: XUser | null = null;
    try {
        const r = await fetch('/api/x-me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        if (r.ok) user = await r.json();
        else console.error('[xAuth] /api/x-me failed:', await r.text());
    } catch (e) {
        console.error('[xAuth] /api/x-me error:', e);
    }

    return user;
}
