// app/Foundation/[id]/page.js

"use client";

import React, { use, useEffect, useState } from "react";
import { getCurrentUserWithProgress } from "@/actions/dashboard";
import { getDevotionalById } from "@/actions/devotional";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Divider from "@/components/common/Divider";
import ReflectionProcessingForm from "@/components/Foundation/Devotional-v2/reflection-processing-form";
import MainImage from "@/components/Foundation/MainImage";
import MainLesson from "@/components/Foundation/MainLesson";
import Quotes from "@/components/Foundation/Quotes";
import ReadingTime from "@/components/Foundation/ReadingTime";
import ReflectionBox from "@/components/Foundation/ReflectionBox";
import ScripturesSection from "@/components/Foundation/ScripturesSection";
import SubTitle from "@/components/Foundation/SubTitle";
import Title from "@/components/Foundation/Title";

export default function Devotional({ params }) {
  /**
   * Hooks and contexts
   */
  const unwrappedParams = use(params);
  const { authState } = useAuth();
  const router = useRouter();
  const devotionalId = unwrappedParams.id;

  /**
   * Data and State Management
   */
  const [devotionalData, setDevotionalData] = useState(null);
  const [userProgressData, setUserProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Effects and Data Fetching
   */
  useEffect(() => {
    const fetchDevotional = async () => {
      if (devotionalId) {
        try {
          setLoading(true);
          setError(null);

          const result = await getDevotionalById(devotionalId);

          if (!result.success) {
            throw new Error(result.error);
          }

          setDevotionalData(result.devotional);
        } catch (err) {
          console.error("Error loading devotional:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDevotional();
  }, [devotionalId]);

  /**
   * User Progress Data Fetching
   */

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!authState.isAuthenticated) {
        setUserProgressData(null);
        return;
      }
      try {
        const result = await getCurrentUserWithProgress();
        if (!result.success && result.error === "Not authenticated") {
          setUserProgressData(null);
          return;
        }
        if (!result.success) {
          throw new Error(result.error);
        }
        setUserProgressData(result);
      } catch (err) {
        console.error("Error loading user progress:", err);
      }
    };
    fetchUserProgress();
  }, [authState.isAuthenticated]);

  /**
   * Loading State
   */
  if (authState.loading || loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-red border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">Error loading devotional: {error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded bg-primary-red px-4 py-2 text-white hover:bg-red-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Error State for missing devotional
  if (!devotionalData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">Error loading devotional: {error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded bg-primary-red px-4 py-2 text-white hover:bg-red-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /**
   *
   *
   *
   * Main JSX
   *
   *
   *
   */

  return (
    <div className="mt-16 flex w-full flex-col justify-between px-4 py-4 sm:px-6 md:px-8 lg:px-12">
      <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col items-center">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          {/* Back Button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="group mb-4 sm:mb-6 flex items-center gap-2 self-start rounded-lg px-3 py-2 sm:px-4 text-sm sm:text-base text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="mb-6 sm:mb-8 flex flex-col items-start bg-white">
            <div className="mt-4 sm:mt-6 md:mt-8 w-full">
              <Title
                weekTitle={devotionalData.weekTitle}
                dayTitle={devotionalData.dayTitle}
                daySubtitle={devotionalData.daySubTitle}
              />
            </div>

            <div className="mb-3 sm:mb-4 md:mb-6 mt-2 sm:mt-3 md:mt-4 w-full">
              <SubTitle
                week={devotionalData.week}
                day={devotionalData.day}
              />
            </div>

            <div className="flex w-full justify-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center w-full">
                <MainImage videoId={devotionalData.videoId} />
              </div>
            </div>

            <div className="flex w-full justify-center mb-4 sm:mb-6">
              <Quotes />
            </div>

            <div className="mb-4 sm:mb-6 md:mb-8 flex w-full justify-center">
              <ScripturesSection scriptures={devotionalData.Scriptures} />
            </div>

            <div className="mt-2 sm:mt-3 md:mt-4 flex w-full">
              <ReadingTime devotionText={devotionalData.devotionText || ""} />
            </div>

            <div className="mt-4 sm:mt-6 md:mt-8 flex w-full">
              <MainLesson devotionText={devotionalData.devotionText || ""} />
            </div>

            <div className="flex w-full flex-col items-center">
              <div className="mt-6 sm:mt-8 md:mt-12 flex w-full justify-center">
                <ReflectionBox
                  reflectionQuestion={devotionalData.reflectionQuestion}
                />
              </div>
            </div>

            <Divider />

            {/* ReflectionTextBox */}
            <ReflectionProcessingForm
              devotionalDataId={devotionalData.id}
              devotionalNumberId={devotionalData.numberId}
              userId={authState.user?.id}
              week={devotionalData.week}
              day={devotionalData.day}
              firstName={userProgressData?.user?.firstName}
              lastName={userProgressData?.user?.lastName}
              cohort={userProgressData?.progress?.cohortNumber || 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
