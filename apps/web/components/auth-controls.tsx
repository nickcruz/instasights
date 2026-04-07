"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type AuthControlsProps = {
  isAuthenticated: boolean;
  googleAvailable: boolean;
};

export function AuthControls({
  isAuthenticated,
  googleAvailable,
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
          void signOut({ callbackUrl: "/" });
        }}
      >
        Sign out
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        void signIn("google", { callbackUrl: "/profile" });
      }}
    >
      Sign in with Google
    </Button>
  );
}
