import { NextRequest, NextResponse } from 'next/server';

// GET /api/twitter-stats?handle=alexmoon
export async function GET(req: NextRequest) {
    const handle = req.nextUrl.searchParams.get('handle')?.replace('@', '').trim();
    if (!handle) return NextResponse.json({ error: 'Missing handle' }, { status: 400 });

    const rawToken = process.env.TWITTER_BEARER_TOKEN;
    if (!rawToken) return NextResponse.json({ error: 'Twitter API not configured.' }, { status: 500 });
    // Decode in case the token was URL-encoded (e.g. %3D → =) when pasted into .env
    const bearerToken = decodeURIComponent(rawToken);

    try {
        // 1. Fetch user profile
        const userRes = await fetch(
            `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=public_metrics,description,profile_image_url,verified,created_at,location,url`,
            { headers: { Authorization: `Bearer ${bearerToken}` }, next: { revalidate: 3600 } }
        );
        const userData = await userRes.json();

        if (userData.errors || !userData.data) {
            const detail = userData.errors?.[0]?.detail || userData.title || userData.detail || JSON.stringify(userData);
            return NextResponse.json({ error: detail }, { status: 404 });
        }

        const u = userData.data;
        const metrics = u.public_metrics;

        // 2. Fetch last 10 tweets to compute engagement rate
        let engagementRate: number | null = null;
        let avgLikes: number | null = null;
        let avgRetweets: number | null = null;
        let avgReplies: number | null = null;

        try {
            const tweetsRes = await fetch(
                `https://api.twitter.com/2/users/${u.id}/tweets?max_results=10&tweet.fields=public_metrics&exclude=retweets,replies`,
                { headers: { Authorization: `Bearer ${bearerToken}` }, next: { revalidate: 3600 } }
            );
            const tweetsData = await tweetsRes.json();

            if (tweetsData.data?.length > 0) {
                const tweets = tweetsData.data as Array<{ public_metrics: { like_count: number; retweet_count: number; reply_count: number; quote_count: number } }>;
                const total = tweets.length;
                const sumLikes = tweets.reduce((s, t) => s + t.public_metrics.like_count, 0);
                const sumRTs = tweets.reduce((s, t) => s + t.public_metrics.retweet_count, 0);
                const sumReplies = tweets.reduce((s, t) => s + t.public_metrics.reply_count, 0);
                const sumQuotes = tweets.reduce((s, t) => s + t.public_metrics.quote_count, 0);

                avgLikes = Math.round(sumLikes / total);
                avgRetweets = Math.round(sumRTs / total);
                avgReplies = Math.round(sumReplies / total);

                const avgEngagements = (sumLikes + sumRTs + sumReplies + sumQuotes) / total;
                if (metrics.followers_count > 0) {
                    engagementRate = Math.round((avgEngagements / metrics.followers_count) * 1000) / 10; // one decimal
                }
            }
        } catch {
            // Engagement rate is optional — proceed without it
        }

        // 3. Compute account age in years
        const createdAt = u.created_at ? new Date(u.created_at) : null;
        const accountAgeYears = createdAt
            ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365))
            : null;

        // 4. Use high-res profile photo (replace _normal with _400x400)
        const photoUrl = u.profile_image_url?.replace('_normal', '_400x400') || null;

        return NextResponse.json({
            id: u.id,
            name: u.name,
            username: u.username,
            bio: u.description || '',
            photoUrl,
            verified: u.verified || false,
            location: u.location || null,
            followers: metrics.followers_count,
            following: metrics.following_count,
            tweetCount: metrics.tweet_count,
            listedCount: metrics.listed_count,
            engagementRate,
            avgLikes,
            avgRetweets,
            avgReplies,
            accountAgeYears,
            createdAt: u.created_at || null,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch Twitter stats' }, { status: 500 });
    }
}
