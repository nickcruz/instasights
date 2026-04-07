import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
type InstagramLinkCardProps = {
  instagramLink: {
    instagramUserId: string;
    username: string | null;
    linkedAt: Date;
  } | null;
  signedIn: boolean;
  instagramConfigured: boolean;
  status: string | null;
  message: string | null;
};

function statusCopy(status: string | null, message: string | null) {
  if (status === "linked") {
    return "Instagram account linked successfully.";
  }

  if (status === "config-error") {
    return "Instagram OAuth or database env vars are missing or incomplete.";
  }

  if (status === "state-error") {
    return "Instagram OAuth state could not be verified. Please try linking again.";
  }

  if (status === "error" && message) {
    return message;
  }

  return null;
}

export function InstagramLinkCard({
  instagramLink,
  signedIn,
  instagramConfigured,
  status,
  message,
}: InstagramLinkCardProps) {
  const feedback = statusCopy(status, message);

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Instagram connection</CardTitle>
        <CardDescription>
          Link the signed-in app user to Instagram so the app can ingest account
          data in the background.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {instagramLink ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/55 p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Linked account
            </p>
            <p className="mt-2 text-2xl font-semibold">
              @{instagramLink.username || "unknown"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Instagram user ID: {instagramLink.instagramUserId || "n/a"}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Linked at {new Date(instagramLink.linkedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--muted-foreground)]">
            No Instagram account linked yet.
          </div>
        )}

        {feedback ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-sm text-[var(--foreground)]">
            {feedback}
          </div>
        ) : null}

        {!signedIn ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Sign in with Google first, then return here to connect Instagram.
          </p>
        ) : instagramConfigured ? (
          <Button asChild>
            <Link href="/api/login">
              {instagramLink ? "Relink Instagram" : "Link Instagram"}
            </Link>
          </Button>
        ) : (
          <Button disabled>Add Instagram env vars to enable linking</Button>
        )}
      </CardContent>
    </Card>
  );
}
