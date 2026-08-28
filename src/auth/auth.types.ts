import type { Request } from 'express';

export type OAuthState = {
  redirectUri: string;
  clientState: string;
  proofChallenge: string;
  expiresAt: number;
};

export type InstagramCredential = {
  accessToken: string;
  userId: string;
  username: string;
  proofChallenge: string;
  expiresAt: number;
};

export type AuthenticatedRequest = Request & {
  instagram: InstagramCredential;
};
