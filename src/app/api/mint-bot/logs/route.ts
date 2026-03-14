import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET  /api/mint-bot/logs?jobId=xxx&userId=xxx
export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get('jobId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!jobId || !userId) {
        return NextResponse.json({ error: 'jobId and userId required' }, { status: 400 });
    }

    const { data: logs, error } = await supabase
        .from('bot_logs')
        .select('*')
        .eq('job_id', jobId)
        .eq('firebase_user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

    if (error) {
        console.error('[supabase-logs-error]', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({ logs });
}
