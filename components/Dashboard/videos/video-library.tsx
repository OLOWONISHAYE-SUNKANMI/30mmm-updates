"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDashboardContext } from "@/contexts/dashboard/dashboard-provider";
import { useAuth } from "@/contexts/AuthContext";
import {
    Play,
    Search,
    Filter,
    ChevronRight,
    ChevronLeft,
    LayoutGrid,
    List,
    Heart,
    MessageCircle,
    MoreVertical,
    Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { calculateWeekAndDay } from "@/lib/calculateWeekAndDay";

const VideoCard = ({ video }: { video: any }) => {
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    console.log("VideoCard rendering video:", video);

    useEffect(() => {
        if (isHovered && videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Auto-play might be blocked
                });
            }
        } else if (!isHovered && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isHovered]);

    return (
        <div
            className="relative flex-shrink-0 w-64 sm:w-80 aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 group shadow-md"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => router.push(`/dashboard/videos/player?videoId=${video.id}`)}
        >
            <video
                ref={videoRef}
                src={`${video.blobUrl || video.url || video.videoUrl || video.file || ""}#t=0.001`}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover pointer-events-none"
            />

            {/* Always visible overlay to darken video slightly for text readability */}
            <div className={`absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`} />

            {/* Play Button Icon (disappears on hover playback) */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                    <Play className="w-6 h-6 fill-white text-white" />
                </div>
            </div>

            {/* Week / Day Tag (Top Right) */}
            <div className={`absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                W{video.week}D{video.day}
            </div>

            {/* Bottom Info Gradient Area (always visible for identity) */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 flex flex-col justify-end transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-2'}`}>
                <h4 className="text-white font-bold text-sm sm:text-base line-clamp-1">{video.firstName || video.fileName || 'Anonymous'} {video.lastName || ''}</h4>
                <div className={`flex items-center gap-3 mt-2 text-white/90 text-xs font-semibold overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex items-center gap-1"><Heart className="w-3 h-3 fill-white" /> {video.likesCount || 0}</div>
                    <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3 fill-white" /> {video.commentsCount || 0}</div>
                    <div className="bg-red-600 px-1.5 py-0.5 rounded-sm text-[10px]">W{video.week}D{video.day}</div>
                </div>
            </div>
        </div>
    );
};

const VideoRow = ({ title, videos }: { title: string; videos: any[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!videos || videos.length === 0) return null;

    return (
        <div className="mb-10 relative group/row">
            <h3 className="text-xl font-bold mb-4 px-2 sm:px-0 flex items-center gap-2 text-gray-800">
                {title}
                <ChevronRight className="w-5 h-5 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer text-red-600" />
            </h3>

            <div className="relative group/scroll">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity ml-2 hidden sm:block"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 px-2 sm:px-0"
                >
                    {videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity mr-2 hidden sm:block"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default function VideoLibrary() {
    const context = useDashboardContext() as any;
    const userProgress = context?.userProgress || { currentWeek: 1, currentDay: 1 };
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDay, setFilterDay] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await fetch("/api/videos");
                if (res.ok) {
                    const data = await res.json();

                    if (!Array.isArray(data)) {
                        setVideos([]);
                        return;
                    }

                    // Helper function to normalize blobUrl
                    const normalizeBlobUrl = (blobUrl: any): string => {
                        if (!blobUrl) return "";
                        if (typeof blobUrl === "string") return blobUrl.length > 0 ? blobUrl : "";
                        if (typeof blobUrl === "object") {
                            if (blobUrl.url) return String(blobUrl.url);
                            if (blobUrl.href) return String(blobUrl.href);
                            if (blobUrl.value) return String(blobUrl.value);
                            for (const key in blobUrl) {
                                const val = blobUrl[key];
                                if (typeof val === "string" && val.length > 0) return val;
                            }
                            return "";
                        }
                        const strVal = String(blobUrl);
                        return strVal !== "[object Object]" ? strVal : "";
                    };

                    const validVideos = data.map((video) => {
                        const normalizedBlobUrl = normalizeBlobUrl(video.blobUrl);
                        return { ...video, blobUrl: normalizedBlobUrl };
                    });

                    setVideos(validVideos);
                }
            } catch (err) {
                console.error("Error fetching videos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const filteredVideos = videos.filter(v => {
        if (!v || !v.id) return false;

        // Ensure there is SOME kind of visual or file
        const hasValidBlobUrl = v.blobUrl && v.blobUrl.length > 0 && (v.blobUrl.startsWith("http://") || v.blobUrl.startsWith("https://"));
        const hasFileName = !!v.fileName;
        if (!hasValidBlobUrl && !hasFileName && !v.url && !v.videoUrl && !v.file) return false;

        const firstName = v.firstName || "";
        const lastName = v.lastName || "";
        const matchesSearch = `${firstName} ${lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDay = filterDay === "all" || (v.day && v.day.toString() === filterDay);
        return matchesSearch && matchesDay;
    }).sort((a, b) => {
        if (sortBy === "likes") return (b.likesCount || 0) - (a.likesCount || 0);
        if (sortBy === "comments") return (b.commentsCount || 0) - (a.commentsCount || 0);
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    const groupedVideos: Record<string, any[]> = {};
    filteredVideos.forEach(v => {
        const weekNum = v.week || 1;
        const key = `Week ${weekNum}`;
        if (!groupedVideos[key]) groupedVideos[key] = [];
        groupedVideos[key].push(v);
    });

    console.log("VideoLibrary Debug - Full Trace:", {
        receivedFromApi: videos.length,
        afterFilter: filteredVideos.length,
        groupedByWeek: Object.keys(groupedVideos).reduce((acc, key) => {
            acc[key] = groupedVideos[key].length;
            return acc;
        }, {} as Record<string, number>),
        userProgress: {
            currentWeek: userProgress?.currentWeek,
            currentDay: userProgress?.currentDay
        },
        searchQuery,
        filterDay
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Curating your library...</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Devotional Library</h1>
                    <p className="text-gray-500 font-medium">Explore submissions from your cohort and beyond</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by name..."
                            className="pl-10 w-full sm:w-64 border-gray-200 focus:border-red-600 focus:ring-red-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="bg-gray-100 border-none rounded-md px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-red-600"
                            value={filterDay}
                            onChange={(e) => setFilterDay(e.target.value)}
                        >
                            <option value="all">Day: All</option>
                            {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>Day {d}</option>)}
                        </select>

                        <select
                            className="bg-gray-100 border-none rounded-md px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-red-600"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Recent</option>
                            <option value="likes">Most Liked</option>
                            <option value="comments">Most Active</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Featured / This Week */}
            {userProgress?.currentWeek && groupedVideos[`Week ${userProgress.currentWeek}`] && (
                <VideoRow title="This Week" videos={groupedVideos[`Week ${userProgress.currentWeek}`]} />
            )}

            {/* Categorized Rows - Sorted by Week */}
            {Object.keys(groupedVideos)
                .sort((a, b) => {
                    const weekA = parseInt(a.replace('Week ', '')) || 0;
                    const weekB = parseInt(b.replace('Week ', '')) || 0;
                    return weekB - weekA; // Descending weeks
                })
                .map((week) => {
                    if (userProgress?.currentWeek && week === `Week ${userProgress.currentWeek}`) return null;
                    return <VideoRow key={week} title={week} videos={groupedVideos[week]} />;
                })}

            {filteredVideos.length === 0 && (
                <div className="text-center py-32 border-2 border-dashed border-gray-100 rounded-3xl">
                    <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No videos found matching your criteria</h3>
                </div>
            )}
        </div>
    );
}
