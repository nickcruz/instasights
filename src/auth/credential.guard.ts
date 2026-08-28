import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class CredentialGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): true {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const proof = request.headers['x-instasights-proof'];
    const match = authorization?.match(/^Bearer ([A-Za-z0-9._-]+)$/);
    if (!match || typeof proof !== 'string') {
      throw new UnauthorizedException('Bearer credential and proof are required');
    }

    const credential = this.auth.readCredential(match[1]);
    this.auth.verifyProof(credential, proof);
    request.instagram = credential;
    return true;
  }
}
