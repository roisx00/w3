'use client';

import { Conversation } from '@/lib/types';
import { MessageSquare, Clock } from 'lucide-react';

interface ConversationListProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    currentUserId: string;
}

export default function ConversationList({ conversations, activeId, onSelect, currentUserId }: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-foreground/20">
                    <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-display font-black text-xl uppercase tracking-tight mb-2">No Messages</h3>
                <p className="text-sm text-foreground/40 font-medium leading-relaxed">
                    Start a conversation with a Talent or Founder to see it here.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-white/5">
            {conversations.map((conv) => {
                const otherParticipantId = conv.participants.find(p => p !== currentUserId);
                const otherParticipant = otherParticipantId ? conv.participantDetails[otherParticipantId] : null;
                const unreadCount = conv.unreadCount[currentUserId] || 0;
                const isActive = activeId === conv.id;

                return (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`w-full p-5 flex items-start gap-4 transition-all hover:bg-white/5 text-left border-l-2 ${
                            isActive ? 'bg-white/5 border-accent-primary' : 'border-transparent'
                        }`}
                    >
                        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-bold text-accent-primary text-sm overflow-hidden shrink-0">
                            {otherParticipant?.photoUrl ? (
                                <img src={otherParticipant.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (otherParticipant?.displayName || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm truncate pr-2">
                                    {otherParticipant?.displayName || 'Anonymous'}
                                </h4>
                                {conv.lastMessageAt && (
                                    <span className="text-[9px] font-bold text-foreground/20 uppercase shrink-0 mt-0.5">
                                        {new Date(conv.lastMessageAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            
                            <p className={`text-xs truncate ${unreadCount > 0 ? 'text-white font-bold' : 'text-foreground/40 font-medium'}`}>
                                {conv.lastMessage || 'No messages yet'}
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center shrink-0 animate-in zoom-in duration-300">
                                <span className="text-[10px] font-black text-black">{unreadCount}</span>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
