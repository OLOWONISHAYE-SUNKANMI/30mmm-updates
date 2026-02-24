"use client";

import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  User,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProgress } from "@/actions/user-progress";
import { calculateWeekAndDay } from "@/lib/calculateWeekAndDay";
import { toast } from "sonner";


export default function VideoPlayer() {
  const { authState } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<any[]>([]);
  const [brokenVideoIds, setBrokenVideoIds] = useState<Set<number>>(new Set());
  const [videoStats, setVideoStats] = useState<{ [key: string]: { likes: number, comments: number } }>({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const errorHandledRef = useRef<Set<number>>(new Set());

  // Progress state
  const [currentUserProgress, setCurrentUserProgress] = useState<{ week: number; day: number } | null>(null);

  const shareVideo = async (platform: string) => {
    if (!currentVideo) return;

    const videoUrl = `${window.location.origin}/dashboard/videos?v=${currentVideo.id}`;
    const title = `Check out this video: Week ${currentVideo.week} Day ${currentVideo.day}`;
    const text = `${title} - ${currentVideo.description || 'CLEAN Program Video'}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(videoUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${videoUrl}`)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(videoUrl);
          toast.success('Link copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy:', err);
          const textArea = document.createElement('textarea');
          textArea.value = videoUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          toast.success('Link copied to clipboard!');
        }
        break;
    }
    setShowShareMenu(false);
  };
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentVideoIndex];
  const currentStats = currentVideo ? videoStats[(currentVideo as any).id] || { likes: 0, comments: 0 } : { likes: 0, comments: 0 };
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
        const res = await fetch('/api/videos');
        if (!res.ok) {
          console.error('Failed to fetch videos:', res.status, res.statusText);
          setVideos([]);
          return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error('Videos data is not an array:', data);
          setVideos([]);
          return;
        }

        console.log(`Total videos from API: ${data.length}`);

        // Log first few videos to debug blobUrl format
        if (data.length > 0) {
          console.log('RAW Sample videos from API response:', data.slice(0, 3).map(v => ({
            id: v.id,
            fileName: v.fileName,
            blobUrl: v.blobUrl,
            blobUrlType: typeof v.blobUrl,
            blobUrlIsString: typeof v.blobUrl === 'string',
            blobUrlLength: typeof v.blobUrl === 'string' ? v.blobUrl.length : 'N/A',
          })));
        }

        // Helper function to normalize blobUrl
        const normalizeBlobUrl = (blobUrl: any): string => {
          // Handle null/undefined
          if (!blobUrl) return '';

          // Already a valid string
          if (typeof blobUrl === 'string') {
            return blobUrl.length > 0 ? blobUrl : '';
          }

          // Handle object - might be serialization issue
          if (typeof blobUrl === 'object') {
            // Try common object properties that might contain the URL
            if (blobUrl.url) return String(blobUrl.url);
            if (blobUrl.href) return String(blobUrl.href);
            if (blobUrl.value) return String(blobUrl.value);

            // Try to get any string property
            for (const key in blobUrl) {
              const val = blobUrl[key];
              if (typeof val === 'string' && val.length > 0) {
                return val;
              }
            }

            // Empty object - return empty string
            return '';
          }

          // For any other type, try to convert to string
          const strVal = String(blobUrl);
          return strVal !== '[object Object]' ? strVal : '';
        };

        // Filter and process videos
        const validVideos = data.filter(video => {
          // Video must exist and have an ID
          if (!video || !video.id) return false;

          // Filter by Progress:
          // Show if video week is less than current progress week
          // OR if video week is equal to current progress week AND video day is less than or equal to current progress day
          const videoWeek = video.week || 0;
          const videoDay = video.day || 0;

          const isReleased = videoWeek < progressWeek || (videoWeek === progressWeek && videoDay <= progressDay);
          if (!isReleased) return false;


          const normalizedBlobUrl = normalizeBlobUrl(video.blobUrl);

          // Check if we have a valid blobUrl
          const hasValidBlobUrl = normalizedBlobUrl.length > 0 &&
            (normalizedBlobUrl.startsWith('http://') || normalizedBlobUrl.startsWith('https://'));

          const hasFileName = !!video.fileName;

          // Log videos that have issues
          if (!hasValidBlobUrl && video.blobUrl) {
            console.warn(`Video ${video.id} has problematic blobUrl - type: ${typeof video.blobUrl}, value:`, video.blobUrl, `fileName: ${video.fileName}`);
          }

          // Include video if it has either valid blobUrl or fileName
          return hasValidBlobUrl || hasFileName;
        }).map(video => {
          // Normalize blobUrl to always be a string
          const normalizedBlobUrl = normalizeBlobUrl(video.blobUrl);
          return { ...video, blobUrl: normalizedBlobUrl };
        }).sort((a, b) => {
          // Sort by Week descending, then Day descending
          if (b.week !== a.week) {
            return b.week - a.week;
          }
          return b.day - a.day;
        });

        console.log(`Loaded ${validVideos.length} valid and released videos from ${data.length} total`);

        if (validVideos.length === 0 && data.length > 0) {
          console.warn('No valid videos after filtering.');
          console.warn('First 3 videos:', data.slice(0, 3).map(v => ({
            id: v.id,
            fileName: v.fileName,
            blobUrl: v.blobUrl,
          })));
        }

        setVideos(validVideos);

        // Initialize stats for each valid video
        const initialStats: { [key: string]: { likes: number; comments: number } } = {};
        validVideos.forEach(video => {
          initialStats[video.id] = { likes: 0, comments: 0 };
        });
        setVideoStats(initialStats);
      } catch (err) {
        console.error('Error fetching videos:', err);
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
          if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
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

    const userId = currentUser.name || 'Anonymous';

    try {
      const response = await fetch('/api/video-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, userId, action: 'like' })
      });
      const result = await response.json();

      if (result.liked) {
        setLikedVideos(prev => [...prev, videoId]);
      } else {
        setLikedVideos(prev => prev.filter(id => id !== videoId));
      }

      // Update stats
      setVideoStats(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          likes: prev[videoId]?.likes + (result.liked ? 1 : -1) || 1
        }
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
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
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentVideo || !currentUser) return;

    try {
      const response = await fetch('/api/video-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: (currentVideo as any).id,
          text: newComment,
          userId: currentUser.name || 'Anonymous'
        })
      });
      const comment = await response.json();
      setComments(prev => [comment, ...prev]);
      setNewComment('');

      // Update comment count
      setVideoStats(prev => ({
        ...prev,
        [(currentVideo as any).id]: {
          ...prev[(currentVideo as any).id],
          comments: (prev[(currentVideo as any).id]?.comments || 0) + 1
        }
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
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
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-red border-t-transparent animate-spin"></div>
          </div>
          <p className="text-descriptions-grey text-lg font-medium">Loading videos...</p>
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
      <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col px-2 xs:px-3 sm:px-4 md:px-6">
        {/* Video Player Container - Responsive height */}
        <div
          className="m-1 xs:m-2 h-[40vh] xs:h-[45vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] w-full overflow-hidden rounded-lg border border-gray-200"
          ref={containerRef}
        >
          {/* Video container - completely clean */}
          <div className="relative h-full w-full">
            {validVideos.map((video, index) => (
              <div
                key={video.id}
                className={`absolute left-0 top-0 h-full w-full transition-opacity duration-300 ${index === currentVideoIndex
                  ? "z-10 opacity-100"
                  : "z-0 opacity-0"
                  }`}
              >
                {video.blobUrl && typeof video.blobUrl === 'string' && video.blobUrl.length > 0 ? (
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
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

                      setBrokenVideoIds(prev => {
                        const newSet = new Set(prev);
                        newSet.add(videoId);
                        return newSet;
                      });
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 flex-col gap-3">
                    <p className="text-gray-600 font-semibold">Video Cannot Load</p>
                    <p className="text-gray-500 text-sm">
                      {video.fileName ? `File: ${video.fileName}` : 'No video file available'}
                    </p>
                    <p className="text-gray-400 text-xs max-w-xs text-center">
                      {video.blobUrl ? `URL: ${video.blobUrl.substring(0, 100)}...` : 'No URL provided'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* All Content Below Video - Uses remaining viewport */}
        <div className="flex-1 flex flex-col px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-4">
          {/* Fixed Navigation Controls */}
          <div className="flex items-center justify-between py-1 xs:py-2 sm:py-4 bg-white sticky top-0 z-10 border-b">
            {/* Previous Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-gray-300 px-1 xs:px-2 sm:px-4 py-1 sm:py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={goToPreviousVideo}
                  disabled={currentVideoIndex === 0}
                  aria-label="Previous video"
                >
                  <ChevronUp className="mr-0 xs:mr-1 sm:mr-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Previous</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Previous Video</p>
              </TooltipContent>
            </Tooltip>

            {/* Video Progress Indicators */}
            <div
              className="flex gap-0.5 xs:gap-1 sm:gap-3 overflow-x-auto max-w-[80px] xs:max-w-[120px] sm:max-w-[200px] md:max-w-md px-1 sm:px-2 scrollbar-hide"
              role="tablist"
              aria-label="Video navigation"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {validVideos.map((video, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`h-1.5 xs:h-2 sm:h-3 w-4 xs:w-6 sm:w-10 rounded-full transition-all duration-200 flex-shrink-0 ${index === currentVideoIndex
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
                  className="rounded-full border border-gray-300 px-1 xs:px-2 sm:px-4 py-1 sm:py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={goToNextVideo}
                  disabled={currentVideoIndex === validVideos.length - 1}
                  aria-label="Next video"
                >
                  <span className="text-xs sm:text-sm hidden sm:inline">Next</span>
                  <ChevronDown className="ml-0 xs:ml-1 sm:ml-2 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next Video</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Scrollable Content */}
          <div className="space-y-2 xs:space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            {/* Video Title and Info */}
            <div className="text-center px-2">
              <div className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold leading-tight text-gray-800">
                Week {currentVideo?.week} Day {currentVideo?.day}
              </div>
              <div className="mt-1 sm:mt-2 text-xs xs:text-sm sm:text-base text-gray-600">
                {currentVideo?.firstName} {currentVideo?.lastName} • Cohort {currentVideo?.cohort}
              </div>
            </div>

            {/* Video Controls and Profile */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-2">
              {/* Mute/Unmute button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMute}
                    className="rounded-full px-2 xs:px-3 sm:px-4 py-1 sm:py-2 text-xs xs:text-sm"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                  >
                    {isMuted ? <VolumeX size={14} className="xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px]" /> : <Volume2 size={14} className="xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px]" />}
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
                <Avatar className="h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-2 border-gray-300">
                  <AvatarFallback className="text-xs xs:text-sm">
                    {currentVideo?.firstName?.[0]}{currentVideo?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs xs:text-sm text-gray-600">
                  {currentVideo?.firstName} {currentVideo?.lastName}
                </div>
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center justify-center gap-2 xs:gap-4 sm:gap-6 md:gap-10 px-2">
              {/* Like */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full text-gray-700 hover:bg-red-50 hover:text-red-500"
                      onClick={() => toggleLike(currentVideo?.id)}
                      aria-label={currentVideo && likedVideos.includes(currentVideo.id) ? "Unlike video" : "Like video"}
                    >
                      <Heart
                        className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${currentVideo && likedVideos.includes(currentVideo.id) ? "fill-red-500 text-red-500" : "fill-transparent"}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{currentVideo && likedVideos.includes(currentVideo.id) ? "Unlike" : "Like"}</p>
                  </TooltipContent>
                </Tooltip>
                <span className="mt-0.5 xs:mt-1 text-xs xs:text-sm font-semibold text-gray-700">{currentStats.likes}</span>
              </div>

              {/* Comments */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full text-gray-700 hover:bg-blue-50 hover:text-blue-500"
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
                <span className="mt-0.5 xs:mt-1 text-xs xs:text-sm font-semibold text-gray-700">{currentStats.comments}</span>
              </div>
              {/* Comments */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full text-gray-700 hover:bg-blue-50 hover:text-blue-500"
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
                <span className="mt-0.5 xs:mt-1 text-xs xs:text-sm font-semibold text-gray-700">{currentStats.comments}</span>
              </div>

              {/* Bookmark */}
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full text-gray-700 hover:bg-yellow-50 hover:text-yellow-500"
                      onClick={() => toggleBookmark(currentVideo?.id)}
                      aria-label={currentVideo && bookmarkedVideos.includes(currentVideo.id) ? "Remove bookmark" : "Bookmark video"}
                    >
                      <Bookmark
                        className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${currentVideo && bookmarkedVideos.includes(currentVideo.id) ? "fill-yellow-500 text-yellow-500" : "fill-transparent"}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{currentVideo && bookmarkedVideos.includes(currentVideo.id) ? "Remove Bookmark" : "Bookmark"}</p>
                  </TooltipContent>
                </Tooltip>
                <span className="mt-0.5 xs:mt-1 text-xs xs:text-sm font-semibold text-gray-700">0</span>
              </div>

              {/* Share */}
              <div className="flex flex-col items-center relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full text-gray-700 hover:bg-green-50 hover:text-green-500"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      aria-label="Share video"
                    >
                      <Share2 className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share</p>
                  </TooltipContent>
                </Tooltip>
                <span className="mt-0.5 xs:mt-1 text-xs xs:text-sm font-semibold text-gray-700">0</span>

                {/* Share Menu */}
                {showShareMenu && (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowShareMenu(false)}
                  >
                    <div
                      className="bg-white rounded-2xl shadow-2xl p-4 xs:p-6 mx-2 xs:mx-4 max-w-xs xs:max-w-sm sm:max-w-md w-full transform animate-in zoom-in-95 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-center mb-4 xs:mb-6">
                        <h3 className="text-lg xs:text-xl font-semibold text-gray-900 mb-1 xs:mb-2">Share Video</h3>
                        <p className="text-xs xs:text-sm text-gray-500">Week {currentVideo?.week} Day {currentVideo?.day}</p>
                      </div>

                      <div className="space-y-2 xs:space-y-3">
                        <button
                          onClick={() => shareVideo('twitter')}
                          className="w-full flex items-center gap-3 xs:gap-4 px-3 xs:px-4 py-2 xs:py-3 text-left hover:bg-blue-50 rounded-xl transition-colors group"
                        >
                          <div className="w-8 h-8 xs:w-10 xs:h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm xs:text-base">X / Twitter</div>
                            <div className="text-xs xs:text-sm text-gray-500">Share on X</div>
                          </div>
                        </button>

                        <button
                          onClick={() => shareVideo('facebook')}
                          className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-blue-50 rounded-xl transition-colors group"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Facebook</div>
                            <div className="text-sm text-gray-500">Share on Facebook</div>
                          </div>
                        </button>

                        <button
                          onClick={() => shareVideo('whatsapp')}
                          className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-green-50 rounded-xl transition-colors group"
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">WhatsApp</div>
                            <div className="text-sm text-gray-500">Share on WhatsApp</div>
                          </div>
                        </button>

                        <button
                          onClick={() => shareVideo('copy')}
                          className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Copy Link</div>
                            <div className="text-sm text-gray-500">Copy to clipboard</div>
                          </div>
                        </button>
                      </div>

                      <button
                        onClick={() => setShowShareMenu(false)}
                        className="w-full mt-6 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="text-center text-gray-600 px-2">
              <div className="text-xs xs:text-sm">
                Uploaded: {currentVideo && new Date(currentVideo.createdAt).toLocaleDateString()}
              </div>
              <div className="text-xs xs:text-sm break-all">
                File: {currentVideo?.fileName}
              </div>
            </div>

          <div className="text-center text-gray-500 text-sm">
            Video {currentVideoIndex + 1} of {videos.length}
          </div>

            {/* Comments Section */}
            {showComments && (
              <div className="bg-gray-50 rounded-lg p-2 xs:p-3 sm:p-4 mx-2">
                <h3 className="font-semibold mb-2 xs:mb-3 text-sm xs:text-base">Comments</h3>

                {/* Add Comment */}
                <div className="flex gap-1 xs:gap-2 mb-3 xs:mb-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-2 xs:px-3 py-1 xs:py-2 border rounded-lg text-xs xs:text-sm sm:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <Button onClick={addComment} size="sm" className="text-xs xs:text-sm px-2 xs:px-3">
                    Post
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-2 xs:space-y-3 max-h-24 xs:max-h-32 sm:max-h-40 overflow-y-auto">
                  {loadingComments ? (
                    <div className="flex justify-center py-3 xs:py-4">
                      <div className="animate-spin rounded-full h-3 w-3 xs:h-4 xs:w-4 sm:h-6 sm:w-6 border-b-2 border-gray-600"></div>
                      <span className="ml-2 text-gray-600 text-xs xs:text-sm">Loading comments...</span>
                    </div>
                  ) : (
                    Array.isArray(comments) && comments.map((comment: any, index: number) => (
                      <div key={comment.id || index} className="bg-white p-2 xs:p-3 rounded">
                        <div className="font-medium text-xs xs:text-sm">{comment.userId}</div>
                        <div className="text-gray-700 text-xs xs:text-sm">{comment.text}</div>
                        <div className="text-xs text-gray-500 mt-1">
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