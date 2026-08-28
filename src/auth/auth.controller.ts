import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { loopbackPostPage } from './html';
import {
  validateClientState,
  validateLoopbackRedirect,
  validateProofChallenge,
} from './loopback';
import { CredentialGuard } from './credential.guard';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('auth/instagram/start')
  start(
    @Query('redirect_uri') redirectUri: string,
    @Query('state') clientState: string,
    @Query('code_challenge') proofChallenge: string,
    @Res() response: Response,
  ): void {
    const state = this.auth.signState({
      redirectUri: validateLoopbackRedirect(redirectUri),
      clientState: validateClientState(clientState),
      proofChallenge: validateProofChallenge(proofChallenge),
    });
    response.redirect(302, this.auth.authorizeUrl(state));
  }

  @Get(['auth/instagram/callback', 'api/callback'])
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const payload = this.auth.verifyState(state);
    let credential: string | undefined;
    let message: string | undefined;

    if (error || !code) {
      message = errorDescription || error || 'Instagram authorization was cancelled';
    } else {
      try {
        credential = await this.auth.exchangeCode(code, payload.proofChallenge);
      } catch (cause) {
        message = cause instanceof Error ? cause.message : 'Instagram authorization failed';
      }
    }

    const page = loopbackPostPage({
      redirectUri: payload.redirectUri,
      state: payload.clientState,
      credential,
      error: message,
    });
    const loopbackOrigin = new URL(payload.redirectUri).origin;
    response.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; script-src 'nonce-${page.nonce}'; form-action ${loopbackOrigin}`,
    );
    response.status(200).type('html').send(page.html);
  }

  @Post('auth/instagram/refresh')
  @UseGuards(CredentialGuard)
  refresh(@Req() request: AuthenticatedRequest): Promise<{ credential: string }> {
    return this.auth.refreshCredential(request.instagram);
  }
}
