import { useEffect, useState } from "react";
import { getAllDevotionals } from "@/actions/devotional";
import { getUserProgress } from "@/actions/user-progress";
import { FaChevronDown, FaRegCalendarAlt } from "react-icons/fa";
import WeekCards from "@/components/Dashboard/WeekCards";

export default function CardSection({ userId }) {
  const [userProgress, setUserProgress] = useState(null);
  const [devotionals, setDevotionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if userId is not available
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user progress
        const progressResult = await getUserProgress(userId);

        if (progressResult.success) {
          setUserProgress(progressResult.userProgress);
        } else {
          setError(progressResult.error);
        }

        // Fetch all devotionals
        const devotionalsResult = await getAllDevotionals();

        if (devotionalsResult.success) {
          setDevotionals(devotionalsResult.devotionals);
        } else {
          setError(devotionalsResult.error);
        }
      } catch (error) {
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userId) {
    return <div>User not found</div>;
  }

  const cohortText = userProgress?.cohortRoman || "I";

  return (
    <>
      <div className="inline-flex h-[24px] 2xs:h-[26px] xs:h-[28px] sm:h-[30px] w-full items-center justify-between px-0.5 2xs:px-1 xs:px-1.5 sm:px-2 py-1 2xs:py-1.5">
        <div className="inline-flex justify-evenly gap-0.5 2xs:gap-1 xs:gap-1.5 sm:gap-x-2 rounded-[40px] bg-gray-200">
          <span className="rounded-[34px] px-1 2xs:px-1.5 xs:px-2.5 py-1 2xs:py-1.5 xs:py-2 text-[8px] 2xs:text-[9px] xs:text-[10px] sm:text-xs font-light leading-tight tracking-wider text-slate-600 hover:bg-almost-black hover:font-medium hover:text-white">
            All
          </span>
          <span className="rounded-[34px] px-1 2xs:px-1.5 xs:px-2.5 py-1 2xs:py-1.5 xs:py-2 text-[8px] 2xs:text-[9px] xs:text-[10px] sm:text-xs font-light leading-tight tracking-wider text-slate-600 hover:bg-almost-black hover:font-medium hover:text-white">
            In Progress
          </span>
          <span className="rounded-[34px] px-1 2xs:px-1.5 xs:px-2.5 py-1 2xs:py-1.5 xs:py-2 text-[8px] 2xs:text-[9px] xs:text-[10px] sm:text-xs font-light leading-tight tracking-wider text-slate-600 hover:bg-almost-black hover:font-medium hover:text-white max-sm:hidden">
            Upcoming
          </span>
          <span className="rounded-[34px] px-1 2xs:px-1.5 xs:px-2.5 py-1 2xs:py-1.5 xs:py-2 text-[8px] 2xs:text-[9px] xs:text-[10px] sm:text-xs font-light leading-tight tracking-wider text-slate-600 hover:bg-almost-black hover:font-medium hover:text-white">
            Completed
          </span>
        </div>
        <div className="ml-auto inline-flex items-center gap-0.5 2xs:gap-1 rounded-2xl bg-gray-200 p-1 2xs:p-1.5 xs:p-2 text-[8px] 2xs:text-[10px] xs:text-xs sm:text-sm font-light">
          <FaRegCalendarAlt className="w-2 h-2 2xs:w-3 2xs:h-3 xs:w-4 xs:h-4" />
          <span className="hidden xs:inline">Group:</span>
          <div className="font-medium leading-snug">Clean {cohortText}</div>
          <FaChevronDown className="w-1.5 h-1.5 2xs:w-2 2xs:h-2" />
        </div>
      </div>
      <WeekCards
        userProgress={userProgress}
        devotionals={devotionals}
      />
    </>
  );
}
