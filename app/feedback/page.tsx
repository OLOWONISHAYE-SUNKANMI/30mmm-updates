"use client";

import React from "react";

export default function Page() {
  const postArray = [
    {
      id: "1",
      title: "Good to fix",
      text: "fix this bug",
      type: "bug_report",
      createdAt: new Date(),
      votes: 1,
    },
  ];

  const handleClick = () => {
    console.log("TODO: feedback submission");
  };
  return (
    <div>
      {/* Header */}
      <div
        id="header-container"
        className="mt-32 flex flex-col rounded-sm border-2 border-primary-red p-16 shadow-md"
      >
        <div className="flex flex-row">
          <div className="">
            filter: all posts, general feedback, feature request, bug report
          </div>
          <div>Roadmap (Coming Soon hover state)</div>
        </div>
        {/* to add: roadmap button */}
      </div>
      <div id="body-container">
        <div id="top-row">
          <button onClick={handleClick}>
            <div>plus icon</div> Feedback Button
          </button>
          {postArray.map((post, index) => (
            <div
              key={index}
              id="container"
            >
              <div>{post.title}</div>
              <div>{post.text}</div>
              <button>
                <div>up arrow</div>
                <div>{post.votes}</div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
