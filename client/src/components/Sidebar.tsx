// client/src/components/Sidebar.tsx

import React from 'react'; // Added React import for safety
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/hooks/use-toast';
import type { Conversation } from '../../../shared/types';

// API function to fetch conversations
const fetchConversations = async (): Promise<Conversation[]> => {
    const { data } = await axios.get('/api/conversations/user/1');
    return data;
};

// API function to create an empty conversation
const createEmptyConversation = async (): Promise<{ id: number }> => {
    const { data } = await axios.post('/api/conversations', { userId: 1 });
    return data;
};

// API function to delete a conversation
const deleteConversation = async (id: number): Promise<void> => {
    await axios.delete(`/api/conversations/${id}`);
};

const Sidebar = () => {
    const queryClient = useQueryClient();
    const [location, setLocation] = useLocation();

    // --- THIS IS THE FIX ---
    // The queryKey was accidentally duplicated. This is the corrected version.
    const { data: conversations, isLoading, error } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
    });

    const newChatMutation = useMutation({
        mutationFn: createEmptyConversation,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            setLocation(`/c/${data.id}`);
        },
        onError: () => {
            toast({ title: "Error", description: "Could not create a new chat.", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteConversation,
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast({ title: "Conversation deleted." });
            if (location === `/c/${deletedId}`) {
                setLocation('/');
            }
        },
        onError: () => {
            toast({ title: "Error", description: "Could not delete conversation.", variant: "destructive" });
        }
    });

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this conversation?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <aside className="w-full max-w-xs flex flex-col p-4 border-r border-border bg-muted/20">
            <Button onClick={() => newChatMutation.mutate()} disabled={newChatMutation.isPending} variant="outline" className="w-full mb-4">
                {newChatMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                New Chat
            </Button>
            <ScrollArea className="flex-1">
                <nav className="space-y-1 pr-2">
                    {isLoading && <p className="p-2 text-sm text-muted-foreground">Loading...</p>}
                    {error && <p className="p-2 text-sm text-destructive">Failed to load</p>}
                    {conversations?.map((conv) => (
                        <Link key={conv.id} href={`/c/${conv.id}`}>
                            <a className={cn('group flex items-center justify-between p-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground', location === `/c/${conv.id}` && 'bg-accent text-accent-foreground')}>
                                <span className="truncate flex-1">{conv.title}</span>
                                <Button
                                    onClick={(e) => handleDelete(e, conv.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={deleteMutation.isPending && deleteMutation.variables === conv.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </a>
                        </Link>
                    ))}
                </nav>
            </ScrollArea>
            <div className="mt-auto">
                <p className="text-xs text-center text-muted-foreground">User Settings</p>
            </div>
        </aside>
    );
};

export default Sidebar;