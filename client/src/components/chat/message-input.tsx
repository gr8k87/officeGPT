import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { chatApi } from "@/lib/chat-api";
import { Loader2, Send } from "lucide-react";

interface MessageInputProps {
  conversationId: number | null;
  selectedModel: string;
  onConversationCreated: (id: number) => void;
}

export default function MessageInput({ conversationId, selectedModel, onConversationCreated }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID - in a real app this would come from authentication
  const userId = 1;

  const createConversation = useMutation({
    mutationFn: async (title: string) => {
      return await chatApi.createConversation({
        userId,
        title,
      });
    },
    onSuccess: (data) => {
      onConversationCreated(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content, model }: { conversationId: number; content: string; model: string }) => {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/analyze-query", {
        conversationId,
        content,
        model,
      });
      return await response.json();
    },
    onSuccess: () => {
      setMessage("");
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      // Invalidate conversations and current conversation
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations/detail', conversationId] });
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    try {
      let currentConversationId = conversationId;

      // Create new conversation if none exists
      if (!currentConversationId) {
        const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
        const newConversation = await createConversation.mutateAsync(title);
        currentConversationId = newConversation.id;
      }

      // Send message
      await sendMessage.mutateAsync({
        conversationId: currentConversationId,
        content: message,
        model: selectedModel,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  return (
    <div className="bg-[hsl(var(--office-sidebar))] border-t border-[hsl(var(--office-border))] p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              className="min-h-[60px] max-h-[200px] resize-none bg-[hsl(var(--office-dark))] border-[hsl(var(--office-border))] text-[hsl(var(--office-text))] placeholder:text-[hsl(var(--office-text-secondary))] focus:border-[hsl(var(--office-accent))] pr-12"
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3">
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || isLoading}
                className="bg-[hsl(var(--office-accent))] hover:bg-[hsl(var(--office-accent))]/90 text-white rounded-lg px-3 py-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (

  const createConversation = useMutation({
    mutationFn: async ({ title, model }: { title: string; model: string }) => {
      const response = await apiRequest("POST", "/api/conversations", {
        title,
        userId,
        model,
      });
      return await response.json();
    },
    onSuccess: (newConversation) => {
      onConversationCreated(newConversation.id);
      // Send the message to the new conversation
      sendMessage.mutate({
        conversationId: newConversation.id,
        content: message,
        model: selectedModel,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (!message.trim() || sendMessage.isPending || createConversation.isPending) return;

    setIsLoading(true);

    try {
      if (conversationId) {
        // Send to existing conversation
        await sendMessage.mutateAsync({
          conversationId,
          content: message,
          model: selectedModel,
        });
      } else {
        // Create new conversation
        const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
        await createConversation.mutateAsync({
          title,
          model: selectedModel,
        });
      }
    } catch (error) {
      // Error handling is done in mutation onError
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
  };

  return (
    <div className="border-t border-[hsl(var(--office-border))] bg-[hsl(var(--office-dark))]">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="relative">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask OfficeGPT anything..."
                className="w-full bg-[hsl(var(--office-sidebar))] border-[hsl(var(--office-border))] rounded-xl px-4 py-3 pr-16 text-[hsl(var(--office-text))] placeholder-[hsl(var(--office-text-secondary))] resize-none focus:ring-2 focus:ring-[hsl(var(--office-accent))] focus:border-transparent min-h-[44px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
              
              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || isLoading}
                className="absolute right-2 bottom-2 w-8 h-8 bg-[hsl(var(--office-accent))] hover:bg-[hsl(var(--office-accent))]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors duration-200 p-0"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-[hsl(var(--office-text-secondary))]">
            <div className="flex items-center space-x-4">
              <span>Press <kbd className="px-1 py-0.5 bg-[hsl(var(--office-sidebar))] border border-[hsl(var(--office-border))] rounded">⏎</kbd> to send, <kbd className="px-1 py-0.5 bg-[hsl(var(--office-sidebar))] border border-[hsl(var(--office-border))] rounded">Shift ⏎</kbd> for new line</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{message.length}</span>
              <span>/</span>
              <span>4000</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
  );
}
