'use client';

import { useAppContext } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Conversation } from '@/lib/types';
import AuthGuard from '@/components/auth/AuthGuard';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import { MessageSquare, Settings, Award, Edit3, LogOut, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import GoldBadge from '@/components/GoldBadge';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MessagesPage() {
    return (
        <AuthGuard>
            <MessagesContent />
        </AuthGuard>
    );
}

function MessagesContent() {
    const { user, logout, unreadMessagesCount } = useAppContext();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (!user?.id) return;

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', user.id),
            orderBy('lastMessageAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const convs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
            setConversations(convs);
            setLoading(false);

            // Handle active ID from URL
            const urlId = searchParams.get('id');
            if (urlId) {
                setActiveId(urlId);
            } else if (convs.length > 0 && !activeId) {
                // By default select first if none active and no ID in URL
                // setActiveId(convs[0].id); // Optional: leave blank for "Select a message"
            }
        }, () => { setLoading(false); /* suppress Firestore auth error with Privy */ });

        return () => unsubscribe();
    }, [user?.id, searchParams]);

    const activeConversation = conversations.find(c => c.id === activeId);

    // Sidebar navigation (mirrored from dashboard for now)
    const profileFields = [user?.displayName, user?.bio, user?.walletAddress, user?.roles?.length, user?.skills?.length, user?.resumeUrl];
    const profilePct = Math.min(100, 80 + Math.round((profileFields.filter(Boolean).length / profileFields.length) * 20));

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 h-[calc(100vh-120px)] flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="lg:col-span-1 space-y-8 flex flex-col overflow-y-auto pr-2 scrollbar-hide">
                    <div className="glass p-6 text-center border-accent-primary/20 bg-accent-primary/5 shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-accent-primary/20 border border-accent-primary/30 mx-auto mb-4 flex items-center justify-center font-display font-black text-xl text-accent-primary overflow-hidden">
                            {user?.photoUrl ? (
                                <img src={user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                (user?.displayName || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <h3 className="font-display font-black text-lg mb-1 flex items-center justify-center gap-1.5 line-clamp-1">
                            {user?.displayName || 'Anonymous'}
                            {user?.hasBadge && <GoldBadge size={18} />}
                        </h3>
                        <span className="text-[10px] text-foreground/40 font-bold tracking-widest uppercase">{user?.roles?.length ? user.roles[0] : 'Web3 Professional'}</span>
                    </div>

                    <nav className="glass p-4 space-y-1 shrink-0">
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <Award className="w-4 h-4" /> Overview
                        </Link>
                        <Link href="/dashboard/messages" className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl text-accent-primary font-bold text-sm group">
                            <span className="flex items-center gap-3">
                                <MessageSquare className="w-4 h-4" /> Messages
                            </span>
                            {unreadMessagesCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center animate-in zoom-in duration-300">
                                    <span className="text-[10px] font-black text-black">{unreadMessagesCount}</span>
                                </span>
                            )}
                        </Link>
                        <Link href={`/talents/${user?.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <Settings className="w-4 h-4" /> My Resume
                        </Link>
                        <Link href="/onboarding" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-foreground/50 transition-colors font-bold text-sm">
                            <Edit3 className="w-4 h-4" /> Edit Profile
                        </Link>
                        <div className="pt-1 border-t border-white/5">
                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent-danger/10 rounded-xl text-foreground/40 hover:text-accent-danger transition-all font-bold text-sm">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Main Messages Content */}
                <main className="lg:col-span-3 flex flex-col glass overflow-hidden border-white/5">
                    <div className="flex flex-1 overflow-hidden">
                        {/* Conversation List */}
                        <div className="w-1/3 border-r border-white/5 flex flex-col overflow-hidden bg-black/20">
                            <div className="p-5 border-b border-white/5 shrink-0">
                                <h2 className="font-display font-black text-xl uppercase tracking-tight mb-4">Inbox</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
                                    <input 
                                        type="text" 
                                        placeholder="Search messages..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:border-accent-primary/50 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                {loading ? (
                                    <div className="p-10 flex justify-center">
                                        <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
                                    </div>
                                ) : (
                                    <ConversationList 
                                        conversations={conversations}
                                        activeId={activeId}
                                        onSelect={(id) => {
                                            setActiveId(id);
                                            router.push(`/dashboard/messages?id=${id}`, { scroll: false });
                                        }}
                                        currentUserId={user!.id}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            {activeConversation ? (
                                <ChatWindow 
                                    conversation={activeConversation}
                                    currentUserId={user!.id}
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-foreground/10">
                                        <MessageSquare className="w-10 h-10" />
                                    </div>
                                    <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-2">Your Conversations</h3>
                                    <p className="text-sm text-foreground/40 font-medium max-w-md leading-relaxed">
                                        Select a conversation from the list to view messages and reply.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
