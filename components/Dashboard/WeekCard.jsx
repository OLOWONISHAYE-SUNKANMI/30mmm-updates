"use client";

import React from "react";
import Link from "next/link";
import Link from "next/link";

export default function WeekCard({
  week,
  status,
  title,
  progress,
  daysCompleted,
  userProgress,
}) {
  // Determine status color based on status
  const getStatusColor = () => {
    switch (status) {
      case "Completed":
        return "bg-lime-500/20 text-lime-500";
      case "In Progress":
        return "bg-blue-500/20 text-blue-500";
      case "Upcoming":
        return "bg-gray-500/20 text-gray-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  // Function to determine the color of each progress bar
  // This handles three states: completed, current, and upcoming
  const getProgressBarColor = (index) => {
    // If this week is "In Progress" and this bar represents the current day
    // The current day is at index === daysCompleted - 1 because:
    // - If 2 days are completed (daysCompleted = 2), the current day is at index 1
    // - If 3 days are completed (daysCompleted = 3), the current day is at index 2
    if (status === "In Progress" && index === daysCompleted) {
      return "bg-primary-red";
    }

    // If this bar represents a completed day (any day before the current day)
    // For example, if daysCompleted = 3, then indices 0 and 1 are completed
    // But index 2 is the current day (handled above), not completed yet
    else if (index < daysCompleted) {
      return "bg-lime-500";
    }

    // For all other cases: upcoming days that haven't been reached yet
    // This includes all days in "Upcoming" weeks and future days in "In Progress" weeks
    else {
      return "bg-gray-300";
    }
  };

  // Create an array of 7 elements representing each day of the week
  // We'll use the indices to determine the color of each bar
  const progressBars = Array.from({ length: 7 });

  // Calculate the current day for this week
  const currentDay = status === "In Progress" ? daysCompleted + 1 : 1;
  const devotionalLink = `/devotional/${week}-${currentDay}`;

  return (
<<<<<<< HEAD
    <Link href={devotionalLink}>
      <div className="h-[180px] w-[200px] 2xs:h-[200px] 2xs:w-[220px] xs:h-[240px] xs:w-[260px] sm:h-[280px] sm:w-[300px] md:h-[290px] md:w-[320px] flex flex-col items-center justify-center rounded-xl 2xs:rounded-2xl sm:rounded-3xl bg-lesson-card bg-cover bg-center bg-no-repeat shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
        <div className="h-[100px] 2xs:h-[110px] xs:h-[130px] sm:h-[150px] md:h-[158px] w-full" />
        <div className="flex h-[80px] 2xs:h-[90px] xs:h-[110px] sm:h-[130px] md:h-[132px] w-full items-center justify-center rounded-bl-xl rounded-br-xl 2xs:rounded-bl-2xl 2xs:rounded-br-2xl sm:rounded-bl-3xl sm:rounded-br-3xl bg-white/95">
          <div className="flex h-[65px] 2xs:h-[75px] xs:h-[85px] sm:h-[90px] md:h-[86px] w-[180px] 2xs:w-[200px] xs:w-[240px] sm:w-[280px] md:w-[280px] flex-col justify-between py-2">
            <div className="flex w-full items-start justify-between">
              <div className="text-[8px] 2xs:text-[9px] xs:text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Week {week}
              </div>
              <div
                className={`flex h-[12px] 2xs:h-[14px] xs:h-[16px] sm:h-[18px] items-center justify-center rounded-lg 2xs:rounded-xl px-1.5 2xs:px-2 ${getStatusColor()}`}
              >
                <div className="text-[6px] 2xs:text-[7px] xs:text-[8px] font-medium uppercase">
                  {status}
                </div>
              </div>
            </div>
            <div className="text-xs 2xs:text-sm xs:text-base font-medium text-zinc-900 line-clamp-2">
              {title}
            </div>
            <div className="relative h-1 2xs:h-1.5 w-full">
              <div className="absolute inset-0 rounded-full bg-gray-200" />
              <div className="absolute inset-0 flex gap-0.5 rounded-full overflow-hidden">
                {progressBars.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-full rounded-full ${getProgressBarColor(index)}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex w-full items-center justify-between">
              <div className="text-[8px] 2xs:text-[9px] xs:text-[10px] font-medium text-slate-500">
                Progress
              </div>
              <div className="text-[8px] 2xs:text-[9px] xs:text-[10px] font-bold text-zinc-900">
                {progress}
              </div>
=======
    <div className="h-[180px] w-[200px] 2xs:h-[200px] 2xs:w-[220px] xs:h-[240px] xs:w-[260px] sm:h-[280px] sm:w-[300px] md:h-[290px] md:w-[320px] flex flex-col items-center justify-center rounded-xl 2xs:rounded-2xl sm:rounded-3xl bg-lesson-card bg-cover bg-center bg-no-repeat shadow-lg">
      <div className="h-[100px] 2xs:h-[110px] xs:h-[130px] sm:h-[150px] md:h-[158px] w-full" />
      <div className="flex h-[80px] 2xs:h-[90px] xs:h-[110px] sm:h-[130px] md:h-[132px] w-full items-center justify-center rounded-bl-xl rounded-br-xl 2xs:rounded-bl-2xl 2xs:rounded-br-2xl sm:rounded-bl-3xl sm:rounded-br-3xl bg-white/95">
        <div className="flex h-[65px] 2xs:h-[75px] xs:h-[85px] sm:h-[90px] md:h-[86px] w-[180px] 2xs:w-[200px] xs:w-[240px] sm:w-[280px] md:w-[280px] flex-col justify-between py-2">
          <div className="flex w-full items-start justify-between">
            <div className="text-[8px] 2xs:text-[9px] xs:text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Week {week}
            </div>
            <div
              className={`flex h-[12px] 2xs:h-[14px] xs:h-[16px] sm:h-[18px] items-center justify-center rounded-lg 2xs:rounded-xl px-1.5 2xs:px-2 ${getStatusColor()}`}
            >
              <div className="text-[6px] 2xs:text-[7px] xs:text-[8px] font-medium uppercase">
                {status}
              </div>
            </div>
          </div>
          <div className="text-xs 2xs:text-sm xs:text-base font-medium text-zinc-900 line-clamp-2">
            {title}
          </div>
          <div className="relative h-1 2xs:h-1.5 w-full">
            <div className="absolute inset-0 rounded-full bg-gray-200" />
            <div className="absolute inset-0 flex gap-0.5 rounded-full overflow-hidden">
              {progressBars.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-full rounded-full ${getProgressBarColor(index)}`}
                />
              ))}
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="text-[8px] 2xs:text-[9px] xs:text-[10px] font-medium text-slate-500">
              Progress
            </div>
            <div className="text-[8px] 2xs:text-[9px] xs:text-[10px] font-bold text-zinc-900">
              {progress}
>>>>>>> main
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
