// server/src/db/seed.ts
import { db } from './index.js';
import { users } from './schema.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log("Seeding the database...");

  try {
    // Check if the user already exists to prevent errors on re-running
    const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, 1),
    });

    if (existingUser) {
        console.log("User with ID 1 already exists. Seeding not required.");
        return;
    }

    const passwordHash = await bcrypt.hash("password123", 10);
    
    await db.insert(users).values({
      id: 1, // We explicitly set the ID to 1
      username: 'testuser',
      passwordHash,
      role: 'admin',
    });

    console.log("Database seeded successfully with user ID 1!");
  } catch (error) {
    console.error("Error seeding the database:", error);
    process.exit(1);
  }
}

seed().finally(() => {
  process.exit();
});