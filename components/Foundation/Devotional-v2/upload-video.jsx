import React, { useRef, useState } from "react";
import { submitVideoReflection } from "@/actions/reflection-submission";
import PostReflectionNavigationButtons from "@/components/Foundation/Devotional-v2/post-reflection-navigation";
import { toast } from "sonner";

function UploadVideo({
  week,
  day,
  firstName,
  lastName,
  cohort,
  userId,
  devotionalDataId,
  devotionalNumberId,
}) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file selection via input
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  // Handle file validation and preview
  const processFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.includes("video")) {
      setFile(selectedFile);

      // Create a preview URL for the video
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setFile(null);
      setPreviewUrl(null);
      toast.error("Please select a valid video file");
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    // Important: Always prevent default to stop browser from opening/downloading files
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Process the dropped file
      processFile(e.dataTransfer.files[0]);

      // Clear the dataTransfer object to prevent browser default behavior
      if (e.dataTransfer.clearData) {
        e.dataTransfer.clearData();
      }
    }
  };

  // Handle button click to trigger file input
  const handleButtonClick = () => {
    inputRef.current.click();
  };

  // Handle form submission with progress tracking
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!week || !day || !file || !firstName || !lastName || !cohort) {
      toast.error("Please add all fields to submit this form successfully");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    try {
      // STEP 1: Get the Azure SAS URL
      setUploadStatus({
        success: false,
        message: "Preparing upload...",
        step: 1,
        totalSteps: 4,
      });

      const fileInfo = {
        filename: file.name,
        contentType: file.type,
        cohort: cohort,
        firstName: firstName,
        lastName: lastName,
        week: week,
        day: day,
      };

      const sasResponse = await fetch("/api/getVideoUploadUrl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fileInfo),
      });

      if (!sasResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const result = await sasResponse.json();
      const sasUrl = result.uploadUrl;

      // STEP 2: Upload the file with progress tracking
      setUploadStatus({
        success: false,
        message: "Uploading video to Azure...",
        step: 2,
        totalSteps: 4,
      });

      // Create a new XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();

      // Create a promise that resolves when the upload is complete
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open("PUT", sasUrl, true);
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.setRequestHeader("Content-Type", file.type);

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100,
            );
            setUploadProgress(percentComplete);
          }
        };

        // Handle upload completion
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        // Handle upload error
        xhr.onerror = () => {
          reject(new Error("Network error occurred during upload"));
        };

        // Start the upload
        xhr.send(file);
      });

      await uploadPromise;
      setUploadProgress(100);

      // STEP 3: Store metadata
      setUploadStatus({
        success: false,
        message: "Saving metadata...",
        step: 3,
        totalSteps: 4,
      });

      const metadataResponse = await fetch("/api/store-video-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cohort,
          firstName,
          lastName,
          week,
          day,
          fileName: file.name,
          fileType: file.type,
          blobUrl: sasUrl,
        }),
      });

      if (!metadataResponse.ok) {
        console.warn("Metadata storage issue, but video upload was successful");
      }

      // Success!
      setUploadStatus({
        success: true,
        message: "Video uploaded successfully!",
        step: 3,
        totalSteps: 4,
        completed: false,
      });

      const resultVid = await submitVideoReflection(
        userId,
        devotionalDataId,
        devotionalNumberId,
        week,
        day,
        sasUrl,
      );

      if (!resultVid.success) {
        throw new Error(resultVid.error);
      }

      setUploadStatus({
        success: true,
        message: "User Progress has been updated!",
        step: 3,
        totalSteps: 4,
        completed: true,
      });

      // Reset the form
      setFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        success: false,
        message: `Upload failed: ${error.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg bg-white p-6 shadow-md"
        onDragEnter={handleDrag}
        onDragOver={(e) => e.preventDefault()} // Prevent default browser behavior
      >
        {/* Upload Video section */}
        <div className="mx-auto mb-6 w-full max-w-2xl">
          <label
            htmlFor="video"
            className="mb-2 block font-medium text-description-gray"
          >
            Upload Video:
          </label>
          <div
            className={`relative mt-1 flex justify-center rounded-lg border-2 border-dashed ${dragActive ? "border-primaryred bg-red-50" : "border-gray-300"
              } px-6 pb-6 pt-5`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Invisible overlay for drag & drop handling */}
            {dragActive && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-red-50 bg-opacity-80">
                <p className="text-lg font-medium text-primaryred">
                  Drop your video file here
                </p>
              </div>
            )}
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="relative cursor-pointer rounded-md font-medium text-primaryred hover:text-primaryred-700 focus:outline-none"
                >
                  Upload a video
                </button>
                <input
                  id="video"
                  ref={inputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">MP4, MOV, AVI, etc.</p>
              {file && !previewUrl && (
                <div className="mt-2 flex items-center justify-center">
                  <p className="mr-2 text-sm text-green-600">
                    Selected: {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview URL component */}
        {previewUrl && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-description-gray">Preview:</h3>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="flex items-center text-sm text-red-600 hover:text-red-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <line
                    x1="18"
                    y1="6"
                    x2="6"
                    y2="18"
                  ></line>
                  <line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                  ></line>
                </svg>
                Remove Video
              </button>
            </div>
            <div className="overflow-hidden rounded-lg">
              <video
                controls
                className="h-auto w-full"
              >
                <source
                  src={previewUrl}
                  type={file.type}
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={
              !week ||
              !day ||
              !file ||
              !firstName ||
              !lastName ||
              !cohort ||
              isUploading
            }
            className={`rounded-lg px-6 py-2 text-white transition-colors ${!week ||
                !day ||
                !file ||
                !firstName ||
                !lastName ||
                !cohort ||
                isUploading
                ? "cursor-not-allowed bg-gray-400"
                : "bg-primaryred hover:bg-primaryred-800"
              }`}
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </button>
        </div>

        {/* Progress Tracking */}
        {isUploading && (
          <div className="mt-6 text-center">
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block text-xs font-semibold text-description-gray">
                    {uploadStatus?.message || "Uploading..."}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block text-xs font-semibold text-description-gray">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <div className="mb-4 mt-2 flex h-2 overflow-hidden rounded bg-gray-200 text-xs">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="flex flex-col justify-center whitespace-nowrap bg-primaryred text-center text-white shadow-none"
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-description-gray">
                <div>
                  {uploadStatus?.step && uploadStatus?.totalSteps && (
                    <span>
                      Step {uploadStatus.step} of {uploadStatus.totalSteps}
                    </span>
                  )}
                </div>
                <div>
                  {file && (
                    <span>
                      {Math.round((file.size / (1024 * 1024)) * 10) / 10} MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadStatus && uploadStatus.success && (
          <div>
            <div className="mt-6 w-full">
              <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
                Your reflection has been saved successfully! Great work on
                completing today&apos;s devotional.
              </div>
              {/* Replace this with your actual PostReflectionNavigationButtons component */}
              <PostReflectionNavigationButtons />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default UploadVideo;
