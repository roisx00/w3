'use client';

import { useState } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { TalentProfile } from '@/lib/types';

interface StartConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: TalentProfile;
    currentUser: TalentProfile;
    onSuccess?: (conversationId: string) => void;
}

export default function StartConversationModal({ isOpen, onClose, recipient, currentUser, onSuccess }: StartConversationModalProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || sending) return;

        setSending(true);
        try {
            // 1. Check if conversation already exists
            const convsRef = collection(db, 'conversations');
            const q = query(
                convsRef, 
                where('participants', 'array-contains', currentUser.id)
            );
            const snap = await getDocs(q);
            let existingConvId = '';
            
            snap.forEach(doc => {
                const data = doc.data();
                if (data.participants.includes(recipient.id)) {
                    existingConvId = doc.id;
                }
            });

            let convId = existingConvId;

            if (!convId) {
                // 2. Create new conversation if none exists
                const newConvRef = doc(collection(db, 'conversations'));
                convId = newConvRef.id;
                
                await setDoc(newConvRef, {
                    participants: [currentUser.id, recipient.id],
                    participantDetails: {
                        [currentUser.id]: {
                            displayName: currentUser.displayName,
                            photoUrl: currentUser.photoUrl || '',
                            username: currentUser.username
                        },
                        [recipient.id]: {
                            displayName: recipient.displayName,
                            photoUrl: recipient.photoUrl || '',
                            username: recipient.username
                        }
                    },
                    lastMessage: message,
                    lastMessageAt: serverTimestamp(),
                    unreadCount: {
                        [recipient.id]: 1,
                        [currentUser.id]: 0
                    }
                });
            } else {
                // Update existing conversation
                await setDoc(doc(db, 'conversations', convId), {
                    lastMessage: message,
                    lastMessageAt: serverTimestamp(),
                    [`unreadCount.${recipient.id}`]: 1 // Simplified: increment would be better but requires more logic
                }, { merge: true });
            }

            // 3. Add message to the conversation's subcollection
            await addDoc(collection(db, 'conversations', convId, 'messages'), {
                senderId: currentUser.id,
                text: message,
                createdAt: serverTimestamp()
            });

            setMessage('');
            onClose();
            if (onSuccess) onSuccess(convId);
        } catch (err) {
            console.error('Error starting conversation:', err);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg glass border-white/10 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-foreground/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div>
                        <h2 className="font-display font-black text-2xl uppercase tracking-tight">Slide into DM</h2>
                        <p className="text-sm text-foreground/40 font-medium">Starting conversation with <span className="text-white">@{recipient.username}</span></p>
                    </div>
                </div>

                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Your Message</label>
                        <textarea
                            autoFocus
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Hey! I love your work. Are you available for a project?"
                            rows={4}
                            className="w-full glass bg-white/5 border-white/10 rounded-2xl p-5 text-sm font-medium focus:border-accent-primary/50 outline-none transition-all resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!message.trim() || sending}
                        className="w-full py-4 bg-accent-primary text-white font-black rounded-xl hover:bg-accent-secondary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent-primary/20 disabled:opacity-50 disabled:scale-100"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {sending ? 'Sending...' : 'Send Message'}
                    </button>
                    
                    <p className="text-center text-[10px] text-foreground/20 font-bold uppercase tracking-widest">
                        Talent will receive a notification in their dashboard
                    </p>
                </form>
            </div>
        </div>
    );
}
