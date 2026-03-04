"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { submitTextReflection } from "@/actions/reflection-submission";

export default function JoinConversationButton({ week, day, onCommentAdded, userId, devotionalDataId, devotionalNumberId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (event, activeTab) => {
    event.preventDefault();
    if (!week || !day) {
      toast.error("Day context is missing. Please select a day first.");
      return;
    }

    const formData = new FormData(event.target);
    const content = formData.get("content"); // The comment or note content

    setIsSubmitting(true);
    
    if (activeTab === "comment") {
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            week: parseInt(week, 10),
            day: parseInt(day, 10),
            text: content
          })
        });

        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Please log in to comment.");
            router.push("/login");
            return;
          }
          throw new Error("Failed to post comment");
        }

        const newComment = await res.json();
        toast.success("Comment posted!");
        
        if (onCommentAdded) {
          onCommentAdded(newComment, "comment");
        }
        
        setIsModalOpen(false);
      } catch (error) {
        toast.error("Failed to post comment. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === "note") {
      try {
        if (!userId) {
          toast.error("Please log in to submit a reflection note.");
          router.push("/login");
          return;
        }

        const missing = [];
        if (!userId) missing.push("userId");
        if (!devotionalDataId) missing.push("devotionalDataId");
        if (!devotionalNumberId) missing.push("devotionalNumberId");
        if (!content || !content.trim()) missing.push("content");
        if (!week) missing.push("week");
        if (!day) missing.push("day");

        if (missing.length > 0) {
          toast.error(`Missing: ${missing.join(", ")}`);
          setIsSubmitting(false);
          return;
        }
        
        const result = await submitTextReflection(
          userId,
          devotionalDataId,
          devotionalNumberId,
          content,
          week,
          day,
        );
        
        if (!result.success) {
          throw new Error(result.error || "Failed to submit reflection");
        }
        
        toast.success("Reflection note posted!");
        
        // Wait briefly then refresh the page because reflections rely on full page layout right now
        // Optional: you can manually insert into the list if you have the full response shaped correctly
        if (onCommentAdded) {
          onCommentAdded(result.data, "note");
        }
        
        setIsModalOpen(false);
      } catch (error) {
        toast.error(error.message || "Failed to post reflection. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 w-full text-white bg-[#AF3634] rounded-md hover:bg-white hover:text-[#AF3634] hover:border-[#AF3634] hover:border-2"
        disabled={!week || !day}
      >
        Join the Conversation
      </button>

      {/* Modal for adding comment */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
