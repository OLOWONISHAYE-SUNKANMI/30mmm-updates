"use client";

import { useEffect, useState } from "react";
import Joyride, { STATUS } from "react-joyride";
import { useAuth } from "@/contexts/AuthContext";
import { onboardingSteps } from "./OnboardingSteps";

export default function OnboardingTour() {
    const [run, setRun] = useState(false);
    const { authState } = useAuth();

    useEffect(() => {
        // Only run if user is authenticated and hasn't seen the tour
        if (authState.isAuthenticated && authState.user) {
            const hasSeenTour = localStorage.getItem("onboarding_completed");
            if (!hasSeenTour) {
                setRun(true);
            }
        }
    }, [authState.isAuthenticated, authState.user]);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem("onboarding_completed", "true");
        }
    };

    return (
        <Joyride
            steps={onboardingSteps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: "#ef4444", // primary-red
                    zIndex: 1000,
                },
                buttonNext: {
                    backgroundColor: "#ef4444",
                },
                buttonBack: {
                    color: "#ef4444",
                },
            }}
            locale={{
                last: "Finish",
                skip: "Skip",
            }}
        />
    );
}
