import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCompletePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

function getStatusCopy(status: string | undefined, message: string | undefined) {
  if (status === "linked") {
    return {
      title: "Instagram connected",
      description:
        "The browser handoff completed successfully. Return to Claude Desktop and rerun the setup or sync skill.",
    };
  }

  if (status === "config-error") {
    return {
      title: "Configuration missing",
      description:
        "Instagram OAuth is not configured correctly on the hosted app. Check the developers page and environment variables.",
    };
  }

  if (status === "state-error") {
    return {
      title: "Link verification failed",
      description:
        "The Instagram OAuth state could not be verified. Start the connect flow again from Claude, then retry the browser handoff.",
    };
  }

  if (status === "auth-required") {
    return {
      title: "Sign-in required",
      description:
        "Sign in with Google on the Instagram Insights handoff page first, then retry the connect flow from Claude.",
    };
  }

  return {
    title: "Instagram handoff error",
    description: message ?? "The Instagram handoff did not complete successfully.",
  };
}

export default async function AuthCompletePage({
  searchParams,
}: AuthCompletePageProps) {
  const params = await searchParams;
  const copy = getStatusCopy(params.status, params.message);

  return (
    <main className="min-h-screen bg-white px-6 py-10 md:px-10">
      <div className="mx-auto max-w-2xl">
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/developers">Open support page</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/api/login">Retry Instagram connect</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
