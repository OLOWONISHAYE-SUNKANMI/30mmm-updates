"use client";

import { useEffect, useState, useCallback } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useAuth } from "@/contexts/AuthContext";
import { onboardingSteps } from "./OnboardingSteps";

// How long to wait (ms) after scrolling before showing the tooltip
const SCROLL_DELAY = 450;

export default function OnboardingTour() {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const { authState } = useAuth();

    useEffect(() => {
        if (authState.isAuthenticated && authState.user) {
            const hasSeenTour = localStorage.getItem("onboarding_completed");
            if (!hasSeenTour) {
                // Small delay so the dashboard has time to fully render
                const t = setTimeout(() => setRun(true), 800);
                return () => clearTimeout(t);
            }
        }
    }, [authState.isAuthenticated, authState.user]);

    // Smooth-scroll the target element into view, then resolve after delay
    const scrollToTarget = useCallback((selector) => {
        return new Promise((resolve) => {
            if (!selector || selector === "body") {
                resolve();
                return;
            }
            const el = document.querySelector(selector);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            setTimeout(resolve, SCROLL_DELAY);
        });
    }, []);

    const handleJoyrideCallback = useCallback(
        async (data) => {
            const { action, index, type, status } = data;

            // Tour finished or skipped
            if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
                setRun(false);
                setStepIndex(0);
                localStorage.setItem("onboarding_completed", "true");
                return;
            }

            // Moving to next step
            if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
                const nextIndex =
                    action === ACTIONS.PREV ? index - 1 : index + 1;

                if (nextIndex < onboardingSteps.length) {
                    // Pause Joyride while we scroll
                    setRun(false);
                    const nextTarget = onboardingSteps[nextIndex]?.target;
                    await scrollToTarget(nextTarget);
                    setStepIndex(nextIndex);
                    setRun(true);
                } else {
                    // Last step completed — close the tour
                    setRun(false);
                    setStepIndex(0);
                    localStorage.setItem("onboarding_completed", "true");
                }
            }
        },
        [scrollToTarget]
    );

    return (
        <Joyride
            steps={onboardingSteps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            disableScrolling        // We handle scrolling ourselves for full control
            disableScrollParentFix  // Avoid joyride fighting with our scroll
            spotlightClicks={false}
            callback={handleJoyrideCallback}
            floaterProps={{
                disableAnimation: false,
            }}
            styles={{
                options: {
                    primaryColor: "#ef4444",
                    zIndex: 10000,
                    arrowColor: "#fff",
                    backgroundColor: "#fff",
                    overlayColor: "rgba(0,0,0,0.55)",
                    textColor: "#222",
                    width: 380,
                },
                // Tooltip container
                tooltip: {
                    borderRadius: 16,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    padding: "24px 24px 20px",
                    fontFamily: "inherit",
                },
                tooltipTitle: {
                    display: "none", // we embed titles inside step content
                },
                // Progress dots
                tooltipFooter: {
                    marginTop: 16,
                },
                // Next / Back buttons
                buttonNext: {
                    backgroundColor: "#ef4444",
                    borderRadius: 8,
                    padding: "8px 20px",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    letterSpacing: "0.02em",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
                    transition: "background 0.2s",
                },
                buttonBack: {
                    color: "#ef4444",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    marginRight: 8,
                },
                buttonSkip: {
                    color: "#9ca3af",
                    fontSize: "0.8rem",
                },
                // Spotlight halo around the highlighted element
                spotlight: {
                    borderRadius: 12,
                    boxShadow:
                        "0 0 0 4px rgba(239,68,68,0.35), 0 0 0 9999px rgba(0,0,0,0.55)",
                },
            }}
            locale={{
                back: "← Back",
                close: "Close",
                last: "Let's go!",
                next: "Next →",
                open: "Open",
                skip: "Skip tour",
            }}
        />
    );
}
