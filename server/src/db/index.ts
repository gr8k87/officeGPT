// server/src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });```

#### **3. Building the API Routes**

Now let's replace the content of our main server file with the actual API routes. We will structure them using `express.Router`.

**Update `server/src/index.ts`:**

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { conversations, messages } from './db/schema';
import { findUserByUsername } from './db/users'; // We'll add auth later
import { eq, desc } from 'drizzle-orm';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Get all conversations for a user (placeholder user for now)
app.get('/api/conversations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userConversations = await db.select()
      .from(conversations)
      .where(eq(conversations.userId, parseInt(userId)))
      .orderBy(desc(conversations.createdAt));
    res.json(userConversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a single conversation with its messages
app.get('/api/conversations/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const convId = parseInt(id);

        const conversation = await db.query.conversations.findFirst({
            where: eq(conversations.id, convId),
            with: {
                messages: {
                    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
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


// POST /api/chat - Send a message and get an AI response
app.post('/api/chat', async (req, res) => {
    const { conversationId, message, userId } = req.body;

    // TODO: AI Integration Logic will go here
    // For now, we will just echo the message back as the 'assistant'

    try {
        // 1. Save the user's message
        await db.insert(messages).values({
            conversationId,
            content: message,
            role: 'user',
        });

        // --- AI LOGIC WOULD BE HERE ---
        // You would call OpenAI or Gemini API here with the context
        const aiResponseContent = `This is a mocked AI response to: "${message}"`;
        // --- END AI LOGIC ---

        // 2. Save the AI's response
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


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
