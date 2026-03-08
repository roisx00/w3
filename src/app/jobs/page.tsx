'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { JobPosting } from '@/lib/types';
import JobCard from '@/components/JobCard';
import { Briefcase, Zap, Search } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function JobsPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    useEffect(() => {
        async function fetchJobs() {
            try {
                const jobsRef = collection(db, 'jobs');
                const q = query(jobsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const fetchedJobs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as JobPosting[];

                // Sort: featured first, then by date
                fetchedJobs.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
                setJobs(fetchedJobs);
            } catch (err) {
                console.error('Error fetching jobs:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchJobs();
    }, []);

    // Reset visibleCount when search changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search]);

    const filtered = jobs.filter(job =>
        // hide pending/rejected listings (backwards compat: no paymentStatus = old listing = show)
        job.paymentStatus !== 'pending' && job.paymentStatus !== 'rejected' &&
        (!search ||
        job.roleNeeded.toLowerCase().includes(search.toLowerCase()) ||
        job.projectName.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase()))
    );

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <header className="mb-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 glass-pill mb-4 border-black/5">
                            <Briefcase className="w-3 h-3 text-accent-primary" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-accent-primary">HIRING ACTIVE</span>
                        </div>
                        <h1 className="font-display font-black text-6xl mb-4 tracking-tight uppercase text-foreground leading-none">Job Board</h1>
                        <p className="text-foreground/40 font-medium text-lg">Elite opportunities at verified crypto projects.</p>
                    </div>
                    <Link
                        href="/jobs/post"
                        className="px-8 py-4 bg-accent-primary text-white font-black rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-tighter flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    >
                        POST A JOB
                        <Zap className="w-4 h-4 fill-current" />
                    </Link>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 p-2 glass rounded-2xl border-white/5">
                    <div className="flex-grow relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by role, protocol, or skill..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-accent-primary/30 transition-colors font-medium"
                        />
                    </div>
                </div>
            </header>

            {/* Main List */}
            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Loading Opportunities...</p>
                    </div>
                ) : visible.length > 0 ? (
                    visible.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))
                ) : (
                    <div className="text-center py-20 glass rounded-3xl">
                        <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">
                            {jobs.length === 0 ? 'No jobs found in the database.' : `No results for "${search}"`}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer / Load More */}
            <div className="mt-16 text-center">
                {!loading && filtered.length > 0 && (
                    hasMore ? (
                        <button
                            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                            className="px-12 py-4 glass border-white/10 rounded-xl hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-foreground/60"
                        >
                            Load More ({filtered.length - visibleCount} remaining)
                        </button>
                    ) : (
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground/20">
                            Showing all {filtered.length} results
                        </p>
                    )
                )}
            </div>
        </div>
    );
}
