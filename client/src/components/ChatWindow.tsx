// client/src/components/ChatWindow.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "@/components/hooks/use-toast";

// Import components and types
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Send, ArrowDownCircle, Pencil } from 'lucide-react';
import type { Conversation, Message } from '../../../shared/types';

// API functions
const fetchConversation = async (id: string): Promise<Conversation> => {
    const { data } = await axios.get(`/api/conversations/detail/${id}`);
    return data;
};
const postMessage = async (newMessage: { conversationId: number; message: string }): Promise<Message> => {
    const { data } = await axios.post('/api/chat', newMessage);
    return data;
};
const updateTitle = async ({ id, title }: { id: number; title: string }) => {
    await axios.put(`/api/conversations/${id}`, { title });
};

interface ChatWindowProps {
    conversationId: string;
}

const ChatWindow = ({ conversationId }: ChatWindowProps) => {
    const queryClient = useQueryClient();
    const [inputMessage, setInputMessage] = useState('');
    const viewportRef = useRef<HTMLDivElement>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");

    // --- THIS IS THE CORRECTED LINE ---
    const { data: conversation, isLoading, error } = useQuery<Conversation>({
        queryKey: ['conversation', conversationId],
        queryFn: () => fetchConversation(conversationId),
    });

    const chatMutation = useMutation({
        mutationFn: postMessage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
            // Also invalidate the main list to update the title if it was the first message
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: () => { /* ... error toast ... */ }
    });

    const titleMutation = useMutation({
        mutationFn: updateTitle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            setIsEditingTitle(false);
            toast({ title: "Title updated!" });
        },
        onError: () => { /* ... error toast ... */ }
    });

    useEffect(() => {
        if (conversation) {
            setEditedTitle(conversation.title);
        }
    }, [conversation]);
    
    useEffect(() => {
        const viewport = viewportRef.current;
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [conversation?.messages]);

    const handleTitleSave = () => {
        if (editedTitle.trim() && editedTitle !== conversation?.title) {
            titleMutation.mutate({ id: parseInt(conversationId), title: editedTitle });
        } else {
            setIsEditingTitle(false);
        }
    };
    
    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTitleSave();
        if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setEditedTitle(conversation?.title || "");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim() === '') return;
        chatMutation.mutate({ conversationId: parseInt(conversationId), message: inputMessage });
        setInputMessage('');
    };

    const handleScroll = () => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const isScrolledToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
        setShowScrollToBottom(!isScrolledToBottom);
    };

    const scrollToBottom = () => {
        viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    };

    if (isLoading) return <div className="p-6">Loading conversation...</div>;
    if (error) return <div className="p-6 text-destructive">Failed to load conversation.</div>;

    return (
        <div className="flex-1 flex flex-col h-full">
            <header className="p-4 border-b flex items-center group gap-2">
                {isEditingTitle ? (
                    <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        autoFocus
                        className="text-xl font-semibold tracking-tight h-9"
                    />
                ) : (
                    <>
                        <h2 className="text-xl font-semibold tracking-tight">{conversation?.title}</h2>
                        <Button onClick={() => setIsEditingTitle(true)} variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </header>
            
            <div className="flex-1 relative overflow-y-auto" onScroll={handleScroll} ref={viewportRef}>
                <div className="p-6 space-y-4">
                    {conversation?.messages.map((msg) => (
                        <Card key={msg.id} className={msg.role === 'user' ? 'bg-muted/50' : ''}>
                            <CardContent className="p-4">
                                <p className="font-semibold capitalize mb-2">{msg.role}</p>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {showScrollToBottom && (
                <Button onClick={scrollToBottom} variant="outline" size="icon" className="absolute bottom-20 right-6 h-10 w-10 rounded-full z-10">
                    <ArrowDownCircle className="h-5 w-5" />
                </Button>
            )}

            <div className="p-4 border-t bg-background mt-auto">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type your message..." className="flex-1" disabled={chatMutation.isPending} />
                    <Button type="submit" disabled={chatMutation.isPending}> <Send className="h-4 w-4" /> </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;