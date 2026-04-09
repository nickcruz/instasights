"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type OAuthContinueClientProps = {
  initialReturnTo: string | null;
};

export function OAuthContinueClient({
  initialReturnTo,
}: OAuthContinueClientProps) {
  const [attemptNonce, setAttemptNonce] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const hasStartedRef = useRef(false);

  const callbackUrl = useMemo(() => {
    if (!initialReturnTo) {
      return "/developers";
    }

    try {
      return new URL(initialReturnTo).toString();
    } catch {
      return "/developers";
    }
  }, [initialReturnTo]);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    void signIn("google", {
      callbackUrl,
      redirect: true,
    }).catch(() => {
      setHasFailed(true);
    });
  }, [attemptNonce, callbackUrl]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
          Claude OAuth
        </p>
        <h1 className="font-heading text-4xl leading-none text-[var(--foreground)]">
          Finishing sign-in for Claude
        </h1>
        <p className="text-base leading-7 text-[var(--muted-foreground)]">
          This browser step should hand control back to Claude after Google sign-in completes.
        </p>
      </div>

      {hasFailed ? (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-5">
          <p className="text-sm text-[var(--foreground)]">
            We could not automatically continue the Google sign-in flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                hasStartedRef.current = false;
                setHasFailed(false);
                setAttemptNonce((current) => current + 1);
              }}
            >
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/developers">Open developers page</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-5 text-sm text-[var(--muted-foreground)]">
          Opening Google sign-in now. When it succeeds, Claude should resume the MCP connection automatically.
        </div>
      )}
    </div>
  );
}
