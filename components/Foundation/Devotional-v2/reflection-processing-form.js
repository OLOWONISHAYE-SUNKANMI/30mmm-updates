"use client";

import React, { useState } from "react";
import { submitTextReflection } from "@/actions/reflection-submission";
import PostReflectionNavigationButtons from "@/components/Foundation/Devotional-v2/post-reflection-navigation";
import UploadVideo from "@/components/Foundation/Devotional-v2/upload-video";

function ReflectionProcessingForm({
  devotionalNumberId,
  devotionalDataId,
  userId,
  week,
  day,
  firstName,
  lastName,
  cohort,
}) {
  // State management remains the same - we still need to track what's happening on the client
  const [reflectionText, setReflectionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const isSubmitted = false;
  const [isVideo, setIsVideo] = useState(true);

  const onTextSubmit = async (reflectionText) => {
    // trim reflection text to avoid empty submissions
    if (!reflectionText.trim()) {
      setError("Please enter your reflection before submitting.");
      return;
    }

    // Reset error state and indicate that we're processing
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await submitTextReflection(
        userId,
        devotionalDataId,
        devotionalNumberId,
        reflectionText,
        week,
        day,
      );

      // Check if the operation was successful
      // The Server Action returns an object with a success flag and either data or an error
      if (!result.success) 
        throw new Error(result.error);
      

      setIsSuccess(true);
    } catch (err) {
      // If anything goes wrong, capture the error message
      // This could be from our Server Action returning success: false,
      // or from a network error, or from any other unexpected issue
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      // Always turn off the loading state, whether we succeeded or failed
      setIsSubmitting(false);
    }
  };

  // Once the reflection is successfully submitted, we show the navigation buttons
  // instead of the form. This prevents duplicate submissions and moves the user forward.
  if (isSuccess) {
    return (
      <div className="w-full">
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 xs:p-4 xs:text-base sm:p-5">
          Your reflection has been saved successfully! Great work on completing
          today&apos;s devotional.
        </div>
        {/* Replace this with your actual PostReflectionNavigationButtons component */}
        <PostReflectionNavigationButtons />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Error messages are shown at the top so they're immediately visible */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 xs:p-4 xs:text-base sm:p-5">
          {error}
        </div>
      )}

      <div className="w-full">
        <label className="mb-3 block text-sm font-semibold text-gray-900 xs:mb-4 xs:text-base sm:text-lg">
          Your Response: Text or Video
        </label>

        <button
          onClick={() => setIsVideo(!isVideo)}
          className="relative h-12 w-full max-w-xs rounded-lg border-2 border-gray-300 bg-white p-1 shadow-sm transition-all duration-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 xs:h-13 sm:h-14 sm:max-w-sm"
        >
          {/* Sliding background */}
          <div
            className={`absolute top-1 h-11 w-[calc(50%-0.25rem)] rounded-md bg-primary-red shadow-sm transition-all duration-300 ease-in-out ${
              isVideo ? "left-[calc(50%+0.125rem)]" : "left-1"
            }`}
          />

          {/* Text option */}
          <div
            className={`relative z-10 flex h-10 w-1/2 items-center justify-center transition-all duration-200 xs:h-11 sm:h-12 ${
              !isVideo
                ? "font-semibold text-white"
                : "font-medium text-gray-600"
            }`}
          >
            <span className="text-xs xs:text-sm">📝 Text</span>
          </div>

          {/* Video option */}
          <div
            className={`absolute right-1 top-1   z-10 flex h-10 w-[calc(50%-0.25rem)] items-center justify-center transition-all duration-200 xs:h-11 sm:h-12 ${
              isVideo ? "font-semibold text-white" : "font-medium text-gray-600"
            }`}
          >
            <span className="text-xs xs:text-sm">🎥 Video</span>
          </div>
        </button>

        {/* Status display */}
        <div className="mb-4 mt-3 xs:mb-5 xs:mt-4 sm:mb-6">
          <p className="text-xs text-gray-600 xs:text-sm">
            Selected:{" "}
            <span className="font-semibold text-gray-900">
              {isVideo ? "Video" : "Text"} Submission
            </span>
          </p>
        </div>

        {!isVideo ? (
          <div className="w-full">
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              rows={8}
              required={true}
              disabled={isSubmitting}
              placeholder="Enter your reflection..."
              className="w-full resize-none rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 ease-in-out placeholder:text-gray-400 hover:border-gray-400 focus:border-primary-red focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 xs:px-4 xs:py-3 xs:text-base sm:rows-10"
            />
            <div className="mt-4 flex justify-center xs:mt-5 sm:mt-6">
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  onTextSubmit(reflectionText);
                }}
                disabled={isSubmitting}
                className="w-full max-w-xs rounded-lg bg-primary-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 xs:px-5 xs:py-2.5 xs:text-base sm:max-w-sm"
              >
                {isSubmitting ? "Saving..." : "Save Text Reflection"}
              </button>
            </div>
          </div>
        ) : (
          <UploadVideo
            week={week}
            day={day}
            firstName={firstName}
            lastName={lastName}
            userId={userId}
            cohort={cohort}
            devotionalDataId={devotionalDataId}
            devotionalNumberId={devotionalNumberId}
          />
        )}

        {isSubmitted && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="mx-auto mt-4 flex w-full max-w-xs rounded-lg bg-primary-red px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 xs:mt-5 xs:px-5 xs:py-2.5 xs:text-base sm:mt-6 sm:max-w-sm"
          >
            {isSubmitting ? "Submitting..." : "Submit Reflection"}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReflectionProcessingForm;
