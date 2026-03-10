"use client";

import { useEffect, useRef, useState } from "react";
import { getUserProgress } from "@/actions/user-progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Flag,
  Heart,
  MessageCircle,
  MoreVertical,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateWeekAndDay } from "@/lib/calculateWeekAndDay";
import Image from "next/image";



export default function VideoPlayer() {
  const { authState } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoIdFromUrl = searchParams.get('videoId');

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
  const errorHandledRef = useRef<Set<string>>(new Set());

  // Progress state
  const [currentUserProgress, setCurrentUserProgress] = useState<{
    week: number;
    day: number;
  } | null>(null);

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
            const videoWeek = Number(video.week) || 0;
            const videoDay = Number(video.day) || 0;

            const isReleased =
              videoWeek < progressWeek ||
              (videoWeek === progressWeek && videoDay <= progressDay);

            // Allow all if no progress found (e.g. initial load or error)
            const shouldInclude = !progressWeek ? true : isReleased;

            if (!shouldInclude) return false;

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

        // Find initial video index based on URL
        if (videoIdFromUrl) {
          const index = validVideos.findIndex(v => v.id === videoIdFromUrl);
          if (index !== -1) setCurrentVideoIndex(index);
        }

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

  // Sync URL when video changes
  useEffect(() => {
    if (currentVideo && (currentVideo as any).id !== videoIdFromUrl) {
      router.replace(`/dashboard/videos/player?videoId=${(currentVideo as any).id}`, { scroll: false });
    }
  }, [currentVideoIndex]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-8">
          {/* 30MMM Text Logo */}
          <div className="relative">
            <Image
              src="/images-2/Thirty Mighty Men Ministries - text logo.png"
              alt="30MMM Logo"
              width={400}
              height={100}
              className="object-contain"
            />
          </div>
          {/* Spinning ring below logo */}
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Loading submission...</p>
        </div>
      </div>
    );
  }

  const validVideos = videos.filter(video => !brokenVideoIds.has(video.id));

  if (validVideos.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg font-medium">No videos available</p>
          <p className="text-gray-500 text-sm mt-2">Videos will appear here once they are uploaded.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row gap-6 px-4 py-8">
        {/* Main Content Area (Left/Center) */}
        <div className="flex-1 flex flex-col space-y-6">

          {/* Video Player Container — 9:16 portrait */}
          <div
            className="relative w-full max-w-[450px] overflow-hidden rounded-xl bg-black shadow-2xl"
            style={{ aspectRatio: '9/16', maxHeight: '800px' }}
            ref={containerRef}
          >
            {currentVideo ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current[currentVideoIndex] = el;
                }}
                className="w-full h-full object-contain"
                src={currentVideo.blobUrl || currentVideo.url || currentVideo.videoUrl || currentVideo.file || ""}
                autoPlay
                controls
                playsInline
                muted={isMuted}
                onEnded={goToNextVideo}
                onError={(e) => {
                  console.error("Video player error:", e);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">Video not found.</div>
            )}
          </div>

          {/* Title & Stats Bar */}
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              Week {currentVideo?.week || '?'} Day {currentVideo?.day || '?'}: {(currentVideo?.firstName || currentVideo?.fileName || 'Anonymous')} {currentVideo?.lastName || ''}'s Submission
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-red-100 shadow-sm">
                  <AvatarFallback className="bg-red-50 text-red-700 font-bold">
                    {currentVideo?.firstName?.[0]}{currentVideo?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-gray-900">{currentVideo?.firstName} {currentVideo?.lastName}</div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cohort {currentVideo?.cohort}</div>
                </div>
                {/* Follow — greyed out (coming soon) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-4">
                        <Button
                          variant="outline"
                          disabled
                          className="rounded-full border-gray-300 text-gray-400 font-bold px-6 opacity-50 cursor-not-allowed"
                        >
                          Follow
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent><p>Coming soon</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* Like button — standalone pill */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full gap-2 px-4 bg-gray-100 hover:bg-gray-200 transition-colors ${currentVideo && likedVideos.includes(currentVideo.id) ? "text-red-500" : ""
                    }`}
                  onClick={() => toggleLike(currentVideo?.id)}
                >
                  <Heart size={18} className={currentVideo && likedVideos.includes(currentVideo.id) ? "fill-current" : ""} />
                  <span className="font-bold">{currentStats.likes}</span>
                </Button>

                {/* Save — greyed out (coming soon) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="secondary"
                          disabled
                          className="rounded-full gap-2 font-bold bg-gray-100 opacity-50 cursor-not-allowed"
                        >
                          <Bookmark size={18} />
                          Save
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent><p>Coming soon</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Three-dot menu with Report option */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="rounded-full bg-gray-100 hover:bg-gray-200">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 gap-2 cursor-pointer"
                      onClick={() => toast.info("Video reported. Thank you for your feedback.")}
                    >
                      <Flag size={15} />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Description area */}
            <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-700">
              <div className="font-bold mb-1">Uploaded {currentVideo && new Date(currentVideo.createdAt).toLocaleDateString()}</div>
              <p className="whitespace-pre-wrap">{currentVideo?.description || "A clean, intentional submission for the 30MMM program."}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <MessageCircle size={20} className="text-red-600" />
              {currentStats.comments} Comments
            </h3>

            <div className="flex gap-4 mb-8">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback>{authState.user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full border-b border-gray-300 focus:border-red-600 focus:outline-none py-1 bg-transparent text-sm"
                  onKeyPress={(e) => e.key === "Enter" && addComment()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" className="rounded-full text-xs" onClick={() => setNewComment("")}>Cancel</Button>
                  <Button size="sm" className="rounded-full px-6 text-xs bg-red-600 hover:bg-red-700 font-bold" onClick={addComment}>Comment</Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {loadingComments ? (
                <div className="flex justify-center py-4 text-gray-400"><div className="animate-spin mr-2">/</div>Loading...</div>
              ) : comments.map((comment: any, index) => (
                <div key={comment.id || index} className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{comment.userId?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{comment.userId}</span>
                      <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button className="text-xs text-gray-500 hover:text-red-600 font-medium">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side List Area (Right) */}
        <div className="lg:w-[400px] flex flex-col gap-4">
          <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-2">Related Submissions</h3>
          <div className="flex flex-col gap-3 max-h-[1200px] overflow-y-auto px-1 custom-scrollbar">
            {validVideos.map((video, index) => (
              <div
                key={video.id}
                className={`flex gap-3 group cursor-pointer p-1 rounded-lg transition-colors ${index === currentVideoIndex ? "bg-red-50" : "hover:bg-gray-100"}`}
                onClick={() => setCurrentVideoIndex(index)}
              >
                <div className="relative w-40 aspect-video rounded-md overflow-hidden bg-gray-900 flex-shrink-0">
                  <video
                    src={`${video.blobUrl || video.url || video.videoUrl || video.file || ""}#t=0.001`}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover pointer-events-none opacity-80"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-bold">W{video.week}D{video.day}</div>
                  {index === currentVideoIndex && (
                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                      <Play size={16} className="text-white fill-current" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <h4 className={`text-sm font-bold line-clamp-2 leading-tight ${index === currentVideoIndex ? "text-red-700" : "text-gray-900"}`}>
                    Week {video.week || '?'} Day {video.day || '?'}: {(video.firstName || video.fileName || 'Anonymous')} {video.lastName || ''}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">Cohort {video.cohort}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{video.likesCount || 0} likes</span>
                    <span>•</span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}