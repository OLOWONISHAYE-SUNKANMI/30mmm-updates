"use server";

import prisma from "@/db";
import { hash } from "bcrypt";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/lib/auth";
import { getUser } from "@/lib/session";

// Helper function to determine redirect path
async function getRedirectPath() {
  try {
    const user = await getUser();

    // If user doesn't exist or couldn't be fetched from the database
    if (!user) {
      return "/profile";
    }

    // Check if user has completed their profile
    // Use the profileCompleted field from the User model
    if ((user as any).profileCompleted) {
      return "/dashboard";
    }

    // User exists but hasn't completed profile
    return "/profile";
  } catch (error) {
    console.error("Error determining redirect path:", error);
    return "/signup";
  }
}

// Sign up with Google
export async function signUpWithGoogleAction() {
  try {
    // Sign in with Google (user creation happens in auth callbacks)
    // After successful OAuth, user will be created and redirected to /profile
    await signIn("google", {
      redirectTo: "/profile", // Always redirect to profile for new Google users
    });
  } catch (error) {
    // Nextjs handles redirects internally with this error, its thrown after a successful authentication
    // This is expected behavior so we return nothing
    if (error?.message?.includes("NEXT_REDIRECT")) {
      console.log("Redirecting after successful Google sign up");
      throw error; // Re-throw to allow redirect
    }

    // Suppress harmless browser extension errors during OAuth
    if (
      error?.message?.includes("message channel closed") ||
      error?.message?.includes("asynchronous response")
    ) {
      console.log(
        "Ignoring browser extension interference during OAuth sign up",
      );
      return;
    }

    console.error("Google sign up error:", error);
    throw error;
  }
}

export async function logInWithGoogleAction() {
  try {
    // The signIn callback in auth.ts will verify user exists in database
    // If they don't exist, they'll be redirected to the error page
    await signIn("google", {
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Handle NextAuth redirect errors (these are expected for OAuth)
    if (error?.message?.includes("NEXT_REDIRECT")) {
      throw error; // Re-throw to allow redirect
    }

    // Suppress harmless browser extension errors during OAuth
    if (
      error?.message?.includes("message channel closed") ||
      error?.message?.includes("asynchronous response")
    ) {
      console.log("Ignoring browser extension interference during OAuth");
      return;
    }

    console.error("Google login error:", error);
    throw error;
  }
}

// Sign up with credentials - CREATE USER FIRST, THEN SIGN IN
export async function signUpWithCredentialsAction(
  email: string,
  password: string,
  name?: string,
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create the user
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0], // Use email prefix as default name
        role: "user",
      },
    });

    // Now sign in the newly created user
    const redirectTo = await getRedirectPath();
    await signIn("credentials", {
      email,
      password: password, // Use original password, not hashed
      redirectTo,
    });
  } catch (error) {
    // Nextjs handles redirects internally with this error, its thrown after a successful authentication
    // This is expected behavior so we return nothing
    if (error?.message?.includes("NEXT_REDIRECT")) {
      console.log("Redirecting after successful sign up");
    }
    // if there is a real error, throw that
    throw error;
  }
}

// Log in with credentials
export async function logInWithCredentialsAction(
  email: string,
  password: string,
) {
  try {
    // The signIn callback in auth.ts will verify user exists and validate credentials
    // If they don't exist or credentials are invalid, they'll be redirected to the error page
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Handle NextAuth redirect errors (these are expected for OAuth and credentials)
    if (error?.message?.includes("NEXT_REDIRECT")) {
      throw error; // Re-throw to allow redirect
    }

    // Suppress harmless browser extension errors during authentication
    if (
      error?.message?.includes("message channel closed") ||
      error?.message?.includes("asynchronous response")
    ) {
      console.log(
        "Ignoring browser extension interference during authentication",
      );
      return;
    }

    console.error("Credentials login error:", error);
    throw error;
  }
}

// Generic sign up that accepts provider type
export async function signUpAction(
  provider: "google" | "credentials",
  credentials?: { email: string; password: string; name?: string },
) {
  if (provider === "credentials" && credentials) {
    await signUpWithCredentialsAction(
      credentials.email,
      credentials.password,
      credentials.name,
    );
  } else if (provider === "google") {
    await signUpWithGoogleAction();
  } else {
    throw new Error("Invalid provider or missing credentials");
  }
}

// Generic log in that accepts provider type
export async function logInAction(
  provider: "google" | "credentials",
  credentials?: { email: string; password: string },
) {
  try {
    if (provider === "credentials" && credentials) {
      return await logInWithCredentialsAction(
        credentials.email,
        credentials.password,
      );
    } else if (provider === "google") {
      return await logInWithGoogleAction();
    } else {
      throw new Error("Invalid provider or missing credentials");
    }
  } catch (error) {
    // Suppress harmless browser extension errors
    if (
      error?.message?.includes("message channel closed") ||
      error?.message?.includes("asynchronous response")
    ) {
      console.log("Ignoring browser extension interference");
      return;
    }

    // Re-throw NextAuth redirect errors (these are expected)
    if (error?.message?.includes("NEXT_REDIRECT")) {
      throw error;
    }

    throw error;
  }
}

// Sign out function
export async function signOutAction() {
  try {
    console.log("running signOutAction...");

    // Sign out (don't redirect here, let client handle it)
    await signOut();

    // Revalidate all paths to clear cached data
    revalidatePath("/", "layout");
    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);

    // Handle NextAuth redirect errors (these are actually success cases)
    if (error?.message?.includes("NEXT_REDIRECT")) {
      console.log("Sign out successful");
      return { success: true };
    }

    throw error;
  }
}

// Add this new action to get current auth state
export async function getCurrentAuthState() {
  try {
    const user = await getUser();

    return {
      isAuthenticated: !!user,
      user: user || null,
    };
  } catch (error) {
    console.error("Error getting auth state:", error);

    // Handle specific cases where user is simply not authenticated
    // vs actual database/connection errors
    if (
      error?.message?.includes("No session found") ||
      error?.message?.includes("Not authenticated") ||
      error?.code === "UNAUTHORIZED"
    ) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    // For database connection errors or other issues,
    // still return unauthenticated state but log the error
    return {
      isAuthenticated: false,
      user: null,
    };
  }
}
