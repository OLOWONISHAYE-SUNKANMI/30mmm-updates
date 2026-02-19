"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DonateButton from "@/components/Donations/process-payment-btn";

interface DiscountCode {
  code: string;
  percentage: number;
  widgetId?: string;
}

interface DonationPageProps {
  userName: string;
  userEmail: string;
  isPremium: boolean;
}

const BASE_DONATION = 10000; // $100.00 in cents

const DonationPage: React.FC<DonationPageProps> = ({
  userName,
  userEmail,
  isPremium,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCanceled = searchParams.get("canceled") === "true";
  const returnUrl = searchParams.get("returnUrl") || null;

  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(
    null,
  );
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Validate discount codes using your API route
  const validateDiscountCode = async (
    code: string,
  ): Promise<DiscountCode | null> => {
    try {
      const response = await fetch("/api/validate-discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discountCode: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate discount code");
      }

      if (data.valid) {
        return {
          code: code.toUpperCase(),
          percentage: data.discountPercentage,
          widgetId: data.widgetId,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error validating discount code:", error);
      throw error;
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsValidating(true);
    setValidationError(null);

    try {
      const discount = await validateDiscountCode(discountCode.trim());
      if (discount) {
        setAppliedDiscount(discount);
        setDiscountCode("");
      } else {
        // Try to get more specific error message from API
        const response = await fetch("/api/validate-discount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discountCode: discountCode.trim(),
          }),
        });

        const data = await response.json();
        setValidationError(
          data.message || "Invalid discount code. Please check and try again.",
        );
      }
    } catch (error) {
      setValidationError(
        `Unable to validate discount code: ${error}. Please try again.`,
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleDiscountKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApplyDiscount();
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setValidationError(null);
  };

  useEffect(() => {
    if (isPremium) {
      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPremium]);

  // Calculate final donation amount after discount
  const getFinalAmount = () => {
    if (!appliedDiscount) return BASE_DONATION;
    return Math.round(BASE_DONATION * (1 - appliedDiscount.percentage / 100));
  };

  // Stripe Checkout handler
  const handleDonate = async () => {
    const finalAmount = getFinalAmount();
    
    // If amount is $0, skip Stripe and mark as premium directly
    if (finalAmount === 0) {
      setIsProcessingPayment(true);
      setValidationError(null);
      
      try {
        const response = await fetch("/api/create-checkout-dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 0,
            email: userEmail,
            discountCode: appliedDiscount?.code || null,
            paymentMethod: "free_discount",
            returnUrl: returnUrl || "/dashboard",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to process free signup");
        }

        const data = await response.json();
        
        // Redirect to dashboard
        window.location.href = data.redirectUrl || "/dashboard";
      } catch (error) {
        console.error("Free signup error:", error);
        setValidationError(
          error instanceof Error
            ? error.message
            : "Could not complete signup. Please try again.",
        );
        setIsProcessingPayment(false);
      }
      return;
    }
    
    setIsProcessingPayment(true);
    setValidationError(null);

    try {
      // Call your backend API to create a Stripe Checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount, // in cents
          email: userEmail,
          discountCode: appliedDiscount?.code || null,
          widgetId: appliedDiscount?.widgetId || null,
          returnUrl: returnUrl || "/dashboard",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Stripe session");
      }

      const { sessionUrl } = await response.json();

      if (!sessionUrl) {
        throw new Error("No session URL returned from server");
      }

      // Push to history to ensure back button works properly
      window.history.pushState({ returnUrl: returnUrl || "/dashboard" }, "", window.location.href);

      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Payment initiation error:", error);
      setValidationError(
        error instanceof Error
          ? error.message
          : "Could not start payment. Please try again.",
      );
      setIsProcessingPayment(false);
    }
  };

  if (isPremium) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
            <h2 className="mb-2 text-xl font-semibold">
              Welcome back, {userName}!
            </h2>
            <p className="text-gray-600">
              You already have premium access. Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show cancellation message if user cancelled payment
  if (isCanceled) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-8 rounded-lg border border-orange-200 bg-orange-50 p-8">
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h2 className="mb-2 text-2xl font-semibold text-orange-900">
              Payment Cancelled
            </h2>
            <p className="mb-6 text-orange-800">
              Your payment was not processed. You can try again whenever you're ready.
            </p>
            <button
              onClick={() => {
                if (returnUrl) {
                  window.location.href = returnUrl;
                } else {
                  router.push("/dashboard");
                }
              }}
              className="rounded-md bg-primary-red px-6 py-2 text-white transition-colors hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Hello, {userName}!</h1>
      </div>

      {/* Discount Code Input */}
      <div className="mb-6 rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4 text-lg font-semibold">Have a discount code?</h3>
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            onKeyPress={handleDiscountKeyPress}
            placeholder="Enter discount code"
            disabled={isValidating}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
          <button
            onClick={handleApplyDiscount}
            disabled={!discountCode.trim() || isValidating}
            className="rounded-md bg-primary-red px-6 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isValidating ? "Validating..." : "Apply"}
          </button>
        </div>
        {validationError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}
        {appliedDiscount && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <p className="font-medium text-green-700">
                  Great! Your {appliedDiscount.percentage}% discount (
                  {appliedDiscount.code}) has been applied.
                </p>
              </div>
              <button
                onClick={removeDiscount}
                className="text-sm text-red-600 underline hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stripe Payment Section */}
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h3 className="mb-3 font-semibold text-gray-700">Donation Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-medium">
                ${(BASE_DONATION / 100).toFixed(2)}
              </span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between">
                <span className="text-green-700">
                  Discount ({appliedDiscount.percentage}% off):
                </span>
                <span className="font-medium text-green-700">
                  -${((BASE_DONATION - getFinalAmount()) / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold text-gray-800">Final Amount:</span>
              <span className="text-lg font-bold text-black">
                ${(getFinalAmount() / 100).toFixed(2)}
              </span>
            </div>
          </div>
          <DonateButton
            onClick={handleDonate}
            isProcessing={isProcessingPayment}
            amount={getFinalAmount()}
            className="mt-4"
            label={getFinalAmount() === 0 ? "Complete Free Signup" : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default DonationPage;