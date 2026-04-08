import crypto from "node:crypto";

import {
  createMcpOAuthAccessToken,
  createMcpOAuthAuthorizationCode,
  createMcpOAuthClient,
  createMcpOAuthRefreshToken,
  getMcpOAuthAccessTokenByHash,
  getMcpOAuthClientByClientId,
  getMcpOAuthRefreshTokenByHash,
  revokeMcpOAuthRefreshToken,
  touchMcpOAuthAccessTokenLastUsed,
} from "@instagram-insights/db";
import { OAuthClientMetadataSchema } from "@modelcontextprotocol/sdk/shared/auth.js";

import { getAppUrl } from "@/lib/app-url";
import { auth, isGoogleAuthConfigured } from "@/lib/auth";
import { getBearerToken, parseDeveloperApiKey } from "@/lib/developer-api-keys";
import { requireDeveloperApiKey } from "@/lib/developer-api-auth";

export const MCP_TOOLS_SCOPE = "mcp:tools";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const AUTHORIZATION_CODE_TTL_SECONDS = 10 * 60;

export function hashOpaqueSecret(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomOpaqueSecret(prefix: string) {
  return `${prefix}${crypto.randomBytes(32).toString("base64url")}`;
}

export function createClientId() {
  return `mcp_client_${crypto.randomUUID()}`;
}

export function createClientSecret() {
  return randomOpaqueSecret("mcp_cs_");
}

export function createAuthorizationCode() {
  return randomOpaqueSecret("mcp_code_");
}

export function createAccessToken() {
  return randomOpaqueSecret("mcp_at_");
}

export function createRefreshToken() {
  return randomOpaqueSecret("mcp_rt_");
}

export function getMcpOriginFromRequest(request: Request) {
  return new URL(request.url).origin;
}

export function getMcpServerUrl(request: Request) {
  return new URL("/mcp", getMcpOriginFromRequest(request));
}

export function getOAuthProtectedResourceMetadataUrl(request: Request) {
  return new URL(
    "/.well-known/oauth-protected-resource/mcp",
    getMcpOriginFromRequest(request),
  ).toString();
}

export function getOAuthAuthorizationServerMetadataUrl(request: Request) {
  return new URL(
    "/.well-known/oauth-authorization-server",
    getMcpOriginFromRequest(request),
  ).toString();
}

export function createMcpUnauthorizedResponse(
  request: Request,
  message: string,
  status = 401,
) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      Vary: "Authorization",
      "WWW-Authenticate": `Bearer realm="instagram-insights-mcp", resource_metadata="${getOAuthProtectedResourceMetadataUrl(
        request,
      )}"`,
    },
  });
}

export async function requireMcpAccess(request: Request) {
  const bearerToken = getBearerToken(request);

  if (!bearerToken) {
    return {
      ok: false as const,
      response: createMcpUnauthorizedResponse(
        request,
        "Missing bearer token. Use Claude MCP OAuth or a personal API key.",
      ),
    };
  }

  if (parseDeveloperApiKey(bearerToken)) {
    const developerAuth = await requireDeveloperApiKey(request);

    if (!developerAuth.ok) {
      return {
        ok: false as const,
        response: createMcpUnauthorizedResponse(
          request,
          "Invalid personal API key.",
        ),
      };
    }

    return {
      ok: true as const,
      auth: {
        userId: developerAuth.auth.userId,
        authType: "developer_api_key" as const,
      },
    };
  }

  const accessToken =
    await getMcpOAuthAccessTokenByHash(hashOpaqueSecret(bearerToken));

  if (!accessToken) {
    return {
      ok: false as const,
      response: createMcpUnauthorizedResponse(request, "Invalid access token."),
    };
  }

  if (accessToken.token.revokedAt) {
    return {
      ok: false as const,
      response: createMcpUnauthorizedResponse(request, "Access token revoked."),
    };
  }

  if (accessToken.token.expiresAt.getTime() <= Date.now()) {
    return {
      ok: false as const,
      response: createMcpUnauthorizedResponse(request, "Access token expired."),
    };
  }

  const scopes = (accessToken.token.scope ?? "")
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);

  if (!scopes.includes(MCP_TOOLS_SCOPE)) {
    return {
      ok: false as const,
      response: createMcpUnauthorizedResponse(
        request,
        "Access token does not include mcp:tools scope.",
        403,
      ),
    };
  }

  await touchMcpOAuthAccessTokenLastUsed(accessToken.token.id);

  return {
    ok: true as const,
    auth: {
      userId: accessToken.token.userId,
      authType: "oauth_access_token" as const,
      clientId: accessToken.client.clientId,
    },
  };
}

export function buildProtectedResourceMetadata(request: Request) {
  const origin = getMcpOriginFromRequest(request);

  return {
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: [MCP_TOOLS_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "Instagram Insights MCP",
    resource_documentation: `${origin}/developers`,
  };
}

export function buildAuthorizationServerMetadata(request: Request) {
  const origin = getMcpOriginFromRequest(request);

  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    scopes_supported: [MCP_TOOLS_SCOPE],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    code_challenge_methods_supported: ["S256"],
    service_documentation: `${origin}/developers`,
  };
}

