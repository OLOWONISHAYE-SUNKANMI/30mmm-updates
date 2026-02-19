"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentUserWithProgress,
  updateUserProgress,
} from "@/actions/dashboard";
import { initialWeekStaticInfo } from "@/contexts/dashboard/dashboard-data";
import { useAuth } from "@/contexts/AuthContext";

const DashboardContext = createContext(undefined);

export default function DashboardProvider({ children }) {
  // Initialize with null to avoid hydration issues
  const [userInfo, setUserInfo] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const weekStaticInfo = initialWeekStaticInfo;
  const { authState } = useAuth();

  // Fetch user progress after hydration
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      fetchUserProgress();
    } else if (!authState.isAuthenticated) {
      setUserInfo(null);
      setUserProgress(null);
      setLoading(false);
      setError(null);
    }
  }, [authState.isAuthenticated, authState.user]);

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getCurrentUserWithProgress();

      if (!result.success) {
        // If not authenticated, silently set to unauthenticated state
        if (result.error === "Not authenticated") {
          setUserInfo(null);
          setUserProgress(null);
          setLoading(false);
          return;
        }
        throw new Error(result.error || "Failed to get user data");
      }

      const { user, progress } = result;

      // Set user info
      setUserInfo({
        name: user.name || "User",
        email: user.email,
        image: user.image,
        cohort: progress?.cohortNumber || 1,
        cohortRoman: progress?.cohortRoman || "I",
      });

      // Set progress info with proper null safety and defaults
      if (progress) {
        setUserProgress({

          currentWeek: progress.currentWeek,
          currentDay: progress.currentDay,
          currentDayTitle: progress.currentDayTitle || "Day 1",
          currentWeekTitle: progress.currentWeekTitle || "Week 1",
          currentDevotionalID: progress.currentDevotionalId || null,
          startDate: new Date(progress.startDate), // Parse ISO string back to Date
          daysCompleted: {
            totalDays: progress.totalCompleted ?? 0,
            week1: progress.daysCompleted?.week1 ?? 0,
            week2: progress.daysCompleted?.week2 ?? 0,
            week3: progress.daysCompleted?.week3 ?? 0,
            week4: progress.daysCompleted?.week4 ?? 0,
            week5: progress.daysCompleted?.week5 ?? 0,
          },
        });
      } else {
        // Set default progress if none exists
        setUserProgress({
          currentWeek: 1,
          currentDay: 1,
          currentDayTitle: "Day 1",
          currentWeekTitle: "Week 1",
          startDate: new Date(),
          daysCompleted: {
            totalDays: 0,
            week1: 0,
            week2: 0,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        });
        console.log("DashboardProvider - using default progress");
      }
    } catch (err) {
      console.error("Error fetching user progress:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Method to update progress after completing a devotional
  const updateProgress = async (week, day) => {
    try {
      // Calculate devotional ID from week and day
      const devotionalId = (week - 1) * 7 + day;

      // Call the server action instead of API route
      const result = await updateUserProgress(devotionalId);

      if (!result.success) {
        throw new Error(result.error || "Failed to update progress");
      }

      // Refresh progress data
      await fetchUserProgress();

      return result.progress;
    } catch (err) {
      console.error("Error updating progress:", err);
      throw err;
    }
  };

  // Method to refresh progress data
  const refreshProgress = () => {
    return fetchUserProgress();
  };

  const value = {
    userInfo,
    setUserInfo,
    userProgress,
    setUserProgress,
    weekStaticInfo,
    loading: loading || authState.loading,
    error,
    updateProgress,
    refreshProgress,
    isAuthenticated: authState.isAuthenticated,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);

  if (context === undefined) {
    throw new Error(
      "useDashboardContext must be used within the DashboardProvider",
    );
  }
  return context;
}