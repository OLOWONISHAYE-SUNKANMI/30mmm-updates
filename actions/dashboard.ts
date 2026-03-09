"use server";

import prisma from "@/db";
import { getUser as getServerUser } from "@/lib/session";
import {
  FormattedUserProgress,
  formatUserProgressResponse,
} from "@/lib/user-progress-utility";

export async function getCurrentUserWithProgress() {
  try {
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has progress, create if not
    let userProgress = (user as any).userProgress;

    if (!userProgress) {
      console.log("Creating initial UserProgress for user:", (user as any).id);
      userProgress = await prisma.userProgress.create({
        data: {
          userId: (user as any).id,
          cohortNumber: 1,
          cohortRoman: "I",
          currentWeek: 1,
          currentDay: 1,
          week1Completed: 0,
          week2Completed: 0,
          week3Completed: 0,
          week4Completed: 0,
          week5Completed: 0,
        },
      });
    }
    let formattedProgress: FormattedUserProgress = {
      currentWeek: 0,
      currentDay: 0,
      currentDayTitle: "",
      currentWeekTitle: "",
      cohortNumber: 0,
      cohortRoman: "",
      startDate: new Date(),
      daysCompleted: {
        week1: 0,
        week2: 0,
        week3: 0,
        week4: 0,
        week5: 0,
      },
      totalCompleted: 0,
      devotional: null,
    };

    // If user has progress, format it
    if (userProgress) {
      // Calculate relative day from cumulative currentDay (1-35)
      const relativeDay = ((userProgress.currentDay - 1) % 7) + 1;

      // Fetch the current devotional from MongoDB
      const currentDevotional = await prisma.devotional.findFirst({
        where: {
          week: userProgress.currentWeek,
          day: relativeDay,
        },
      });

      if (!currentDevotional) {
        console.warn(
          `Devotional not found for Week ${userProgress.currentWeek}, Day ${userProgress.currentDay}`,
        );
      }

      // AWAIT the formatUserProgressResponse since it's async
      formattedProgress = await formatUserProgressResponse(
        userProgress,
        currentDevotional,
      );
    }

    // Return plain serializable data
    return {
      success: true,
      user: {
        id: (user as any).id,
        name: (user as any).name,
        firstName: (user as any).userProfile?.firstName || "",
        lastName: (user as any).userProfile?.lastName || "",
        email: (user as any).email,
        role: (user as any).role,
        image: (user as any).image,
        profileCompleted: (user as any).profileCompleted,
      },
      progress: formattedProgress
        ? {
          currentWeek: formattedProgress.currentWeek,
          currentDay: formattedProgress.currentDay,
          currentWeekTitle: formattedProgress.currentWeekTitle,
          currentDayTitle: formattedProgress.currentDayTitle,
          cohortNumber: formattedProgress.cohortNumber,
          cohortRoman: formattedProgress.cohortRoman,
          startDate: formattedProgress.startDate.toISOString(),
          daysCompleted: formattedProgress.daysCompleted,
          totalCompleted: formattedProgress.totalCompleted,
          devotional: formattedProgress.devotional,
          currentDevotionalId:
            formattedProgress.devotional?.id?.toString() || null, // Add optional chaining
        }
        : null,
    };
  } catch (error) {
    console.error("Error in getCurrentUserWithProgress action:", error);
    return { success: false, error: "Failed to fetch user data" };
  }
}

export async function updateUserProgress(devotionalId: string) {
  try {
    const user = await getServerUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get current progress
    const progress = await prisma.userProgress.findUnique({
      where: { userId: (user as any).id },
    });

    if (!progress) {
      return { success: false, error: "User progress not found" };
    }

    // Validate sequential access
    const devotional = await prisma.devotional.findUnique({
      where: { id: devotionalId },
    });

    if (!devotional) {
      return { success: false, error: "Devotional not found" };
    }

    // Check if user is on correct day
    if (
      devotional.week !== progress.currentWeek ||
      devotional.day !== progress.currentDay
    ) {
      return { success: false, error: "Cannot skip ahead in program" };
    }

    // Calculate days since start for time-based access control
    const daysSinceStart = Math.floor(
      (Date.now() - progress.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (
      daysSinceStart <
      (progress.currentWeek - 1) * 7 + progress.currentDay - 1
    ) {
      return { success: false, error: "Content not yet available" };
    }

    // Update completion count for current week
    const weekField =
      `week${progress.currentWeek}Completed` as keyof typeof progress;
    const currentWeekCompleted = (progress[weekField] as number) + 1;

    // Determine next position
    let nextWeek = progress.currentWeek;
    let nextDay = progress.currentDay + 1;

    if (nextDay > 7) {
      nextWeek++;
      nextDay = 1;
    }

    // Update progress
    const updated = await prisma.userProgress.update({
      where: { userId: (user as any).id },
      data: {
        [weekField]: currentWeekCompleted,
        currentWeek: nextWeek > 5 ? progress.currentWeek : nextWeek,
        currentDay: nextWeek > 5 ? progress.currentDay : nextDay,
        updatedAt: new Date(),
      },
    });

    return { success: true, progress: updated };
  } catch (error) {
    console.error("Error updating user progress:", error);
    return { success: false, error: "Failed to update progress" };
  }
}
