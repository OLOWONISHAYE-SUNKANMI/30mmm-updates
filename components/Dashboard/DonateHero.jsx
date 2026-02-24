"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function DonateHero({ onClick }) {
  // State management - think of this as the component's "memory"
  const [selectedAmount, setSelectedAmount] = useState(100); // Default to $100
  const [donationType, setDonationType] = useState("one-time"); // 'one-time' or 'monthly'
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { authState } = useAuth();

  // Predefined amounts - easy to modify later
  const amounts = [50, 100, 200];

  // Handle amount selection
  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setShowCustomInput(false);
    setCustomAmount("");
  };

  // Handle custom amount
  const handleCustomClick = () => {
    setShowCustomInput(true);
    setSelectedAmount(null);
  };

  // Handle custom amount input
  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(parseFloat(value) || 0);
    }
  };

  // Handle donation submission
  const handleDonate = async () => {
    // Validation - make sure we have a valid amount
    const finalAmount = showCustomInput
      ? parseFloat(customAmount)
      : selectedAmount;

    if (!finalAmount || finalAmount <= 0) {
      toast.error("Please select or enter a valid donation amount");
      return;
    }

    setIsProcessing(true);

    try {
      // Call your Stripe API endpoint
      const response = await fetch("/api/create-checkout-dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: finalAmount, // Send in dollars — API route converts to cents
          email: authState.user.email, // Assuming authState is available
          cancelUrl: window.location.href, // Redirect back to current page on cancel
          donationType: donationType,
          // Add any additional metadata you need
          metadata: {
            program: "The Clean Program",
            source: "donation_hero",
          },
        }),
      });

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Donation error:", error);
      toast.error("There was an error processing your donation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        style={{ cursor: "pointer" }}
        className="relative mx-auto h-80 w-[90%] max-w-[1000px] justify-self-center rounded-3xl bg-primaryred-900 bg-donate-mobile bg-top bg-no-repeat max-md:max-w-[340px] md:h-60 md:bg-donate-desktop md:bg-right"
      >
        <div className="ml-3 mt-3 flex h-[270px] w-[330px] flex-col items-center justify-start max-md:mt-[120px] max-md:hidden max-md:w-[500px] max-md:flex-wrap md:h-[210px] md:items-start md:justify-between">
          <h3 className="text-[28px] font-bold tracking-wide text-white">
            Donate
          </h3>
          <div className="text-sm font-light text-white">
            "Your prayers and your alms have ascended as a memorial before God."
            Acts 10:4
          </div>

          {/* Donation Type Toggle */}
          <div className="inline-flex items-center justify-start gap-4 gap-x-2 justify-self-end rounded-[34px] bg-off-white/10">
            <div
              className={`inline-flex h-[26px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[34px] px-2 py-1 transition-colors ${donationType === "one-time" ? "bg-black" : "bg-transparent"
                }`}
              onClick={() => setDonationType("one-time")}
            >
              <div className="px-1 text-xs font-medium leading-tight text-white">
                One time
              </div>
            </div>
            <div
              className={`inline-flex h-[26px] cursor-pointer flex-col items-start justify-center gap-1.5 px-0.5 transition-colors ${donationType === "monthly"
                ? "rounded-[34px] bg-black"
                : "bg-transparent"
                }`}
              onClick={() => setDonationType("monthly")}
            >
              <div className="px-1 text-xs font-normal leading-tight text-white">
                Monthly
              </div>
            </div>
          </div>

          {/* Amount Selection */}
          <div className="flex h-12 w-[600px] flex-wrap items-start justify-start gap-3.5 overflow-hidden">
            <div className="inline-flex items-center justify-start gap-3">
              {/* Predefined Amount Buttons */}
              {amounts.map((amount) => (
                <div
                  key={amount}
                  className={`flex h-12 w-[90px] cursor-pointer items-center justify-center gap-2.5 rounded-[40px] border px-[31px] py-2 transition-colors max-md:hidden ${selectedAmount === amount && !showCustomInput
                    ? "bg-white text-zinc-900"
                    : "bg-[#865852] text-white hover:bg-[#754841]"
                    }`}
                  onClick={() => handleAmountSelect(amount)}
                >
                  <div className="text-base font-normal leading-relaxed">
                    ${amount}
                  </div>
                </div>
              ))}

              {/* Custom Amount Button/Input */}
              {showCustomInput ? (
                <div className="flex h-12 w-[90px] items-center justify-center gap-2.5 rounded-[40px] border bg-white px-2 py-2">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="$0"
                    className="w-full bg-transparent text-center text-base font-medium leading-relaxed text-zinc-900 outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <div
                  className="flex w-[90px] cursor-pointer items-center justify-center gap-2.5 self-stretch rounded-[40px] border bg-[#865852] px-[31px] py-2 transition-colors hover:bg-[#754841] max-md:hidden"
                  onClick={handleCustomClick}
                >
                  <div className="text-base font-normal leading-relaxed text-white">
                    Custom
                  </div>
                </div>
              )}

              {/* Donate Button */}
              <div
                className={`flex w-[152px] cursor-pointer items-center justify-center gap-2.5 self-stretch rounded-[40px] px-6 py-[11px] transition-colors ${isProcessing
                  ? "cursor-not-allowed bg-red-800"
                  : "bg-red-700 hover:bg-red-800"
                  }`}
                onClick={handleDonate}
                disabled={isProcessing}
              >
                <div className="text-center text-base font-bold leading-relaxed text-white">
                  {isProcessing ? "Processing..." : "Donate"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
