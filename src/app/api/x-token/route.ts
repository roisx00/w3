import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { code, code_verifier, redirect_uri } = await req.json().catch(() => ({}));

    if (!code || !code_verifier || !redirect_uri) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (!clientId) {
        return NextResponse.json({ error: 'X_CLIENT_ID not configured' }, { status: 500 });
    }

    const body = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri,
        code_verifier,
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (clientSecret) {
        headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    }

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers,
        body,
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('[x-token] Twitter error:', data);
        return NextResponse.json({ error: data }, { status: 400 });
    }

    return NextResponse.json({ access_token: data.access_token });
}
