"use client";

import { MobileUploadOptimizer } from "@/lib/mobile-upload-optimizer";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

export default function TestimonialUploadPage() {
  const [cohort, setCohort] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [week, setWeek] = useState("");
  const [day, setDay] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef(null);
  const [mobileOptimizer, setMobileOptimizer] = useState(null);

  // Initialize mobile optimizer on client side only
  useEffect(() => {
    setMobileOptimizer(new MobileUploadOptimizer());
  }, []);

  // Generate options for select inputs
  const weekOptions = Array.from({ length: 5 }, (_, i) => i + 1);
  const dayOptions = Array.from({ length: 7 }, (_, i) => i + 1);

  // starts from Cohort 46 goes to Cohort 100
  const cohortOptions = Array.from({ length: 56 }, (_, i) => i + 45);

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

  // Handle file selection via input
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
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
  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.click();
    }
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
      console.log("Step 1 starting, creating SAS URL...");
      setUploadStatus({
        success: true,
        message: "Preparing upload...",
        step: 1,
        totalSteps: 3,
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

      // STEP 2: Optimize file for mobile and upload
      console.log("Step 1 complete, optimizing and uploading video...");
      setUploadStatus({
        success: true,
        message: mobileOptimizer?.isMobile ? "Optimizing for mobile..." : "Uploading video to Azure...",
        step: 2,
        totalSteps: 3,
      });

      // Compress video if on mobile
      let optimizedFile = file;
      if (mobileOptimizer?.isMobile) {
        try {
          optimizedFile = await mobileOptimizer.compressVideo(file) || file;
        } catch (error) {
          console.warn("Compression failed, using original file:", error);
        }
      }

      // Use chunked upload for mobile, regular upload for desktop
      if (mobileOptimizer?.isMobile) {
        await mobileOptimizer.uploadWithChunks(
          optimizedFile,
          sasUrl,
          (progress) => setUploadProgress(progress)
        );
      } else {
        // Original XMLHttpRequest for desktop
        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.open("PUT", sasUrl, true);
          xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
          xhr.setRequestHeader("Content-Type", optimizedFile.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round(
                (event.loaded / event.total) * 100,
              );
              setUploadProgress(percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error occurred during upload"));
          };

          xhr.send(optimizedFile);
        });

        await uploadPromise;
      }
      setUploadProgress(100);

      // STEP 3: Store metadata
      console.log("Step 2 complete, storing metadata to mongodb...");
      setUploadStatus({
        success: true,
        message: "Saving metadata...",
        step: 3,
        totalSteps: 3,
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
      console.log("Step 3 complete, success");
      setUploadStatus({
        success: true,
        message: "Video uploaded successfully!",
        step: 3,
        totalSteps: 3,
        completed: true,
      });

      // Reset form after successful upload
      setCohort("");
      setFirstName("");
      setLastName("");
      setWeek("");
      setDay("");
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

  // Handle reset of the form
  const handleReset = () => {
    setCohort("");
    setFirstName("");
    setLastName("");
    setWeek("");
    setDay("");
    setFile(null);
    setPreviewUrl(null);
    setUploadStatus(null);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 px-2 py-4 xs:px-4 xs:py-6 sm:px-6 sm:py-8">
      <main className="container mx-auto max-w-4xl">
        <h1 className="mb-4 text-center text-lg font-bold text-primary-red xs:mb-6 xs:text-xl sm:mb-8 sm:text-2xl md:text-3xl lg:text-4xl">
          Upload Your Journeyman&apos;s Testimonial Video Here
        </h1>
        <p className="mx-auto mb-2 max-w-4xl text-center text-xs font-bold xs:mb-3 xs:text-sm sm:mb-4 sm:text-base md:text-lg">
          Add the information for your journeyman to the fields below as you
          receive video testimonials from your Journeyman.
        </p>
        <p className="mx-auto mb-4 max-w-3xl text-xs text-justify leading-relaxed xs:mb-6 xs:text-sm sm:mb-8 sm:text-base md:text-lg">
          Please include their cohort number from Discord, their first and last
          name, the week and day of the video, as well as the video file itself.
          Hitting submit will store your file with the other testimonials to
          create a catalogue of the transformation CLEAN has worked in each
          brother&apos;s life!
        </p>

        <p className="mx-auto mb-6 max-w-3xl text-xs text-justify leading-relaxed xs:mb-8 xs:text-sm sm:mb-10 sm:text-base md:text-lg">
          <span className="font-bold">NOTE:</span> based on common broadband
          upload speeds (~10 mbps) each video may take several minutes to
          upload. There is a progress tracker to display the upload progress as
          the videos are being stored. Please do not leave this page before
          seeing the{" "}
          <span className="text-green-500 font-semibold">Video uploaded successfully!</span>{" "}
          message.
        </p>

        <div className="mx-auto w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
          {uploadStatus && uploadStatus.success && uploadStatus.completed ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center shadow-sm xs:p-6 sm:p-8">
              <p className="mb-3 text-sm text-green-700 xs:mb-4 xs:text-base sm:mb-6 sm:text-lg md:text-xl">
                {uploadStatus.message}
              </p>
              <button
                onClick={handleReset}
                className="w-full rounded-lg bg-primaryred px-4 py-2.5 text-sm text-white transition-colors hover:bg-primaryred-800 focus:outline-none focus:ring-2 focus:ring-primaryred focus:ring-offset-2 xs:px-6 xs:text-base sm:w-auto sm:px-8 sm:py-3 md:text-lg"
              >
                Upload Another Video
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-lg bg-white p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12"
              onDragEnter={handleDrag}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="mb-3 xs:mb-4 sm:mb-5 md:mb-6">
                <label
                  htmlFor="cohort"
                  className="mb-1.5 block text-sm font-medium text-description-gray xs:text-base sm:mb-2 md:text-lg"
                >
                  Cohort:
                </label>
                <select
                  id="cohort"
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-formfield px-3 py-2.5 text-sm transition-colors focus:border-primaryred focus:ring-2 focus:ring-primaryred focus:ring-offset-1 xs:px-4 xs:py-3 xs:text-base sm:px-5 sm:py-3.5 md:text-lg"
                >
                  <option value="">-- Select Cohort --</option>
                  <option value="no-cohort">-- Not Assigned A Cohort --</option>
                  {cohortOptions.map((num) => (
                    <option
                      key={`cohort-${num}`}
                      value={num}
                    >
                      Cohort {num}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3 xs:mb-4 sm:mb-5 md:mb-6">
                <label
                  htmlFor="firstName"
                  className="mb-1.5 block text-sm font-medium text-description-gray xs:text-base sm:mb-2 md:text-lg"
                >
                  First Name:
                </label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-formfield px-3 py-2.5 text-sm transition-colors focus:border-primaryred focus:ring-2 focus:ring-primaryred focus:ring-offset-1 xs:px-4 xs:py-3 xs:text-base sm:px-5 sm:py-3.5 md:text-lg"
                  placeholder="Enter first name"
                />
              </div>
              <div className="mb-3 xs:mb-4 sm:mb-5 md:mb-6">
                <label
                  htmlFor="lastName"
                  className="mb-1.5 block text-sm font-medium text-description-gray xs:text-base sm:mb-2 md:text-lg"
                >
                  Last Name:
                </label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-formfield px-3 py-2.5 text-sm transition-colors focus:border-primaryred focus:ring-2 focus:ring-primaryred focus:ring-offset-1 xs:px-4 xs:py-3 xs:text-base sm:px-5 sm:py-3.5 md:text-lg"
                  placeholder="Enter last name"
                />
              </div>
              <div className="mb-3 xs:mb-4 sm:mb-5 md:mb-6">
                <label
                  htmlFor="week"
                  className="mb-1.5 block text-sm font-medium text-description-gray xs:text-base sm:mb-2 md:text-lg"
                >
                  Select Week:
                </label>
                <select
                  id="week"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-formfield px-3 py-2.5 text-sm transition-colors focus:border-primaryred focus:ring-2 focus:ring-primaryred focus:ring-offset-1 xs:px-4 xs:py-3 xs:text-base sm:px-5 sm:py-3.5 md:text-lg"
                >
                  <option value="">-- Select Week --</option>
                  {weekOptions.map((num) => (
                    <option
                      key={`week-${num}`}
                      value={num}
                    >
                      Week {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                <label
                  htmlFor="day"
                  className="mb-1.5 block text-sm font-medium text-description-gray xs:text-base sm:mb-2 md:text-lg"
                >
                  Select Day:
                </label>
                <select
                  id="day"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-formfield px-3 py-2.5 text-sm transition-colors focus:border-primaryred focus:ring-2 focus:ring-primaryred focus:ring-offset-1 xs:px-4 xs:py-3 xs:text-base sm:px-5 sm:py-3.5 md:text-lg"
                >
                  <option value="">-- Select Day --</option>
                  {dayOptions.map((num) => (
                    <option
                      key={`day-${num}`}
                      value={num}
                    >
                      Day {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                <label
                  htmlFor="video"
                  className="mb-1 block text-xs font-medium text-description-gray xs:text-sm sm:mb-2 sm:text-base md:text-lg"
                >
                  Upload Video:
                </label>
                <div
                  className={`relative mt-1 flex justify-center rounded-lg border-2 border-dashed ${dragActive
                      ? "border-primaryred bg-red-50"
                      : "border-gray-300"
                    } px-2 pb-3 pt-2 xs:px-3 xs:pb-4 xs:pt-3 sm:px-6 sm:pb-6 sm:pt-5 md:px-8 md:pb-8 md:pt-6`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {/* Invisible overlay for drag & drop handling */}
                  {dragActive && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-red-50 bg-opacity-80">
                      <p className="text-xs font-medium text-primaryred xs:text-sm sm:text-lg md:text-xl">
                        Drop your video file here
                      </p>
                    </div>
                  )}
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-6 w-6 text-gray-400 xs:h-8 xs:w-8 sm:h-12 sm:w-12 md:h-16 md:w-16"
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
                    <div className="flex flex-col text-xs text-gray-600 xs:text-sm sm:flex-row md:text-base">
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
                      <p className="sm:pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 xs:text-sm md:text-base">MP4, MOV, AVI, etc.</p>
                    {file && !previewUrl && (
                      <div className="mt-1 flex flex-col items-center justify-center space-y-1 xs:mt-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                        <p className="text-xs text-green-600 xs:text-sm md:text-base">
                          Selected: {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-800 xs:text-sm md:text-base"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {previewUrl && (
                <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8">
                  <div className="mb-1 flex items-center justify-between xs:mb-2">
                    <h3 className="text-xs font-medium text-description-gray xs:text-sm sm:text-base md:text-lg">
                      Preview:
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="flex items-center text-xs text-red-600 hover:text-red-800 xs:text-sm md:text-base"
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
                  className={`w-full rounded-lg px-3 py-2 text-xs text-white transition-colors xs:px-4 xs:text-sm sm:w-auto sm:px-6 sm:text-base md:px-8 md:py-3 md:text-lg ${!week ||
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

              {isUploading && (
                <div className="mt-3 text-center xs:mt-4 sm:mt-6 md:mt-8">
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="inline-block text-xs font-semibold text-description-gray xs:text-sm md:text-base">
                          {uploadStatus?.message || "Uploading..."}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-xs font-semibold text-description-gray xs:text-sm md:text-base">
                          {uploadProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="mb-2 mt-1 flex h-1.5 overflow-hidden rounded bg-gray-200 text-xs xs:mb-3 xs:mt-2 xs:h-2 sm:mb-4 md:h-3">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="flex flex-col justify-center whitespace-nowrap bg-primaryred text-center text-white shadow-none"
                      ></div>
                    </div>
                    <div className="flex flex-col items-center justify-between space-y-1 text-xs text-description-gray xs:text-sm sm:flex-row sm:space-y-0 md:text-base">
                      <div>
                        {uploadStatus?.step && uploadStatus?.totalSteps && (
                          <span>
                            Step {uploadStatus.step} of{" "}
                            {uploadStatus.totalSteps}
                          </span>
                        )}
                      </div>
                      <div>
                        {file && (
                          <span>
                            {Math.round((file.size / (1024 * 1024)) * 10) / 10}{" "}
                            MB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {uploadStatus && !uploadStatus.success && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-center text-xs text-red-700 xs:mt-3 xs:p-3 xs:text-sm sm:mt-4 md:text-base">
                  <p>{uploadStatus.message}</p>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
