"use client";

import { signIn, signOut } from "next-auth/react";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";

type AuthControlsProps = {
  isAuthenticated: boolean;
  googleAvailable: boolean;
  callbackUrl?: string;
  signInLabel?: string;
};

export function AuthControls({
  isAuthenticated,
  googleAvailable,
  callbackUrl = "/developers",
  signInLabel = "Sign in with Google",
}: AuthControlsProps) {
  if (!googleAvailable) {
    return (
      <Button variant="outline" disabled>
        Add Google OAuth env vars to enable sign-in
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          posthog.capture("sign_out_clicked");
          posthog.reset();
          void signOut({ callbackUrl: "/developers" });
        }}
      >
        Sign out
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        posthog.capture("sign_in_clicked", { provider: "google" });
        void signIn("google", { callbackUrl });
      }}
    >
      {signInLabel}
    </Button>
  );
}
