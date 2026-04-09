import { redirect } from "next/navigation";

import { buildRootHandoffPath } from "@/lib/return-to";

export const dynamic = "force-dynamic";

type OAuthContinuePageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function OAuthContinuePage({
  searchParams,
}: OAuthContinuePageProps) {
  const params = await searchParams;

  redirect(buildRootHandoffPath(params.returnTo ?? null));
}
