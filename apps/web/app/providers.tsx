"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import posthog from "posthog-js";

function PostHogIdentify() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      posthog.identify(session.user.id, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      });
    }
  }, [session?.user?.email, session?.user?.id, session?.user?.name]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogIdentify />
      {children}
    </SessionProvider>
  );
}
