"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DonationCancelledPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-8">
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
                Your donation was not processed. You can try again whenever you're ready.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
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
                  Back to Dashboard
                </button>
             
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
