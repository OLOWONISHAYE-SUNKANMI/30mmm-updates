"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaReply, FaThumbsUp } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import SortByPill from "./SortByPillBox";
import JoinConversationButton from "./JoinConversationButton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDevotionalContext } from "@/contexts/DevotionalContext";

export default function DiscussionPlane({ week, day, userId, devotionalDataId, devotionalNumberId }) {
  const [selectedTab, setSelectedTab] = useState("comments"); // 'comments' or 'notes'
  const [comments, setComments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sortOption, setSortOption] = useState("Most Recent");
  const [loading, setLoading] = useState(false);
  
  // For replies
  const [replyingTo, setReplyingTo] = useState(null); // commentId
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set()); // set of commentIds
  const [repliesData, setRepliesData] = useState({}); // { commentId: [replies] }

  const router = useRouter();
  const devotionalContext = useDevotionalContext();
  const refreshNotesVersion = devotionalContext?.refreshNotesVersion;

  // Fetch comments
  useEffect(() => {
    if (!week || !day) return;
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/comments?week=${week}&day=${day}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [week, day]);

  // Fetch notes (reflections)
  useEffect(() => {
    if (!week || !day) return;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/reflections?week=${week}&day=${day}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out any blank text reflections
          const validNotes = data.filter(n => n.response && n.response.trim().length > 0);
          setNotes(validNotes);
        }
      } catch (err) {
        console.error("Failed to fetch notes", err);
      }
    };
    fetchNotes();
  }, [week, day, refreshNotesVersion]);

  // Sort function
  const sortItems = (items) => {
    const copy = [...items];
    switch (sortOption) {
      case "Most Liked":
        copy.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case "Most Replies":
        copy.sort((a, b) => (b.repliesCount || 0) - (a.repliesCount || 0));
        break;
      case "Oldest":
        copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "Most Recent":
      default:
        copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return copy;
  };

  const handleLike = async (item, type) => {
    const isComment = type === 'comment';
    const baseUrl = isComment ? `/api/comments/${item.id}/like` : `/api/reflections/${item.id}/like`;
    const method = item.hasLiked ? 'DELETE' : 'POST';

    try {
      const res = await fetch(baseUrl, { method });
      if (res.status === 401) {
        toast.error("Please log in to like.");
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to toggle like");
      
      const data = await res.json();
      
      // Update local state
      const updateFn = (prevItems) => 
        prevItems.map(i => i.id === item.id ? { ...i, hasLiked: data.hasLiked, likesCount: data.likesCount } : i);

      if (isComment) {
        setComments(updateFn);
      } else {
        setNotes(updateFn);
      }
    } catch (err) {
      toast.error("Failed to like.");
    }
  };

  const loadReplies = async (commentId) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/replies`);
      if (res.ok) {
        const data = await res.json();
        setRepliesData(prev => ({ ...prev, [commentId]: data }));
      }
    } catch (err) {
      console.error("Failed to fetch replies", err);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
        if (!repliesData[commentId]) {
          loadReplies(commentId);
        }
      }
      return newSet;
    });
  };

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: parseInt(week, 10),
          day: parseInt(day, 10),
          text: replyText,
          parentId
        })
      });

      if (res.status === 401) {
        toast.error("Please log in to reply.");
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to post reply");
      
      const newReply = await res.json();
      
      // Add to replies array
      setRepliesData(prev => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), newReply]
      }));

      // Update reply count on parent
      setComments(prev => prev.map(c => 
        c.id === parentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c
      ));

      setReplyText("");
      setReplyingTo(null);
      // Ensure it's expanded so user sees their reply
      setExpandedReplies(prev => new Set(prev).add(parentId));
    } catch (err) {
      toast.error("Failed to post reply.");
    }
  };


  const renderDiscussionItem = (item, type = "comment", isReply = false) => {
    const isComment = type === "comment";
    const userName = item.user?.name || "Anonymous User";
    const userImage = item.user?.image || "/images/avatar/blank-profile.webp";
    const dateStr = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
    
    // Determine the text to show (comments use "text", reflections use "response")
    const textContent = isComment ? item.text : item.response;

    if (!textContent || textContent.trim().length === 0) return null;

    return (
      <div
        key={item.id}
        className={`my-2 flex items-start rounded-lg bg-white p-4 shadow ${isReply ? 'ml-10 border-l-2 border-gray-200' : ''}`}
      >
        <Image
          src={userImage}
          alt={userName}
          width={40}
          height={40}
          className="mr-4 h-10 w-10 rounded-full object-cover"
        />

        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold text-gray-800">{userName}</p>
            <span className="text-xs text-gray-500">{dateStr}</span>
          </div>

          <p className="mb-3 text-gray-700 whitespace-pre-wrap">{textContent}</p>

          <div className="flex space-x-6 text-sm">
            <button 
              onClick={() => handleLike(item, type)}
              className={`flex items-center space-x-1 hover:text-[#8B2A28] ${item.hasLiked ? 'text-[#8B2A28]' : 'text-gray-600'}`}
            >
              <FaThumbsUp />
              <span>{item.likesCount || 0}</span>
            </button>
            
            {isComment && !isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                className="flex items-center space-x-1 text-gray-600 hover:text-[#8B2A28]"
              >
                <FaReply />
                <span>Reply</span>
              </button>
            )}

            {isComment && !isReply && item.repliesCount > 0 && (
              <button 
                onClick={() => toggleReplies(item.id)}
                className="text-[#8B2A28] hover:underline text-xs ml-auto"
              >
                {expandedReplies.has(item.id) ? 'Hide Replies' : `View ${item.repliesCount} Replies`}
              </button>
            )}
          </div>

          {/* Reply input area */}
          {replyingTo === item.id && (
            <div className="mt-3 flex flex-col space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B2A28] focus:border-transparent transition-all resize-none" 
                rows="2"
              />
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => submitReply(item.id)}
                  className="px-3 py-1 text-xs text-white bg-[#8B2A28] rounded hover:bg-[#AF3634]"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Render Replies */}
          {expandedReplies.has(item.id) && repliesData[item.id] && (
            <div className="mt-4 space-y-2">
              {repliesData[item.id].map(reply => renderDiscussionItem(reply, "comment", true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const sortedComments = sortItems(comments);
  const sortedNotes = sortItems(notes);

  return (
    <div className="items-center w-full space-y-5">
      <div className="flex flex-row items-center justify-between w-full">
        {/* Tab Selection */}
        <div className="flex rounded-full bg-gray-200 text-sm font-semibold shadow-sm">
          <button
            onClick={() => setSelectedTab("comments")}
            className={`rounded-l-full px-4 py-2 transition-colors ${
              selectedTab === "comments"
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Comments <span className="ml-1 opacity-75">({comments.length})</span>
          </button>
          <button
            onClick={() => setSelectedTab("notes")}
            className={`rounded-r-full px-4 py-2 transition-colors ${
              selectedTab === "notes"
                ? "bg-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Notes <span className="ml-1 opacity-75">({notes.length})</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedTab === "comments" || selectedTab === "notes" ? (
              <SortByPill onSortChange={setSortOption} />    
          ) : null}
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-4 pb-10">
        {!week || !day ? (
          <div className="text-center py-10 text-gray-500 italic">
            Select a devotional day to see discussions.
          </div>
        ) : loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : selectedTab === "comments" ? (
          sortedComments.length > 0 ? (
            sortedComments.map(comment => renderDiscussionItem(comment, "comment"))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500 italic">
              No comments yet. Be the first to join the conversation!
            </div>
          )
        ) : (
          sortedNotes.length > 0 ? (
            sortedNotes.map(note => renderDiscussionItem(note, "note"))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500 italic">
              No notes from other users for this day yet.
            </div>
          )
        )}
      </div>

      <JoinConversationButton 
              week={week} 
              day={day} 
              userId={userId}
              devotionalDataId={devotionalDataId}
              devotionalNumberId={devotionalNumberId}
              onCommentAdded={(newItem, tabType) => {
                if (tabType === "comment") {
                  setComments(prev => [newItem, ...prev]);
                  setSelectedTab("comments");
                } else if (tabType === "note") {
                  // If the Note submission returns valid reflection shape, push it, otherwise fetch
                  if (newItem && newItem.id) {
                    setNotes(prev => [newItem, ...prev]);
                  }
                  setSelectedTab("notes");
                }
              }} 
            />
    </div>
  );
}