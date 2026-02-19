import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProfileBtn({ formData, validateForm, errors, profileImage }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate the entire form
    if (!validateForm()) {
      alert("Please correct the errors before submitting");
      return;
    }

    console.log(`Submitting: ${JSON.stringify(formData)}`);

    setIsLoading(true);

    try {
      // Use FormData if there's an image, otherwise use JSON
      let response;
      if (profileImage) {
        const formDataToSend = new FormData();
        formDataToSend.append("profileData", JSON.stringify(formData));
        formDataToSend.append("profileImage", profileImage);
        
        response = await fetch("/api/create-profile", {
          method: "POST",
          body: formDataToSend,
        });
      } else {
        response = await fetch("/api/create-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await response.json();
      console.log("Profile saved:", data);

      // Pass returnUrl so user can go back if they cancel payment
      router.push("/payment?returnUrl=" + encodeURIComponent("/profile"));
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <button
      type="submit"
      onClick={onSubmit}
      disabled={isLoading}
      className="relative my-6 flow-root w-full place-self-center rounded-2xl bg-primary-red py-2 hover:bg-primary-red/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex items-center justify-center text-center text-lg font-medium tracking-wider text-white">
        {isLoading && (
          <svg
            className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {isLoading
          ? "Creating Profile..."
          : "Create Profile and Move to Payment"}
      </span>
    </button>
  );
}
