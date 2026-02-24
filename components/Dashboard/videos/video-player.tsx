"use client";

import { useEffect, useRef, useState } from "react";
import { getUserProgress } from "@/actions/user-progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Share2,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateWeekAndDay } from "@/lib/calculateWeekAndDay";

export default function VideoPlayer() {
  const { authState } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<any[]>([]);
  const [brokenVideoIds, setBrokenVideoIds] = useState<Set<number>>(new Set());
  const [videoStats, setVideoStats] = useState<{
    [key: string]: { likes: number; comments: number };
  }>({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const errorHandledRef = useRef<Set<number>>(new Set());

  // Progress state
  const [currentUserProgress, setCurrentUserProgress] = useState<{
    week: number;
    day: number;
  } | null>(null);

  const shareVideo = async (platform: string) => {
    if (!currentVideo) return;

    const videoUrl = `${window.location.origin}/dashboard/videos?v=${currentVideo.id}`;
    const title = `Check out this video: Week ${currentVideo.week} Day ${currentVideo.day}`;
    const text = `${title} - ${currentVideo.description || "CLEAN Program Video"}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(videoUrl)}`,
          "_blank",
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
          "_blank",
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text} ${videoUrl}`)}`,
          "_blank",
        );
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(videoUrl);
          toast.success("Link copied to clipboard!");
        } catch (err) {
          console.error("Failed to copy:", err);
          const textArea = document.createElement("textarea");
          textArea.value = videoUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          toast.success("Link copied to clipboard!");
        }
        break;
    }
    setShowShareMenu(false);
  };
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentVideoIndex];
  const currentStats = currentVideo
    ? videoStats[(currentVideo as any).id] || { likes: 0, comments: 0 }
    : { likes: 0, comments: 0 };
  const currentUser = authState.user;

  useEffect(() => {
    const fetchVideosAndProgress = async () => {
      setLoading(true);
      try {
        // 1. Fetch User Progress
        let progressWeek = 1;
        let progressDay = 1;

        if (authState.user?.id) {
          const progressRes = await getUserProgress(authState.user.id);
          if (progressRes.success && progressRes.userProgress) {
            const totalDays = progressRes.userProgress.currentDay || 1;
            const { week, day } = calculateWeekAndDay(totalDays);
            progressWeek = week;
            progressDay = day;
            setCurrentUserProgress({ week, day });
          }
        }

        // 2. Fetch Videos
        const res = await fetch("/api/videos");
        if (!res.ok) {
          console.error("Failed to fetch videos:", res.status, res.statusText);
          setVideos([]);
          return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Videos data is not an array:", data);
          setVideos([]);
          return;
        }

        console.log(`Total videos from API: ${data.length}`);

        // Log first few videos to debug blobUrl format
        if (data.length > 0) {
          console.log(
            "RAW Sample videos from API response:",
            data.slice(0, 3).map((v) => ({
              id: v.id,
              fileName: v.fileName,
              blobUrl: v.blobUrl,
              blobUrlType: typeof v.blobUrl,
              blobUrlIsString: typeof v.blobUrl === "string",
              blobUrlLength:
                typeof v.blobUrl === "string" ? v.blobUrl.length : "N/A",
            })),
          );
        }

        // Helper function to normalize blobUrl
        const normalizeBlobUrl = (blobUrl: any): string => {
          // Handle null/undefined
          if (!blobUrl) return "";

          // Already a valid string
          if (typeof blobUrl === "string") {
            return blobUrl.length > 0 ? blobUrl : "";
          }

          // Handle object - might be serialization issue
          if (typeof blobUrl === "object") {
            // Try common object properties that might contain the URL
            if (blobUrl.url) return String(blobUrl.url);
            if (blobUrl.href) return String(blobUrl.href);
            if (blobUrl.value) return String(blobUrl.value);

            // Try to get any string property
            for (const key in blobUrl) {
              const val = blobUrl[key];
              if (typeof val === "string" && val.length > 0) {
                return val;
              }
            }

            // Empty object - return empty string
            return "";
          }

          // For any other type, try to convert to string
          const strVal = String(blobUrl);
          return strVal !== "[object Object]" ? strVal : "";
        };

        // Filter and process videos
        const validVideos = data
          .filter((video) => {
            // Video must exist and have an ID
            if (!video || !video.id) return false;

            // Filter by Progress:
            // Show if video week is less than current progress week
            // OR if video week is equal to current progress week AND video day is less than or equal to current progress day
            const videoWeek = video.week || 0;
            const videoDay = video.day || 0;

            const isReleased =
              videoWeek < progressWeek ||
              (videoWeek === progressWeek && videoDay <= progressDay);
            if (!isReleased) return false;

            const normalizedBlobUrl = normalizeBlobUrl(video.blobUrl);

            // Check if we have a valid blobUrl
            const hasValidBlobUrl =
              normalizedBlobUrl.length > 0 &&
              (normalizedBlobUrl.startsWith("http://") ||
                normalizedBlobUrl.startsWith("https://"));

            const hasFileName = !!video.fileName;

            // Log videos that have issues
            if (!hasValidBlobUrl && video.blobUrl) {
              console.warn(
                `Video ${video.id} has problematic blobUrl - type: ${typeof video.blobUrl}, value:`,
                video.blobUrl,
                `fileName: ${video.fileName}`,
              );
            }

            // Include video if it has either valid blobUrl or fileName
            return hasValidBlobUrl || hasFileName;
          })
          .map((video) => {
            // Normalize blobUrl to always be a string
            const normalizedBlobUrl = normalizeBlobUrl(video.blobUrl);
            return { ...video, blobUrl: normalizedBlobUrl };
          })
          .sort((a, b) => {
            // Sort by Week descending, then Day descending
            if (b.week !== a.week) {
              return b.week - a.week;
            }
            return b.day - a.day;
          });

        console.log(
          `Loaded ${validVideos.length} valid and released videos from ${data.length} total`,
        );

        if (validVideos.length === 0 && data.length > 0) {
          console.warn("No valid videos after filtering.");
          console.warn(
            "First 3 videos:",
            data.slice(0, 3).map((v) => ({
              id: v.id,
              fileName: v.fileName,
              blobUrl: v.blobUrl,
            })),
          );
        }

        setVideos(validVideos);

        // Initialize stats for each valid video
        const initialStats: {
          [key: string]: { likes: number; comments: number };
        } = {};
        validVideos.forEach((video) => {
          initialStats[video.id] = { likes: 0, comments: 0 };
        });
        setVideoStats(initialStats);
      } catch (err) {
        console.error("Error fetching videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideosAndProgress();
  }, [authState.user?.id]);

  // Initialize video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, videos.length);
  }, [videos.length]);

  // Handle video playback when changing videos
  useEffect(() => {
    if (videos.length === 0) return;

    const currentRef = videoRefs.current[currentVideoIndex];
    if (currentRef) {
      const playPromise = currentRef.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
            console.error("Error playing video:", err);
          }
        });
      }
    }

    // Pause other videos
    videoRefs.current.forEach((videoRef, index) => {
      if (videoRef && index !== currentVideoIndex) {
        videoRef.pause();
        videoRef.currentTime = 0;
      }
    });
  }, [currentVideoIndex, videos.length]);

  const toggleMute = () => {
    videoRefs.current.forEach((videoRef) => {
      if (videoRef) {
        videoRef.muted = !isMuted;
      }
    });
    setIsMuted(!isMuted);
  };

  const toggleLike = async (videoId: string) => {
    if (!videoId || !currentUser) return;

    const userId = currentUser.name || "Anonymous";

    try {
      const response = await fetch("/api/video-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, userId, action: "like" }),
      });
      const result = await response.json();

      if (result.liked) {
        setLikedVideos((prev) => [...prev, videoId]);
      } else {
        setLikedVideos((prev) => prev.filter((id) => id !== videoId));
      }

      // Update stats
      setVideoStats((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          likes: prev[videoId]?.likes + (result.liked ? 1 : -1) || 1,
        },
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const toggleBookmark = (videoId: number) => {
    setBookmarkedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId],
    );
  };

  const goToNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const goToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const loadComments = async (videoId: string) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/video-comments?videoId=${videoId}`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentVideo || !currentUser) return;

    try {
      const response = await fetch("/api/video-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: (currentVideo as any).id,
          text: newComment,
          userId: currentUser.name || "Anonymous",
        }),
      });
      const comment = await response.json();
      setComments((prev) => [comment, ...prev]);
      setNewComment("");

      // Update comment count
      setVideoStats((prev) => ({
        ...prev,
        [(currentVideo as any).id]: {
          ...prev[(currentVideo as any).id],
          comments: (prev[(currentVideo as any).id]?.comments || 0) + 1,
        },
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Load comments when video changes
  useEffect(() => {
    if (currentVideo && showComments) {
      loadComments((currentVideo as any).id);
    }
  }, [currentVideoIndex, showComments]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary-red border-t-transparent"></div>
          </div>
          <p className="text-descriptions-grey text-lg font-medium">
            Loading videos...
          </p>
        </div>
      </div>
    );
  }

  const validVideos = videos.filter((video) => !brokenVideoIds.has(video.id));

  if (validVideos.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">
            No videos available
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Videos will appear here once they are uploaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col px-2 xs:px-3 sm:px-4 md:px-6">
        {/* Video Player Container - Responsive height */}
        <div
          className="m-1 h-[40vh] w-full overflow-hidden rounded-lg border border-gray-200 xs:m-2 xs:h-[45vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh]"
          ref={containerRef}
        >
          {/* Video container - completely clean */}
          <div className="relative h-full w-full">
            {validVideos.map((video, index) => (
              <div
                key={video.id}
                className={`absolute left-0 top-0 h-full w-full transition-opacity duration-300 ${
                  index === currentVideoIndex
                    ? "z-10 opacity-100"
                    : "z-0 opacity-0"
                }`}
              >
                {video.blobUrl &&
                typeof video.blobUrl === "string" &&
                video.blobUrl.length > 0 ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    className="h-full w-full object-cover"
                    src={video.blobUrl}
                    loop
                    playsInline
                    muted={isMuted}
                    controls={true}
                    preload="metadata"
                    aria-label={`Video: Week ${video.week} Day ${video.day}`}
                    onError={(e) => {
                      const videoId = video.id;

                      // Prevent duplicate error handling
                      if (errorHandledRef.current.has(videoId)) return;
                      errorHandledRef.current.add(videoId);

                      const error = e.currentTarget.error;
                      console.warn(`Video error for ${videoId}:`, {
                        code: error?.code,
                        message: error?.message,
                        blobUrl: video.blobUrl,
                      });

                      setBrokenVideoIds((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(videoId);
                        return newSet;
                      });
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-100">
                    <p className="font-semibold text-gray-600">
                      Video Cannot Load
                    </p>
                    <p className="text-sm text-gray-500">
                      {video.fileName
                        ? `File: ${video.fileName}`
                        : "No video file available"}
                    </p>
                    <p className="max-w-xs text-center text-xs text-gray-400">
                      {video.blobUrl
                        ? `URL: ${video.blobUrl.substring(0, 100)}...`
                        : "No URL provided"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* All Content Below Video - Uses remaining viewport */}
        <div className="flex flex-1 flex-col px-2 pb-2 xs:px-3 xs:pb-4 sm:px-4 md:px-6">
          {/* Fixed Navigation Controls */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white py-1 xs:py-2 sm:py-4">
            {/* Previous Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-gray-300 px-1 py-1 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 xs:px-2 sm:px-4 sm:py-2"
                  onClick={goToPreviousVideo}
                  disabled={currentVideoIndex === 0}
                  aria-label="Previous video"
                >
                  <ChevronUp className="mr-0 h-3 w-3 xs:mr-1 xs:h-4 xs:w-4 sm:mr-2 sm:h-5 sm:w-5" />
                  <span className="hidden text-xs sm:inline sm:text-sm">
                    Previous
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Previous Video</p>
              </TooltipContent>
            </Tooltip>

            {/* Video Progress Indicators */}
            <div
              className="scrollbar-hide flex max-w-[80px] gap-0.5 overflow-x-auto px-1 xs:max-w-[120px] xs:gap-1 sm:max-w-[200px] sm:gap-3 sm:px-2 md:max-w-md"
              role="tablist"
              aria-label="Video navigation"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {validVideos.map((video, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`h-1.5 w-4 flex-shrink-0 rounded-full transition-all duration-200 xs:h-2 xs:w-6 sm:h-3 sm:w-10 ${
                        index === currentVideoIndex
                          ? "bg-gray-800"
                          : "bg-gray-300 hover:bg-gray-500"
                      }`}
                      role="tab"
                      aria-selected={index === currentVideoIndex}
                      aria-label={`Go to video ${index + 1}: Week ${video.week} Day ${video.day}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Video {index + 1}: Week {video.week} Day {video.day}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Next Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-gray-300 px-1 py-1 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 xs:px-2 sm:px-4 sm:py-2"
                  onClick={goToNextVideo}
                  disabled={currentVideoIndex === validVideos.length - 1}
                  aria-label="Next video"
                >
                  <span className="hidden text-xs sm:inline sm:text-sm">
                    Next
                  </span>
                  <ChevronDown className="ml-0 h-3 w-3 xs:ml-1 xs:h-4 xs:w-4 sm:ml-2 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next Video</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 space-y-2 overflow-y-auto xs:space-y-3 sm:space-y-4">
            {/* Video Title and Info */}
            <div className="px-2 text-center">
              <div className="text-base font-bold leading-tight text-gray-800 xs:text-lg sm:text-xl md:text-2xl">
                Week {currentVideo?.week} Day {currentVideo?.day}
              </div>
              <div className="mt-1 text-xs text-gray-600 xs:text-sm sm:mt-2 sm:text-base">
                {currentVideo?.firstName} {currentVideo?.lastName} • Cohort{" "}
                {currentVideo?.cohort}
              </div>
            </div>

            {/* Video Controls and Profile */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-2">
              {/* Mute/Unmute button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMute}
                    className="rounded-full px-2 py-1 text-xs xs:px-3 xs:text-sm sm:px-4 sm:py-2"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                  >
                    {isMuted ? (
                      <VolumeX
                        size={14}
                        className="xs:h-4 xs:w-4 sm:h-[18px] sm:w-[18px]"
                      />
                    ) : (
                      <Volume2
                        size={14}
                        className="xs:h-4 xs:w-4 sm:h-[18px] sm:w-[18px]"
                      />
                    )}
                    <span className="ml-1 sm:ml-2">
                      {isMuted ? "Unmute" : "Mute"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? "Unmute" : "Mute"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Profile */}
              <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
                <Avatar className="h-6 w-6 border-2 border-gray-300 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
                  <AvatarFallback className="text-xs xs:text-sm">
                    {currentVideo?.firstName?.[0]}
                    {currentVideo?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs text-gray-600 xs:text-sm">
                  {currentVideo?.firstName} {currentVideo?.lastName}
                </div>
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center justify-center gap-2 px-2 xs:gap-4 sm:gap-6 md:gap-10">
              {/* Like */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-700 hover:bg-red-50 hover:text-red-500 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"
                      onClick={() => toggleLike(currentVideo?.id)}
                      aria-label={
                        currentVideo && likedVideos.includes(currentVideo.id)
                          ? "Unlike video"
                          : "Like video"
                      }
                    >
                      <Heart
                        className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${currentVideo && likedVideos.includes(currentVideo.id) ? "fill-red-500 text-red-500" : "fill-transparent"}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {currentVideo && likedVideos.includes(currentVideo.id)
                        ? "Unlike"
                        : "Like"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="mt-0.5 text-xs font-semibold text-gray-700 xs:mt-1 xs:text-sm">
                  {currentStats.likes}
                </span>
              </div>

              {/* Comments */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-700 hover:bg-blue-50 hover:text-blue-500 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"
                      onClick={() => {
                        setShowComments(!showComments);
                        if (!showComments && currentVideo) {
                          loadComments(currentVideo.id);
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Comments</p>
                  </TooltipContent>
                </Tooltip>
                <span className="mt-0.5 text-xs font-semibold text-gray-700 xs:mt-1 xs:text-sm">
                  {currentStats.comments}
                </span>
              </div>
              {/* Comments */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-700 hover:bg-blue-50 hover:text-blue-500 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"
                      onClick={() => {
                        setShowComments(!showComments);
                        if (!showComments && currentVideo) {
                          loadComments(currentVideo.id);
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Comments</p>
                  </TooltipContent>
                </Tooltip>
                <span className="mt-0.5 text-xs font-semibold text-gray-700 xs:mt-1 xs:text-sm">
                  {currentStats.comments}
                </span>
              </div>

              {/* Bookmark */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-700 hover:bg-yellow-50 hover:text-yellow-500 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"
                      onClick={() => toggleBookmark(currentVideo?.id)}
                      aria-label={
                        currentVideo &&
                        bookmarkedVideos.includes(currentVideo.id)
                          ? "Remove bookmark"
                          : "Bookmark video"
                      }
                    >
                      <Bookmark
                        className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${currentVideo && bookmarkedVideos.includes(currentVideo.id) ? "fill-yellow-500 text-yellow-500" : "fill-transparent"}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {currentVideo &&
                      bookmarkedVideos.includes(currentVideo.id)
                        ? "Remove Bookmark"
                        : "Bookmark"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="mt-0.5 text-xs font-semibold text-gray-700 xs:mt-1 xs:text-sm">
                  0
                </span>
              </div>

              {/* Share */}
            </div>

            {/* Video Info */}
            <div className="px-2 text-center text-gray-600">
              <div className="text-xs xs:text-sm">
                Uploaded:{" "}
                {currentVideo &&
                  new Date(currentVideo.createdAt).toLocaleDateString()}
              </div>
              <div className="break-all text-xs xs:text-sm">
                File: {currentVideo?.fileName}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              Video {currentVideoIndex + 1} of {videos.length}
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mx-2 rounded-lg bg-gray-50 p-2 xs:p-3 sm:p-4">
                <h3 className="mb-2 text-sm font-semibold xs:mb-3 xs:text-base">
                  Comments
                </h3>

                {/* Add Comment */}
                <div className="mb-3 flex gap-1 xs:mb-4 xs:gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-lg border px-2 py-1 text-xs xs:px-3 xs:py-2 xs:text-sm sm:text-base"
                    onKeyPress={(e) => e.key === "Enter" && addComment()}
                  />
                  <Button
                    onClick={addComment}
                    size="sm"
                    className="px-2 text-xs xs:px-3 xs:text-sm"
                  >
                    Post
                  </Button>
                </div>

                {/* Comments List */}
                <div className="max-h-24 space-y-2 overflow-y-auto xs:max-h-32 xs:space-y-3 sm:max-h-40">
                  {loadingComments ? (
                    <div className="flex justify-center py-3 xs:py-4">
                      <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-gray-600 xs:h-4 xs:w-4 sm:h-6 sm:w-6"></div>
                      <span className="ml-2 text-xs text-gray-600 xs:text-sm">
                        Loading comments...
                      </span>
                    </div>
                  ) : (
                    Array.isArray(comments) &&
                    comments.map((comment: any, index: number) => (
                      <div
                        key={comment.id || index}
                        className="rounded bg-white p-2 xs:p-3"
                      >
                        <div className="text-xs font-medium xs:text-sm">
                          {comment.userId}
                        </div>
                        <div className="text-xs text-gray-700 xs:text-sm">
                          {comment.text}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
