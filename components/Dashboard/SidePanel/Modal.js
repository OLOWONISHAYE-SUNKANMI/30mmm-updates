"use client";

import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import { FaTimes } from "react-icons/fa";

export default function Modal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [activeTab, setActiveTab] = useState("comment");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the active tab type along with the event so the parent knows what to submit
    onSubmit(e, activeTab);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 1, pb: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-center w-full mb-2">
          <span className="text-xl font-semibold px-2">Join the Conversation</span>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <FaTimes />
          </IconButton>
        </div>
        
        {/* Tab Selection */}
        <div className="flex px-2 space-x-4 border-b">
          <button
            className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
              activeTab === "comment"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("comment")}
          >
            Comment
          </button>
          <button
            className={`pb-2 px-1 font-medium transition-colors border-b-2 ${
              activeTab === "note"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("note")}
          >
            Note (Reflection)
          </button>
        </div>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ borderBottom: 'none', pt: 3 }}>
          <textarea
            name="content"
            rows="5"
            placeholder={
              activeTab === "comment"
                ? "Share your thoughts on today's devotional..."
                : "Write your reflection note for today..."
            }
            className="w-full p-4 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            required
            disabled={isSubmitting}
          ></textarea>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 mr-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm"
          >
            {isSubmitting 
              ? "Submitting..." 
              : `Post ${activeTab === "comment" ? "Comment" : "Note"}`}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
