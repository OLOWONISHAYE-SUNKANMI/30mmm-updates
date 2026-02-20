"use client";

import React from "react";

export default function Page() {
  const postArray = [];

  const handleClick = () => {
    console.log("TODO: feedback submission");
  };
  return (
    <div>
      {/* Header */}
      <div id="header-container">
        <div>logo</div>
        <div>
          filter: all posts, general feedback, feature request, bug report
        </div>
        {/* to add: roadmap button */}
      </div>
      <div id="body-container">
        <div id="top-row">
          <button onClick={handleClick}>
            <div>plus icon</div> Feedback Button
          </button>
          {postArray.map((post, index) => (
            <div key={index}>{post}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
