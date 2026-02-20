"use server";

// Note: Ensure you have a global Prisma client instantiated somewhere in your project.
// If you don't have a lib/prisma.ts file yet, you can import { PrismaClient } from '@prisma/client'
// and instantiate it here for testing, but a global instance is recommended for Next.js.
import prisma from "@/db";

export async function createFeedback(data: {
  title: string;
  text: string;
  type: string;
}) {
  try {
    const newFeedback = await prisma.feedback.create({
      data: {
        title: data.title,
        text: data.text,
        type: data.type,
        votes: 1, // Defaulting to 1 vote upon creation
      },
    });

    // Return the newly created document so the frontend can update its state
    return { success: true, data: newFeedback };
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return { success: false, error: "Failed to create feedback" };
  }
}
