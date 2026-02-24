"use client";

import { useEffect, useState } from "react";
import { getDevotionalById } from "@/actions/devotional";
import { getUserProgress } from "@/actions/user-progress";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { FaChevronDown } from "react-icons/fa";
import DonateHero from "@/components/Dashboard/DonateHero";
import { calculateWeekAndDay } from "@/lib/calculateWeekAndDay";
import CardSection from "./CardSection";
import OnboardingTour from "./OnboardingTour";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MainBody() {
  const { authState } = useAuth();
  const [userProgress, setUserProgress] = useState(null);
  const [currentDevotional, setCurrentDevotional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (authState.loading) {
        return;
      }

      if (!authState.isAuthenticated || !authState.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user progress
        const progressResult = await getUserProgress(authState.user.id);

        if (progressResult.success) {
          setUserProgress(progressResult.userProgress);

          // Fetch current devotional

          const totalDays = progressResult.userProgress.currentDay || 1;
          const { week: currentWeek, day: currentDay } =
            calculateWeekAndDay(totalDays);
          const devotionalId = `${currentWeek}-${currentDay}`;

          const devotionalResult = await getDevotionalById(devotionalId);

          if (devotionalResult.success) {
            setCurrentDevotional(devotionalResult.devotional);
          }
        } else {
          setError(progressResult.error);
        }
      } catch (error) {
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authState]);

  if (authState.loading || loading) {
    return (
      <div className="container relative flex size-full animate-pulse flex-col items-center justify-center rounded-lg border bg-white shadow-sm">
        <div className="mb-4 h-8 w-48 rounded bg-gray-200"></div>
        <div className="h-4 w-32 rounded bg-gray-200"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="container relative flex size-full flex-col items-center justify-center rounded-lg border bg-white shadow-sm">
        <p>Please log in to view your progress</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container relative flex size-full flex-col items-center justify-center rounded-lg border bg-white shadow-sm">
        <p className="text-red-600">Error loading progress: {error}</p>
      </div>
    );
  }

  if (!authState.user) {
    return (
      <div className="container relative flex size-full flex-col items-center justify-center rounded-lg border bg-white shadow-sm">
        <p>Session not available</p>
      </div>
    );
  }

  // Default values
  const cohortDisplay = userProgress?.cohortRoman || "I";
  const totalDays = userProgress?.currentDay || 1;
  const { week: currentWeek, day: currentDay } = calculateWeekAndDay(totalDays);
  const weekDisplay = currentWeek;
  const dayDisplay = currentDay;
  const devotionalTitle = currentDevotional?.dayTitle || "Loading...";

  // Create the devotional ID in the format "week-day"
  const devotionalId = `${weekDisplay}-${dayDisplay}`;

  return (
    <div className="relative mx-auto mb-4 2xs:mb-5 xs:mb-6 sm:mb-8 flex min-h-screen w-full max-w-[1200px] flex-col items-start gap-y-2 2xs:gap-y-3 xs:gap-y-4 sm:gap-y-5 space-y-2 2xs:space-y-3 xs:space-y-4 sm:space-y-4 pt-4 2xs:pt-6 xs:pt-8 sm:pt-12 px-1 2xs:px-2 xs:px-3 sm:px-4 max-lg:mx-2">
      <OnboardingTour />
      <div className="flex w-full flex-wrap items-center justify-start gap-1 2xs:gap-2 md:gap-y-5">
        <h1 className="text-lg 2xs:text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold leading-relaxed">
          Hello, {authState.user.name || "User"}!
        </h1>
        <button
          onClick={() => {
            localStorage.removeItem("onboarding_completed");
            window.location.reload();
          }}
          className="ml-2 text-xs text-gray-400 underline hover:text-gray-600 sm:ml-4"
        >
          Restart Tutorial
        </button>
        <FaChevronDown size={10} className="2xs:w-3 2xs:h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h2 className="week-day-subtitle w-full text-xs 2xs:text-sm xs:text-base font-normal text-gray-400">
                Today is{" "}
                <Link href={`/devotional/${devotionalId}`}>
                  <span className="font-semibold text-almost-black hover:underline">
                    Week {weekDisplay} Day {dayDisplay}: {devotionalTitle}
                  </span>
                </Link>
              </h2>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click here to view today's devotional</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <DonateHero />
      <div className="mr-auto w-full">
        <h4 className="clean-cohort-title text-lg 2xs:text-xl xs:text-2xl sm:text-3xl font-semibold leading-7 tracking-wider">
          CLEAN {cohortDisplay}
        </h4>
      </div>
      <div className="dashboard-card-section w-full">
        <CardSection userId={authState.user.id} />
      </div>
    </div>
  );
}
