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
      if (!authState.isAuthenticated) {
        setUserProgressData(null);
        return;
      }
      try {
        const result = await getCurrentUserWithProgress();

        if (!result.success) {
          throw new Error(result.error || "Failed to get user data");
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
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading devotional...</p>
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
    <div className="min-h-screen w-full bg-gray-50">
      {/* Main Container - Responsive padding and max-width */}
      <div className="mx-auto w-full max-w-lg px-4 py-4 sm:max-w-2xl sm:px-6 sm:py-6 md:max-w-3xl md:px-8 md:py-8 lg:max-w-5xl lg:px-10 lg:py-10 xl:max-w-6xl xl:px-12">
        {/* Back Button - Responsive sizing */}
        <button
          onClick={() => router.push("/dashboard")}
          className="group mb-6 mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 sm:px-4 sm:py-2 sm:text-base"
        >
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 sm:h-5 sm:w-5"
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
          <span className="font-medium">Back</span>
        </button>

        {/* Content Container - Responsive spacing and layout */}
        <div className="flex flex-col items-start rounded-lg bg-white p-4 shadow-sm sm:p-6 md:p-8">
          {/* Title Section - Responsive spacing */}
          <div className="flex flex-col items-start sm:mb-6 md:mb-8">
            <Title
              weekTitle={devotionalData.weekTitle}
              dayTitle={devotionalData.dayTitle}
              daySubtitle={devotionalData.daySubTitle}
            />
            {/* SubTitle Section - Responsive spacing */}
            <div className="mb-4 mt-4 sm:mb-6">
              <SubTitle
                week={devotionalData.week}
                day={devotionalData.day}
              />
            </div>
          </div>

          {/* Main Image - Responsive container */}
          <div className="mb-6 flex h-auto w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:mb-8 md:mb-10">
            <MainImage videoId={devotionalData.videoId} />
          </div>

          {/* Quotes Section - Responsive spacing */}
          <div className="mb-6 flex w-full justify-center sm:mb-8 md:mb-10">
            <Quotes />
          </div>

          {/* Scriptures Section - Responsive spacing */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <ScripturesSection scriptures={devotionalData.Scriptures} />
          </div>

          {/* Reading Time - Responsive spacing */}
          <div className="mb-6 sm:mb-8">
            <ReadingTime devotionText={devotionalData.devotionText || ""} />
          </div>

          {/* Main Lesson - Responsive spacing */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <MainLesson devotionText={devotionalData.devotionText || ""} />
          </div>

          {/* Reflection Box - Responsive spacing */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <ReflectionBox
              reflectionQuestion={devotionalData.reflectionQuestion}
            />
          </div>

          {/* Divider */}
          <div className="my-6 xs:my-8 sm:my-10 md:my-12">
            <Divider />
          </div>

          {/* Reflection Form - Full width responsive */}
          <div className="w-full">
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
