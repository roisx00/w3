'use client';

import { JobPosting } from '@/lib/types';
import { Briefcase, MapPin, DollarSign, Clock, ArrowRight, Bookmark } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';

interface JobCardProps {
    job: JobPosting & { createdAt?: any };
}

function timeAgo(timestamp: any): string {
    if (!timestamp) return 'Recently posted';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

const JobCard = ({ job }: JobCardProps) => {
    const { bookmarkedJobs, toggleBookmarkJob } = useAppContext();
    const isBookmarked = bookmarkedJobs.includes(job.id);

    return (
        <div className="glass p-6 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group border-white/5 hover:border-accent-primary/20 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden h-full">
            {/* Bookmark Button */}
            <button
                onClick={() => toggleBookmarkJob(job.id)}
                className={`absolute top-4 right-4 p-2 rounded-lg transition-colors z-10 ${isBookmarked ? 'text-accent-primary bg-accent-primary/10' : 'text-foreground/20 hover:text-foreground hover:bg-white/5'
                    }`}
            >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Project Info */}
            <div className="flex items-center gap-4 min-w-[240px]">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {job.logoUrl ? (
                        <img src={job.logoUrl} alt={job.projectName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <Briefcase className="w-7 h-7 text-accent-primary/60" />
                    )}
                </div>
                <div>
                    <h3 className="font-display font-bold text-xl leading-tight mb-1">{job.roleNeeded}</h3>
                    <span className="text-sm font-semibold text-accent-primary/80 uppercase tracking-tighter">{job.projectName}</span>
                </div>
            </div>

            {/* Tags / Details */}
            <div className="flex-grow flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/40 uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    {job.isRemote ? 'Remote' : 'On-site'}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/40 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {job.duration}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-accent-success uppercase tracking-widest">
                    <DollarSign className="w-3 h-3" />
                    {job.paymentConfig.amount} {job.paymentConfig.currency}
                </div>
            </div>

            {/* Action */}
            <div className="w-full md:w-auto flex flex-col md:items-end gap-2 shrink-0">
                <Link
                    href={`/jobs/${job.id}`}
                    className="px-8 py-3 bg-accent-primary text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-tighter flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(76,76,76,0.2)]"
                >
                    VIEW DETAILS
                    <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-[10px] font-bold text-foreground/40 text-center md:text-right">Posted {timeAgo((job as any).createdAt)}</span>
            </div>
        </div>
    );
};

export default JobCard;
