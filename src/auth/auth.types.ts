export const MCP_SCOPE = 'instasights:api';

export type OAuthClient = {
  redirectUris: string[];
  issuedAt: number;
};

export type OAuthPending = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string;
  scope: string;
  clientState?: string;
  expiresAt: number;
};

export type InstagramSession = {
  accessToken: string;
  userId: string;
  username: string;
  expiresAt: number;
};

export type OAuthAuthorizationCode = OAuthPending &
  InstagramSession & {
    nonce: string;
    codeExpiresAt: number;
  };

export type McpCredential = InstagramSession & {
  audience: string;
  scope: string;
};

export class OAuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}
