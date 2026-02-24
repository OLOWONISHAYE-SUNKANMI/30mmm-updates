"use client";

import * as React from "react";
import { getDevotionalUrl, getWeekTitlesWithDays } from "@/actions/devotional";
import { getUserProgress } from "@/actions/user-progress";
import { comments, notes } from "@/sample-data/DiscussionData";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { FaCheck, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoLockClosed } from "react-icons/io5";
import DiscussionSection from "./discussion-section";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SidePanel() {
  const [open, setOpen] = React.useState(false);
  const [weeks, setWeeks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedWeeks, setExpandedWeeks] = React.useState(new Set());
  const router = useRouter();
  const { authState } = useAuth();
  const userId = authState.user?.id;

  React.useEffect(() => {
    const loadDevotionalsWithProgress = async () => {
      try {
        // Load devotional structure
        const devotionalsResult = await getWeekTitlesWithDays();

        if (!devotionalsResult.success) {
          throw new Error(devotionalsResult.error);
        }

        if (!authState.isAuthenticated || !userId) {
          setLoading(false);
          return;
        }

        // Load user progress - THIS IS THE KEY CHANGE
        // You need to get the userId first, then pass it to getUserProgress
        const progressResult = await getUserProgress(userId);
        const userProgress = progressResult.success
          ? progressResult.progress || progressResult.userProgress
          : null;

        const processedWeeks = devotionalsResult.weekTitles.map((weekData) => {
          const weekNum = weekData.week;

          // Determine if this week is completed based on weekXCompleted fields
          let isWeekCompleted = false;
          let isWeekLocked = false;

          if (weekNum < userProgress?.currentWeek) {
            isWeekCompleted = true;
          }
          // Determine if this week is locked (future weeks beyond current week)
          if (weekNum > userProgress?.currentWeek) {
            isWeekLocked = true;
          }

          // Determine if this is the current week
          const isCurrentWeek = userProgress?.currentWeek === weekNum;

          // Process days for this week
          const processedDays = weekData.days.map((dayData) => {
            const dayNum = dayData.day;

            const devotionalId = (weekNum - 1) * 7 + dayNum; // Calculate devotional ID (1-35)

            // Check if this specific day is completed
            const isDayCompleted =
              userProgress?.completedDevotionalIds?.includes(devotionalId) ||
              false;
            let isDayLocked = false;
            let isCurrentDay = false;

            // Determine if day is locked
            if (dayNum > userProgress?.currentDay) {
              isDayLocked = true;
            }

            if (dayNum + (weekNum - 1) * 7 == userProgress?.currentDay) {
              isCurrentDay = true;
            }

            return {
              id: `${weekNum}-${dayNum}`,
              day: dayNum,
              title: dayData.dayTitle,
              completed: isDayCompleted,
              locked: isDayLocked,
              current: isCurrentDay,
            };
          });

          return {
            id: weekNum,
            title: weekData.weekTitle,
            completed: isWeekCompleted,
            locked: isWeekLocked,
            current: isCurrentWeek,
            days: processedDays,
          };
        });

        setWeeks(processedWeeks);

        // Auto-expand current week
        if (userProgress) {
          setExpandedWeeks(new Set([userProgress.currentWeek]));
        }
      } catch (error) {
        console.error("Error loading devotionals with progress:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDevotionalsWithProgress();
  }, [userId, authState.isAuthenticated]);

  const toggleWeekExpansion = (weekId) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekId)) {
        newSet.delete(weekId);
      } else {
        newSet.add(weekId);
      }
      return newSet;
    });
  };

  const toggleDrawer = (newOpen) => {
    setOpen(newOpen);
  };

  const handleDayClick = async (week, day) => {
    const url = await getDevotionalUrl(week, day);
    router.push(url);
    setOpen(false); // Close the drawer after navigation
  };

  const DrawerList = (
    <Box
      sx={{ width: 400 }}
      role="presentation"
      className="bg-gray-100 xs:w-full sm:w-full md:w-[320px] lg:w-[400px]"
    >
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Devotional Progress
            </h2>
          </div>
        </div>

        {/* Progress List */}
        <div className="mb-[2vh] space-y-2">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            weeks.map((week) => (
              <div
                key={week.id}
                className="space-y-1"
              >
                {/* Week Header */}
                <div
                  className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors ${
                    week.current
                      ? "border-l-4 border-red-600 bg-red-50"
                      : week.completed
                        ? "bg-white hover:bg-gray-50"
                        : "bg-white opacity-60"
                  }`}
                  onClick={() => !week.locked && toggleWeekExpansion(week.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        week.completed
                          ? "bg-green-500"
                          : week.current
                            ? "bg-red-600"
                            : "bg-gray-200"
                      }`}
                    >
                      {week.completed ? (
                        <FaCheck className="text-sm text-white" />
                      ) : week.locked ? (
                        <IoLockClosed className="text-sm text-gray-400" />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {week.id}
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        week.current ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {week.title}
                    </span>
                  </div>
                  {!week.locked && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {week.days.filter((d) => d.completed).length}/
                        {week.days.length}
                      </span>
                      {expandedWeeks.has(week.id) ? (
                        <FaChevronDown className="text-sm text-gray-400" />
                      ) : (
                        <FaChevronRight className="text-sm text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Days List */}
                <Collapse
                  in={expandedWeeks.has(week.id)}
                  timeout="auto"
                >
                  <div className="ml-4 space-y-1">
                    {week.days.map((day) => {
                      const isClickable =
                        day.completed ||
                        day.current ||
                        (!day.locked && week.id === 1 && day.day === 1);

                      return (
                        <div
                          key={day.id}
                          className={`flex items-center justify-between rounded-md p-2 text-sm transition-colors ${
                            day.current
                              ? "bg-red-25 border-l-2 border-red-600"
                              : day.completed
                                ? "bg-green-25 hover:bg-green-50"
                                : day.locked
                                  ? "bg-gray-50 opacity-50"
                                  : "hover:bg-gray-25 bg-white"
                          } ${isClickable ? "cursor-pointer" : ""}`}
                          onClick={() =>
                            isClickable && handleDayClick(week.id, day.day)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                day.completed
                                  ? "bg-green-400"
                                  : day.current
                                    ? "bg-red-500"
                                    : day.locked
                                      ? "bg-gray-200"
                                      : "bg-blue-200"
                              }`}
                            >
                              {day.completed ? (
                                <FaCheck className="text-xs text-white" />
                              ) : day.locked ? (
                                <IoLockClosed className="text-xs text-gray-400" />
                              ) : (
                                <span className="text-xs font-medium text-white">
                                  {day.day}
                                </span>
                              )}
                            </div>
                            <span
                              className={`${
                                day.current
                                  ? "font-medium text-gray-900"
                                  : "text-gray-600"
                              } ${isClickable ? "hover:underline" : ""}`}
                            >
                              {day.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Collapse>
              </div>
            ))
          )}
        </div>

        <Divider />

        <DiscussionSection
          comments={comments}
          notes={notes}
        />
      </div>
    </Box>
  );

  return (
    <div className="flex justify-end">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => toggleDrawer(true)}
              className="h-12 w-12 justify-center rounded-xl bg-[#7D899D1A] text-[#717171] max-sm:h-8 max-sm:w-8 max-xs:h-6 max-xs:w-6"
            >
              <GiHamburgerMenu className="text-red-700" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open Sidebar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Drawer
        open={open}
        onClose={() => toggleDrawer(false)}
        anchor="right"
      >
        {DrawerList}
      </Drawer>
    </div>
  );
}
