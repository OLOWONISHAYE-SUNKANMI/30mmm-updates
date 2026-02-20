"use client";

import React, { useEffect, useState } from "react";
import { ChevronUp, Map, Plus } from "lucide-react";
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
  const postArray = [
    {
      id: "1",
      title: "Bug",
      text: "fix this bug",
      type: "bug",
      createdAt: new Date(),
      votes: 1,
    },
    {
      id: "2",
      title: "Feature",
      text: "this would be cool",
      type: "feature",
      createdAt: new Date(),
      votes: 1,
    },
    {
      id: "3",
      title: "Feedback",
      text: "keep up the good work",
      type: "general",
      createdAt: new Date(),
      votes: 1,
    },
  ];

  const [value, setValue] = useState("all");

  const filteredPosts = postArray.filter((post) => {
    if (value === "all" || value === "") return true;
    return post.type === value;
  });

  const handleClick = () => {
    console.log("TODO: feedback submission");
  };

  const handleUpVote = () => {
    console.log("TODO: upvote");
  };

  return (
    <div>
      {/* Header */}
      <div
        id="header-container"
        className="flex flex-col rounded-md border-2 border-primary-red p-6 shadow-md md:p-16"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-x-10">
          <Select
            onValueChange={setValue}
            value={value}
          >
            <div>
              <h1 className="mx-auto text-2xl font-bold">Give Feedback</h1>
              <p className="text-sm">
                Have an issue with our site? Think something would be great to
                add? Please upvote what others have said or tell us your idea
                for our next feature. We hope to bring it to you as quick as we
                can!
              </p>
              <h3 className="text-sm font-medium sm:text-base">
                Choose the feedback you would like to see:
              </h3>
            </div>
            <SelectTrigger className="w-full sm:w-[60%]">
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

          <div className="group relative w-max self-end sm:self-auto">
            <button className="p-2 sm:p-0">
              <Map className="hover:text-primary-red hover:shadow-sm" />
            </button>
            <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
              Public Roadmap <br />
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      <div
        id="body-container"
        className="flex min-h-screen flex-col rounded-md bg-gray-200"
      >
        <div
          id="top-row"
          className="mb-6 mt-8 flex w-full flex-col px-4 sm:px-8"
        >
          <button
            onClick={handleClick}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-red px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-red-500 hover:shadow-lg active:scale-95 sm:w-auto sm:self-end"
          >
            <Plus
              size={24}
              strokeWidth={2.5}
            />
            <span className="text-lg">Feedback</span>
          </button>

          <div
            id="list-container"
            className="mx-auto flex w-full max-w-5xl flex-col gap-y-4"
          >
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
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
                    <span className="font-mono text-xs uppercase text-slate-400">
                      {post.type}
                    </span>
                  </div>
                  <div className="group">
                    <button
                      className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 hover:bg-white sm:px-4"
                      onClick={handleUpVote}
                    >
                      <ChevronUp className="text-primary-red group-hover:text-red-500" />
                      <span className="font-bold">{post.votes}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-500">
                No posts found for this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
