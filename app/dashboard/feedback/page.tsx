"use client";

import React, { useEffect, useState } from "react";
import {
  createFeedback,
  fetchFeedback,
  upvoteUpdate,
} from "@/actions/feedback";
import { ChevronUp, Map, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Page() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [value, setValue] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    type: "general",
    url: "",
  });

  const { data: session } = useSession();
  const currentUserId = session?.user?.id as string | undefined;

  useEffect(() => {
    const loadFeedback = async () => {
      setIsLoadingPosts(true);
      const response = await fetchFeedback();

      if (response.success && response.data) {
        setPosts(response.data);
      } else {
        console.error("failed to fetch feedback", response.error);
      }
      setIsLoadingPosts(false);
    };
    loadFeedback();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (value === "all" || value === "") return true;
    return post.type === value;
  });

  const handleClick = () => {
    if (!currentUserId) {
      toast.error("Please sign in to submit feedback.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleUpVote = async (postId, currentUserId) => {
    if (!currentUserId) return;

    console.log("Upvoting post:", postId);
    const response = await upvoteUpdate(postId, currentUserId);

    if (response.success && response.data) {
      // FIX: Update the specific post in the array instead of adding a new one
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === postId ? response.data : post)),
      );
    } else {
      toast.error(response.error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const response = await createFeedback(
      {
        title: formData.title,
        text: formData.text,
        type: formData.type,
        url: formData.url,
      },
      currentUserId,
    );

    if (response.success && response.data) {
      setPosts([response.data, ...posts]);
      setFormData({ title: "", text: "", type: "general", url: "" });
      setIsModalOpen(false);

      toast.success("Feedback submitted successfully! Thanks!");

      // TODO: send response.data to slack for notifications
    } else {
      console.error(response.error);
      toast.error("Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div
        id="header-container"
        className="mx-auto max-w-5xl px-4 py-8 sm:px-8"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-x-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Feedback Board
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Have an issue with our site? Think something would be great to
              add?
              <br />
              Please upvote what others have said or tell us your idea for our
              next feature.
            </p>
            <h3 className="mt-4 text-sm font-medium sm:text-base">
              Choose the feedback you would like to see:
            </h3>
          </div>

          <Select
            onValueChange={setValue}
            value={value}
          >
            <SelectTrigger className="w-full border-gray-300 sm:w-[250px]">
              <SelectValue placeholder="Filter Feedback" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filter Options</SelectLabel>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="general">General Feedback</SelectItem>
                <SelectItem value="feature">Feature Requests</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="group relative w-fit">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-sm">
              <Map className="w-[36px] hover:text-primary-red sm:w-[18px]" />
              <span>Feature Roadmap</span>
            </button>
            <span className="pointer-events-none absolute -top-12 left-0 z-10 transform whitespace-nowrap rounded bg-slate-900 px-3 py-1.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 sm:left-1/2 sm:-translate-x-1/2">
              Public Roadmap <br />
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col rounded-md bg-gray-100 pb-20">
        <div className="mb-6 mt-8 flex w-full flex-col px-4 sm:px-8">
          <button
            onClick={handleClick}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-red px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-red-500 active:scale-95 sm:w-auto sm:self-end"
          >
            <Plus size={24} />
            <span className="text-lg">Feedback</span>
          </button>

          <div className="mx-auto flex w-full max-w-5xl flex-col gap-y-4">
            {isLoadingPosts ? (
              <div className="py-10 text-center">Loading posts...</div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => {
                // FIXED: Defining hasUpvoted inside the loop
                const hasUpvoted = post.upvoterIds?.includes(currentUserId);

                return (
                  <div
                    key={post.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-300 bg-white p-4 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-slate-800 sm:text-xl">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-600 sm:text-base">
                        {post.text}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs uppercase text-slate-400">
                          {post.type}
                        </span>
                        {post.url && (
                          <span className="max-w-[200px] truncate text-xs text-blue-500">
                            {post.url}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="group">
                      <button
                        className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2 transition-colors sm:px-4 ${
                          hasUpvoted
                            ? "cursor-default border-red-200 bg-red-50"
                            : "border-gray-100 bg-gray-50 hover:bg-white"
                        }`}
                        onClick={() => handleUpVote(post.id, currentUserId)}
                        disabled={hasUpvoted || !currentUserId}
                        title={!currentUserId ? "Sign in to upvote" : ""}
                      >
                        <ChevronUp
                          className={
                            hasUpvoted
                              ? "text-red-500"
                              : "text-primary-red group-hover:text-red-500"
                          }
                        />
                        <span
                          className={`font-bold ${
                            hasUpvoted ? "text-red-500" : ""
                          }`}
                        >
                          {post.votes || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-gray-500">
                No posts found for this category.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-800">
              Submit New Feedback
            </h2>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="E.g., Dark mode isn't working"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-red focus:outline-none focus:ring-1 focus:ring-primary-red"
                />
              </div>

              <div>
                <label
                  htmlFor="url"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  URL (from address bar) [optional]
                </label>
                <input
                  id="url"
                  name="url"
                  type="text"
                  // FIXED: Removed 'required' attribute
                  placeholder="E.g.: https://thecleanprogram.org/..."
                  value={formData.url}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-red focus:outline-none focus:ring-1 focus:ring-primary-red"
                />
              </div>

              <div>
                <label
                  htmlFor="text"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="text"
                  name="text"
                  required
                  rows={4}
                  placeholder="Please describe the issue..."
                  value={formData.text}
                  onChange={handleInputChange}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-red focus:outline-none focus:ring-1 focus:ring-primary-red"
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  Feedback Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2"
                >
                  <option value="general">General Feedback</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-5 py-2 font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary-red px-5 py-2 font-medium text-white shadow-md hover:bg-red-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
