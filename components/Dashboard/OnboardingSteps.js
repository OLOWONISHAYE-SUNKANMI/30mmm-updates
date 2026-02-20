export const onboardingSteps = [
  {
    target: "body",
    content: (
      <div>
        <h2 className="mb-2 text-xl font-bold">Welcome to 30MMM!</h2>
        <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=XnJz7y8z5z6c9v1s" // Placeholder URL
            title="Welcome Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="border-0"
          ></iframe>
        </div>
        <p>
          We're glad you're here. Watch this quick intro or click "Next" to
          take a tour of your dashboard.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".clean-cohort-title",
    content: "This shows your current cohort and program status.",
  },
  {
    target: ".week-day-subtitle",
    content: (
      <div>
        <p>
          This indicates the current week and day of your journey. Click the
          link to go directly to today's devotional.
        </p>
      </div>
    ),
  },
  {
    target: ".dashboard-card-section",
    content: "Here you'll find quick access to your daily tasks and resources.",
  },
  {
    target: ".user-menu-trigger", // Need to ensure UserMenu has this class/id
    content: "Access your profile, settings, or log out from here.",
  },
];
