"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    source: "30MMM CLEAN",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("You're now subscribed!", {
          description: "You're now in the loop! Be on the lookout for our emails",
        });
        setFormData({ name: "", email: "", source: "30MMM CLEAN" });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send subscribe. Please try again later.");
      toast.error(`Error: ${error.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-off-white pt-16">
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 text-center shadow-md">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 48 48"
              >
                <circle
                  className="opacity-25"
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M14 24l8 8l16-16"
                />
              </svg>
            </div>

            <h2 className="mb-4 text-3xl font-bold text-title-black">
              Thank You for Subscribing!
            </h2>

            <p className="mb-6 text-lg text-description-gray">
              Your name and email has been received. Please remain on the
              lookout from 30MMM!
            </p>

            <Button
              onClick={() => setIsSubmitted(false)}
              className="rounded-lg bg-primary-red px-6 py-3 text-lg font-bold text-off-white transition duration-300 hover:bg-primaryred-800"
            >
              Add Additional Email to Newsletter
            </Button>
          </div>

          <div className="mt-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-title-black">
              Other Ways to Reach Us
            </h2>
            <p className="mb-2 text-description-gray">
              Email: support@30mmm.org
            </p>
            <p className="mb-2 text-description-gray">Phone: +1 646-519-1186</p>
            <p className="text-description-gray">
              Address: PO Box #3, Bivalve, MD 21814
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white pt-16">
      <main className="container mx-auto px-4 py-8">
        <h1 className="my-8 text-center text-4xl font-bold text-title-black">
          Subscribe to Our Newsletter
        </h1>

        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-md">
          <p className="mb-6 text-center text-description-gray">
            Keep in touch!
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-title-black"
              >
                Full Name (First & Last, seperated by space)
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-title-black"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-lg bg-primary-red px-6 py-3 text-lg font-bold text-off-white transition duration-300 hover:bg-primaryred-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-title-black">
            Other Ways to Reach Us
          </h2>
          <p className="mb-2 text-description-gray">Email: support@30mmm.org</p>
          <p className="mb-2 text-description-gray">Phone: +1 646-519-1186</p>
          <p className="text-description-gray">
            Address: PO Box #3, Bivalve, MD 21814
          </p>
        </div>
      </main>
    </div>
  );
}
