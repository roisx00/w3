import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'No authorization header' }, { status: 401 });

    const response = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url,name',
        { headers: { Authorization: auth } }
    );

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data }, { status: 400 });

    const { id, username, name, profile_image_url } = data.data;
    return NextResponse.json({ id, username, name, avatar: profile_image_url || null });
}
