'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
    url: string;
}

export default function TweetEmbed({ url }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!url) return;
        setLoading(true);
        setError(false);
        fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&theme=dark&dnt=true&omit_script=true`)
            .then(r => r.json())
            .then(data => {
                if (data.html) setHtml(data.html);
                else setError(true);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [url]);

    useEffect(() => {
        if (!html || !ref.current) return;
        // Load Twitter widget script to render the blockquote
        if ((window as any).twttr?.widgets) {
            (window as any).twttr.widgets.load(ref.current);
        } else {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.onload = () => (window as any).twttr?.widgets?.load(ref.current);
            document.body.appendChild(script);
        }
    }, [html]);

    if (loading) return (
        <div className="h-20 flex items-center justify-center rounded-xl bg-white/3 border border-white/5">
            <span className="text-[10px] text-foreground/30 font-bold animate-pulse">Loading tweet...</span>
        </div>
    );

    if (error) return null;

    return (
        <div ref={ref} className="tweet-embed [&_.twitter-tweet]:!m-0 [&_.twitter-tweet]:!w-full"
            dangerouslySetInnerHTML={{ __html: html }} />
    );
}
