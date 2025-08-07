// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

import { db } from './db/index.js'; // Use .js extension for ESM
import { conversations, messages } from './db/schema.js'; // Use .js extension for ESM
import { eq, desc, asc } from 'drizzle-orm';

dotenv.config();

// --- OpenAI Client Initialization ---
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in the environment variables');
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = process.env.PORT || 8080;

const corsOptions = {
  origin: 'https://office-gpt-prod.web.app', // <-- This is the correct URL
  optionsSuccessStatus: 200
};
// This tells Express to first handle the OPTIONS request for all routes
app.options('*', cors(corsOptions)); 

// Then, use the CORS policy for all other requests
app.use(cors(corsOptions));

app.use(express.json());

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// GET all conversations for a user
app.get('/api/conversations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userConversations = await db.select({
        id: conversations.id,
        title: conversations.title,
    })
      .from(conversations)
      .where(eq(conversations.userId, parseInt(userId)))
      .orderBy(desc(conversations.createdAt));
    res.json(userConversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET a single conversation with its messages - THIS ENDPOINT IS NOW CORRECTED
app.get('/api/conversations/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const convId = parseInt(id);

        // Corrected Drizzle query to fetch a conversation and its related messages
        const conversation = await db.query.conversations.findFirst({
            where: eq(conversations.id, convId),
            with: {
                messages: {
                    orderBy: [asc(messages.createdAt)], // Order messages by creation time
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json(conversation);
    } catch (error) {
        console.error('Failed to fetch conversation detail:', error);
        res.status(500).json({ error: 'Failed to fetch conversation detail' });
    }
});

// POST to create a new, EMPTY conversation
app.post('/api/conversations', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const newConversation = await db.insert(conversations).values({
            userId,
            title: "New Conversation", // Placeholder title
            model: 'openai-gpt-4',
        }).returning({ id: conversations.id });

        res.status(201).json({ id: newConversation[0].id });
    } catch (error) {
        console.error('Failed to create empty conversation:', error);
        res.status(500).json({ error: 'Failed to create empty conversation' });
    }   
});

// POST to continue a conversation (and auto-title if it's the first message)
app.post('/api/chat', async (req, res) => {
    const { conversationId, message } = req.body;

    try {
        // --- START: ADDED LOGIC ---
        // Check if this is the first real message being added to the conversation.
        const existingMessages = await db.query.messages.findMany({
            where: eq(messages.conversationId, conversationId),
            limit: 1, // We only need to know if at least one message exists
        });

        // If no messages exist yet, this is the first message.
        // We will generate a title from it and update the conversation.
        if (existingMessages.length === 0) {
            const newTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            await db.update(conversations)
                .set({ title: newTitle })
                .where(eq(conversations.id, conversationId));
        }
        // --- END: ADDED LOGIC ---

        // 1. Save the user's new message (This part is the same as before)
        await db.insert(messages).values({
            conversationId,
            content: message,
            role: 'user',
        });

        // 2. Get the last 10 messages for context (This part is the same as before)
        const recentMessages = await db.query.messages.findMany({
            where: eq(messages.conversationId, conversationId),
            orderBy: desc(messages.createdAt),
            limit: 10,
        });

        const formattedContext = recentMessages.reverse().map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        }));

        // 3. Call OpenAI for a new response (This part is the same as before)
        const chatCompletion = await openai.chat.completions.create({
            messages: formattedContext,
            model: 'gpt-4o',
        });

        const aiResponseContent = chatCompletion.choices[0].message.content || "I couldn't generate a response.";

        // 4. Save the AI's new response (This part is the same as before)
        const newAiMessage = await db.insert(messages).values({
            conversationId,
            content: aiResponseContent,
            role: 'assistant',
        }).returning();

        res.json(newAiMessage[0]);

    } catch (error) {
        console.error('Failed to process chat message:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

// DELETE a conversation
app.delete('/api/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const convId = parseInt(id);

        await db.delete(conversations).where(eq(conversations.id, convId));

        res.status(200).json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Failed to delete conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// --- ADD this endpoint for updating titles ---
app.put('/api/conversations/:id', async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: "title is required" });
    }

    try {
        await db.update(conversations)
            .set({ title })
            .where(eq(conversations.id, parseInt(id)));

        res.status(200).json({ message: "Title updated successfully" });
    } catch (error) {
        console.error('Failed to update title:', error);
        res.status(500).json({ error: 'Failed to update title' });
    }
});