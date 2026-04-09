export function normalizeSameOriginReturnTo(
  input: string | null | undefined,
  appUrl: string,
) {
  if (!input) {
    return null;
  }

  try {
    const appOrigin = new URL(appUrl).origin;
    const target = new URL(input, appOrigin);

    if (target.origin !== appOrigin) {
      return null;
    }

    const normalized = `${target.pathname}${target.search}${target.hash}`;
    return normalized.startsWith("/") ? normalized : null;
  } catch {
    return null;
  }
}

export function buildRootHandoffPath(returnTo?: string | null) {
  const url = new URL("/", "https://instagram-insights.invalid");

  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
