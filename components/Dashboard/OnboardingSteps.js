export const onboardingSteps = [
  // ── Step 0 — Welcome modal (centered, no target) ──────────────────────────
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: (
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: 8,
            color: "#111",
          }}
        >
          Welcome to 30MMM!
        </h2>
        <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
          You're about to begin a transformative 30-day journey. This quick
          tour (about 1 min) will show you exactly where everything lives so
          you can hit the ground running.
        </p>
        <p style={{ fontSize: "0.78rem", color: "#888" }}>
          Click <strong>Next</strong> to explore, or{" "}
          <strong>Skip</strong> if you've been here before.
        </p>
      </div>
    ),
  },

  // ── Step 1 — Greeting / Day tracker ─────────────────────────────────────
  {
    target: ".week-day-subtitle",
    placement: "bottom",
    disableBeacon: true,
    content: (
      <div style={{ maxWidth: 300 }}>
        <p style={{ fontSize: "1.1rem", marginBottom: 6, fontWeight: 700 }}>Today's Devotional</p>
        <p style={{ color: "#444", lineHeight: 1.6 }}>
          This line always tells you <em>exactly where you are</em> in the
          programme — Week, Day, and the title of today's reading.
        </p>
        <p style={{ marginTop: 8, color: "#444", lineHeight: 1.6 }}>
          <strong>Tap the title</strong> to jump straight into today's
          devotional. No searching required.
        </p>
      </div>
    ),
  },

  // ── Step 2 — Cohort badge ────────────────────────────────────────────────
  {
    target: ".clean-cohort-title",
    placement: "right",
    disableBeacon: true,
    content: (
      <div style={{ maxWidth: 280 }}>
        <p style={{ fontSize: "1.1rem", marginBottom: 6, fontWeight: 700 }}>Your Cohort</p>
        <p style={{ color: "#444", lineHeight: 1.6 }}>
          This shows which <strong>CLEAN cohort</strong> you belong to.
          Every cohort is a community of people walking the same 30 days
          together — you are not alone.
        </p>
      </div>
    ),
  },

  // ── Step 3 — Card section / week cards ──────────────────────────────────
  {
    target: ".dashboard-card-section",
    placement: "top",
    disableBeacon: true,
    content: (
      <div style={{ maxWidth: 320 }}>
        <p style={{ fontSize: "1.1rem", marginBottom: 6, fontWeight: 700 }}>Your Week Cards</p>
        <p style={{ color: "#444", lineHeight: 1.6 }}>
          Every week of your journey is laid out here as a card. Inside each
          card you'll find the individual day devotionals.
        </p>
        <ul
          style={{
            marginTop: 10,
            paddingLeft: 18,
            color: "#444",
            lineHeight: 1.8,
            fontSize: "0.9rem",
          }}
        >
          <li><strong>Completed</strong> days are ticked off automatically</li>
          <li><strong>Today's</strong> day is always open and highlighted</li>
          <li><strong>Future</strong> days unlock as you progress</li>
        </ul>
      </div>
    ),
  },

  // ── Step 4 — Filter tabs inside card section ─────────────────────────────
  {
    target: ".dashboard-card-section",
    placement: "top",
    disableBeacon: true,
    content: (
      <div style={{ maxWidth: 300 }}>
        <p style={{ fontSize: "1.1rem", marginBottom: 6, fontWeight: 700 }}>Filter Your Progress</p>
        <p style={{ color: "#444", lineHeight: 1.6 }}>
          Use the <strong>All · In Progress · Upcoming · Completed</strong>{" "}
          tabs above the cards to filter what you see — great for reviewing
          what you've already finished or planning ahead.
        </p>
      </div>
    ),
  },

  // ── Step 5 — User menu ───────────────────────────────────────────────────
  {
    target: ".user-menu-trigger",
    placement: "left",
    disableBeacon: true,
    content: (
      <div style={{ maxWidth: 280 }}>
        <p style={{ fontSize: "1.1rem", marginBottom: 6, fontWeight: 700 }}>Your Account</p>
        <p style={{ color: "#444", lineHeight: 1.6 }}>
          Click your avatar here to access your <strong>profile</strong>,
          update <strong>settings</strong>, or <strong>log out</strong>.
        </p>
      </div>
    ),
  },

  // ── Step 6 — Final step (centered celebration) ───────────────────────────
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: (
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            marginBottom: 8,
            color: "#111",
          }}
        >
          You're all set!
        </h2>
        <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
          Start with today's devotional, track your progress in the cards,
          and come back every day. <strong>Your 30-day journey starts now.</strong>
        </p>
        <p style={{ fontSize: "0.78rem", color: "#888" }}>
          You can always replay this tour by clicking{" "}
          <strong>Restart Tutorial</strong> on the dashboard.
        </p>
      </div>
    ),
  },
];
