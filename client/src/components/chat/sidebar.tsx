import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conversation } from "@shared/schema";

interface SidebarProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  currentConversationId: number | null;
  onConversationSelect: (id: number) => void;
  onNewChat: () => void;
  onToggle: () => void;
}

export default function Sidebar({
  selectedModel,
  onModelChange,
  currentConversationId,
  onConversationSelect,
  onNewChat,
  onToggle,
}: SidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID - in a real app this would come from authentication
  const userId = 1;

  // Query conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations', userId],
  });

  // Delete conversation mutation
  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConversation = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteConversation.mutate(id);
    if (currentConversationId === id) {
      onNewChat();
    }
  };

  return (
    <div className="w-full h-full bg-[hsl(var(--office-sidebar))] border-r border-[hsl(var(--office-border))] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--office-border))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[hsl(var(--office-accent))] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-[hsl(var(--office-text))]">OfficeGPT</h1>
          </div>
          <button 
            onClick={onToggle}
            className="lg:hidden text-[hsl(var(--office-text-secondary))] hover:text-[hsl(var(--office-text))] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <Button
          onClick={onNewChat}
          className="w-full bg-[hsl(var(--office-accent))] hover:bg-[hsl(var(--office-accent))]/90 text-white rounded-lg px-4 py-2.5 font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </Button>
      </div>
      
      {/* Model Selector */}
      <div className="p-4 border-b border-[hsl(var(--office-border))]">
        <label className="block text-sm font-medium text-[hsl(var(--office-text-secondary))] mb-2">AI Model</label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full bg-[hsl(var(--office-dark))] border-[hsl(var(--office-border))] text-[hsl(var(--office-text))]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(var(--office-sidebar))] border-[hsl(var(--office-border))]">
            <SelectItem value="gpt-4" className="text-[hsl(var(--office-text))] focus:bg-[hsl(var(--office-dark))]">GPT-4 (Most Capable)</SelectItem>
            <SelectItem value="gpt-3.5-turbo" className="text-[hsl(var(--office-text))] focus:bg-[hsl(var(--office-dark))]">GPT-3.5 Turbo (Faster)</SelectItem>
            <SelectItem value="gemini-pro" className="text-[hsl(var(--office-text))] focus:bg-[hsl(var(--office-dark))]">Gemini Pro (Google)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full office-scrollbar">
          <div className="p-2">
            <div className="text-xs font-medium text-[hsl(var(--office-text-secondary))] uppercase tracking-wide px-3 py-2">Recent</div>
            
            {conversations.length === 0 ? (
              <div className="px-3 py-8 text-center text-[hsl(var(--office-text-secondary))] text-sm">
                No conversations yet
              </div>
            ) : (
              conversations.map((conversation) => (
                <div key={conversation.id} className="mb-1">
                  <button
                    onClick={() => onConversationSelect(conversation.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150 group ${
                      currentConversationId === conversation.id
                        ? 'bg-[hsl(var(--office-dark))] text-[hsl(var(--office-text))]'
                        : 'hover:bg-[hsl(var(--office-dark))] text-[hsl(var(--office-text-secondary))]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{conversation.title}</div>
                        <div className="text-xs text-[hsl(var(--office-text-secondary))] truncate mt-0.5">
                          {conversation.model} • {new Date(conversation.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDeleteConversation(e, conversation.id)}
                          className="text-[hsl(var(--office-text-secondary))] hover:text-red-400 p-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-[hsl(var(--office-border))]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[hsl(var(--office-text))]">Workplace User</div>
            <div className="text-xs text-[hsl(var(--office-text-secondary))]">Connected via proxy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
