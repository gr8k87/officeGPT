import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI and Gemini clients
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// For Gemini, we'll use fetch API since Google AI SDK might not be available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "default_key";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all conversations for a user
  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific conversation with messages
  app.get("/api/conversations/detail/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteConversation(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update conversation title
  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title } = req.body;
      await storage.updateConversationTitle(id, title);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Send message and get AI response
  app.post("/api/chat", async (req, res) => {
    try {
      const { conversationId, content, model } = req.body;

      if (!conversationId || !content || !model) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content,
      });

      // Get conversation context
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Prepare messages for AI API
      const apiMessages = conversation.messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      let aiResponse: string;

      try {
        if (model.startsWith("gpt")) {
          // OpenAI API call
          const response = await openai.chat.completions.create({
            model: model === "gpt-4" ? "gpt-4o" : model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: apiMessages,
            max_tokens: 2000,
            temperature: 0.7,
          });

          aiResponse = response.choices[0].message.content || "Sorry, I couldn't generate a response.";
        } else if (model === "gemini-pro") {
          // Gemini API call using fetch
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: apiMessages.map(msg => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
              })),
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
              },
            }),
          });

          if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
          }

          const geminiData = await geminiResponse.json();
          aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
        } else {
          throw new Error("Unsupported model");
        }
      } catch (apiError: any) {
        console.error("AI API Error:", apiError);
        return res.status(500).json({ 
          message: `AI service error: ${apiError.message}. Please check your API keys and try again.` 
        });
      }

      // Save AI response
      const assistantMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
        model,
      });

      // Update conversation title if it's the first exchange
      if (conversation.messages.length === 1) {
        const title = content.length > 50 ? content.substring(0, 50) + "..." : content;
        await storage.updateConversationTitle(conversationId, title);
      }

      res.json({
        userMessage,
        assistantMessage,
      });

    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
