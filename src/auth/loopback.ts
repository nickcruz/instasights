import { BadRequestException } from '@nestjs/common';

const PROOF_CHALLENGE = /^[A-Za-z0-9_-]{43}$/;

export function validateLoopbackRedirect(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('redirect_uri must be a valid URL');
  }

  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    !url.port ||
    Number(url.port) < 1 ||
    Number(url.port) > 65_535 ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new BadRequestException(
      'redirect_uri must be an http://127.0.0.1:<port>/... loopback URL',
    );
  }
  return url.toString();
}

export function validateClientState(value: string): string {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(value)) {
    throw new BadRequestException('state is invalid');
  }
  return value;
}

export function validateProofChallenge(value: string): string {
  if (!PROOF_CHALLENGE.test(value)) {
    throw new BadRequestException('code_challenge must be a base64url SHA-256 digest');
  }
  return value;
}