export async function registerMcpOAuthClient(input: unknown) {
  const parsed = OAuthClientMetadataSchema.parse(input);
  const tokenEndpointAuthMethod = parsed.token_endpoint_auth_method ?? "none";
  const isPublicClient = tokenEndpointAuthMethod === "none";
  const clientId = createClientId();
  const clientSecret = isPublicClient ? null : createClientSecret();

  const client = await createMcpOAuthClient({
    clientId,
    clientSecretHash: clientSecret ? hashOpaqueSecret(clientSecret) : null,
    clientName: parsed.client_name ?? null,
    redirectUris: parsed.redirect_uris.map((uri) => uri.toString()),
    tokenEndpointAuthMethod,
    grantTypes: parsed.grant_types ?? ["authorization_code", "refresh_token"],
    responseTypes: parsed.response_types ?? ["code"],
    scope: parsed.scope ?? MCP_TOOLS_SCOPE,
    metadata: parsed as Record<string, unknown>,
  });

  return {
    ...parsed,
    client_id: client.clientId,
    client_secret: clientSecret ?? undefined,
    client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
    client_secret_expires_at: clientSecret ? 0 : undefined,
  };
}

export async function getRegisteredOAuthClient(clientId: string) {
  return getMcpOAuthClientByClientId(clientId);
}

export async function createAuthorizationCodeForUser(input: {
  clientDbId: string;
  userId: string;
  redirectUri: string;
  scope?: string | null;
  resource?: string | null;
  codeChallenge: string;
  codeChallengeMethod: string;
}) {
  const code = createAuthorizationCode();

  await createMcpOAuthAuthorizationCode({
    codeHash: hashOpaqueSecret(code),
    clientDbId: input.clientDbId,
    userId: input.userId,
    redirectUri: input.redirectUri,
    scope: input.scope ?? MCP_TOOLS_SCOPE,
    resource: input.resource ?? null,
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod,
    expiresAt: new Date(Date.now() + AUTHORIZATION_CODE_TTL_SECONDS * 1000),
  });

  return code;
}

export function verifyPkceCodeVerifier(input: {
  codeVerifier: string;
  codeChallenge: string;
  method: string;
}) {
  if (input.method !== "S256") {
    return false;
  }

  const challenge = crypto
    .createHash("sha256")
    .update(input.codeVerifier)
    .digest("base64url");

  return challenge === input.codeChallenge;
}

export async function issueOAuthTokenPair(input: {
  clientDbId: string;
  userId: string;
  scope?: string | null;
  resource?: string | null;
}) {
  const accessToken = createAccessToken();
  const refreshToken = createRefreshToken();

  await createMcpOAuthAccessToken({
    tokenHash: hashOpaqueSecret(accessToken),
    clientDbId: input.clientDbId,
    userId: input.userId,
    scope: input.scope ?? MCP_TOOLS_SCOPE,
    resource: input.resource ?? null,
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
  });

  await createMcpOAuthRefreshToken({
    tokenHash: hashOpaqueSecret(refreshToken),
    clientDbId: input.clientDbId,
    userId: input.userId,
    scope: input.scope ?? MCP_TOOLS_SCOPE,
    resource: input.resource ?? null,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  });

  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    scope: input.scope ?? MCP_TOOLS_SCOPE,
    refresh_token: refreshToken,
  };
}

export async function exchangeRefreshToken(input: {
  refreshToken: string;
  clientDbId: string;
}) {
  const tokenRecord = await getMcpOAuthRefreshTokenByHash(
    hashOpaqueSecret(input.refreshToken),
  );

  if (!tokenRecord) {
    return null;
  }

  if (tokenRecord.token.clientId !== input.clientDbId) {
    return null;
  }

  if (
    tokenRecord.token.revokedAt ||
    tokenRecord.token.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  const tokens = await issueOAuthTokenPair({
    clientDbId: tokenRecord.token.clientId,
    userId: tokenRecord.token.userId,
    scope: tokenRecord.token.scope ?? MCP_TOOLS_SCOPE,
    resource: tokenRecord.token.resource ?? null,
  });

  await revokeMcpOAuthRefreshToken({
    tokenId: tokenRecord.token.id,
  });

  return tokens;
}

export async function getOAuthAuthorizeLoginRedirect(request: Request) {
  if (!isGoogleAuthConfigured) {
    return null;
  }

  const appUrl = await getAppUrl();
  const authorizeUrl = new URL(request.url);
  const signInUrl = new URL("/api/auth/signin/google", appUrl);
  signInUrl.searchParams.set("callbackUrl", authorizeUrl.toString());

  return signInUrl;
}

export async function requireAuthorizedUserForOAuth(request: Request) {
  const session = await auth();

  if (session?.user?.id) {
    return {
      ok: true as const,
      userId: session.user.id,
    };
  }

  const signInUrl = await getOAuthAuthorizeLoginRedirect(request);
  return {
    ok: false as const,
    signInUrl,
  };
}
