"use client";

import React from "react";
import { logInAction, signUpAction } from "@/actions/auth";
import Image from "next/image";
import { toast } from "sonner";

export default function GoogleBtn({ isSignUp = true }) {
  const handleGoogleAuth = async () => {
    try {
      if (isSignUp) {
        await signUpAction("google");
      } else {
        await logInAction("google");
      }
      toast.success(
        `${isSignUp ? "Google Sign Up" : "Google Log In"} successful`,
      );
    } catch (error) {
      // NEXT_REDIRECT is expected — Next.js throws it to perform the redirect
      if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      toast.error(`Error: ${error.message}`);
    }
  };

  const loading = false;

  return (
    <button
      type="button"
      className="mx-auto my-4 flex w-5/6 columns-1 items-center justify-center gap-7 justify-self-center rounded-2xl py-2 shadow-md outline outline-1 outline-primary-red hover:bg-primary-red hover:text-white"
      onClick={handleGoogleAuth}
      disabled={loading}
    >
      <Image
        className="overflow-x-clip object-cover contain-layout"
        src="/googlelogo.png"
        width={20}
        height={20}
        alt="Google Logo"
      />
      {isSignUp ? "Sign Up with Google" : "Log In with Google"}
    </button>
  );
}
