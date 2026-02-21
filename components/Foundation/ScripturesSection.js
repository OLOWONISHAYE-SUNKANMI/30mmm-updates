import React from "react";

export default function ScripturesSection({ scriptures }) {
  // Handle both array and object formats for backwards compatibility
  const scriptureArray = Array.isArray(scriptures)
    ? scriptures
    : Object.values(scriptures || {});

  if (!scriptureArray || scriptureArray.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {scriptureArray.map((scripture, index) => (
        <div
          key={index}
          className="mb-16 items-center"
        >
          {/* Scripture Text */}
          <div className="mb-4 flex text-center text-xl font-bold max-xs:px-10 max-xs:text-lg lg:text-2xl">
            {scripture.text}
          </div>

          {/* Divider */}
          <div className="mx-auto w-2/3 border-t-2 border-t-[#F5BD4F] xs:w-3/4 xs:border-t-[3px] sm:w-4/5 md:w-96 md:border-t-[4px] lg:border-t-[5px]"></div>

          {/* Scripture Reference */}
          <div className="mx-auto pt-3 text-center font-semibold lg:text-xl">
            {scripture.book} {scripture.chapter}:{scripture.verse} (
            {scripture.translation})
          </div>
        </div>
      ))}
    </div>
  );
}
