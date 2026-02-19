"use client";

export default function MainImage({ videoId }) {
  return (
    <div className="w-full max-w-4xl">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          id="player"
          type="text/html"
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
