"use server";

import { sendSlackNotification } from "@/actions/slack-feedback-notifications";
import prisma from "@/db";

// --- CREATE FEEDBACK ---
export async function createFeedback(
  data: { title: string; text: string; type: string; url: string },
  userId: string | undefined,
) {
  if (userId === undefined) {
    return { success: false, error: "user is undefined" };
  }
  try {
    console.log(data);
    const newFeedback = await prisma.feedback.create({
      data: {
        title: data.title,
        text: data.text,
        type: data.type,
        url: data.url,
        votes: 0,
        upvotedBy: [userId], // Automatically counts the creator's upvote
      },
    });

    try {
      await sendSlackNotification(data);
    } catch (error) {
      console.error("failed to post to slack", error);
      return { success: false, data: newFeedback };
    }

    return { success: true, data: newFeedback };
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return { success: false, error: "Failed to create feedback" };
  }
}

// --- FETCH FEEDBACK ---
export async function fetchFeedback() {
  try {
    // Fetches all feedback, ordering by newest first
    const feedbackList = await prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: feedbackList };
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return { success: false, error: "Failed to fetch feedback records" };
  }
}

// --- UPVOTE FEEDBACK ---
export async function upvoteUpdate(feedbackId: string, userId: string) {
  if (!userId) {
    return { success: false, error: "You must be logged in to upvote." };
  }

  try {
    // 1. Fetch the specific feedback record
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return { success: false, error: "Feedback not found." };
    }

    // 2. Check if the user has already upvoted
    if (feedback.upvotedBy.includes(userId)) {
      return { success: false, error: "You have already upvoted this post." };
    }

    // 3. Atomically update the record: increment votes AND add the userId to the array
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        votes: { increment: 1 },
        upvotedBy: { push: userId },
      },
    });

    return { success: true, data: updatedFeedback };
  } catch (error) {
    console.error("Failed to upvote feedback:", error);
    return { success: false, error: "An error occurred while upvoting." };
  }
}
