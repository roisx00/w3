'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Message, Conversation } from '@/lib/types';

interface ChatWindowProps {
    conversation: Conversation;
    currentUserId: string;
}

export default function ChatWindow({ conversation, currentUserId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const otherParticipantId = conversation.participants.find(p => p !== currentUserId);
    const otherParticipant = otherParticipantId ? conversation.participantDetails[otherParticipantId] : null;

    useEffect(() => {
        if (!conversation.id) return;

        const messagesRef = collection(db, 'conversations', conversation.id, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
            setLoading(false);
            
            // Mark as read when messages are loaded
            if (conversation.unreadCount[currentUserId] > 0) {
                setDoc(doc(db, 'conversations', conversation.id), {
                    unreadCount: {
                        [currentUserId]: 0
                    }
                }, { merge: true }).catch(console.error);
            }
        }, () => { setLoading(false); /* suppress Firestore auth error with Privy */ });

        return () => unsubscribe();
    }, [conversation.id, currentUserId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const text = newMessage.trim();
        setNewMessage('');

        try {
            await addDoc(collection(db, 'conversations', conversation.id, 'messages'), {
                senderId: currentUserId,
                text,
                createdAt: serverTimestamp()
            });

            // Update last message in conversation
            await setDoc(doc(db, 'conversations', conversation.id), {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
                unreadCount: {
                    [otherParticipantId!]: (conversation.unreadCount[otherParticipantId!] || 0) + 1
                }
            }, { merge: true });

        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary text-xs overflow-hidden">
                        {otherParticipant?.photoUrl ? (
                            <img src={otherParticipant.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            (otherParticipant?.displayName || 'U').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm flex items-center gap-1.5">
                            {otherParticipant?.displayName || 'Anonymous'}
                            <ShieldCheck className="w-3 h-3 text-accent-primary" />
                        </h3>
                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">@{otherParticipant?.username || 'user'}</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
                {/* Scam Warning */}
                <div className="p-4 bg-accent-warning/5 border border-accent-warning/20 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
                    <div className="w-8 h-8 rounded-full bg-accent-warning/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-accent-warning" />
                    </div>
                    <p className="text-[10px] text-accent-warning font-medium leading-relaxed">
                        <span className="font-black uppercase tracking-widest">Security Alert:</span> Please be careful with whom you're talking to. W3Hub is a neutral platform and is <span className="underline">not responsible</span> for any losses or scams. Never share your private keys or seed phrases with anyone, including Founders.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
                        <MessageSquare className="w-12 h-12 mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] space-y-1`}>
                                    <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                                        isMine 
                                            ? 'bg-accent-primary text-white rounded-tr-none shadow-lg shadow-accent-primary/10' 
                                            : 'bg-white/5 border border-white/5 text-foreground/80 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest opacity-30 ${isMine ? 'text-right' : 'text-left'}`}>
                                        {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-white/5">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 glass bg-black/20 border-white/10 px-5 py-3 rounded-xl text-sm font-medium focus:border-accent-primary/50 outline-none transition-all"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() || sending}
                        className="w-12 h-12 rounded-xl bg-accent-primary text-white flex items-center justify-center hover:bg-accent-secondary transition-all disabled:opacity-50 active:scale-95"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
