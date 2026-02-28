import React from "react";
import DiscussionPlane from "./DiscussionPlane";
import JoinConversationButton from "./JoinConversationButton";

function DiscussionSection({ week, day, userId, devotionalDataId, devotionalNumberId }) {
  return (
    <div>
      {" "}
      {/* Discussions Section */}
      <div className="mb-4 mt-[2vh] text-xl font-semibold text-gray-800">
        Discussions
      </div>
      <div className="mx-0 flex flex-row items-center justify-between">
        <DiscussionPlane
          week={week}
          day={day}
          userId={userId}
          devotionalDataId={devotionalDataId}
          devotionalNumberId={devotionalNumberId}
        />
      </div>

    </div>
  );
}

export default DiscussionSection;
