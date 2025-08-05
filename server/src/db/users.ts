// server/src/db/users.ts
import { db } from './index'; // We will create this index file next
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Note: In a real app, you'd have more robust user creation logic
// This is a placeholder for the admin module.
export async function createUser(username: string, plainTextPassword: string) {
  const passwordHash = await bcrypt.hash(plainTextPassword, 10);
  const newUser = await db.insert(users).values({
    username,
    passwordHash,
    role: 'admin', // First user can be an admin
  }).returning({ id: users.id, username: users.username });
  return newUser[0];
}

export async function findUserByUsername(username: string) {
  const user = await db.select().from(users).where(eq(users.username, username));
  return user[0];
}
