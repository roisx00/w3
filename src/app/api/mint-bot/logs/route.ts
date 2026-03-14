import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET  /api/mint-bot/logs?jobId=xxx&userId=xxx
export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get('jobId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!jobId || !userId) {
        return NextResponse.json({ error: 'jobId and userId required' }, { status: 400 });
    }

    // Map snake_case to camelCase for frontend
    const mappedLogs = logs.map((l: any) => ({
        id: l.id,
        jobId: l.job_id,
        userId: l.firebase_user_id,
        message: l.message,
        type: l.type,
        timestamp: l.timestamp
    }));

    return NextResponse.json({ logs: mappedLogs });
}
