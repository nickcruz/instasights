import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import type { AuthenticatedRequest } from '../auth/auth.types';
import { CredentialGuard } from '../auth/credential.guard';
import { InstagramService } from './instagram.service';

@Controller('v1/instagram')
@UseGuards(CredentialGuard)
export class InstagramController {
  constructor(private readonly instagram: InstagramService) {}

  @Get('me')
  profile(
    @Req() request: AuthenticatedRequest,
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    return this.instagram.profile(
      response,
      request.instagram.accessToken,
      query,
    );
  }

  @Get('me/insights')
  accountInsights(
    @Req() request: AuthenticatedRequest,
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    return this.instagram.accountInsights(
      response,
      request.instagram.accessToken,
      request.instagram.userId,
      query,
    );
  }

  @Get('media')
  media(
    @Req() request: AuthenticatedRequest,
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    return this.instagram.media(
      response,
      request.instagram.accessToken,
      request.instagram.userId,
      query,
    );
  }

  @Get('media/:mediaId')
  mediaItem(
    @Req() request: AuthenticatedRequest,
    @Param('mediaId') mediaId: string,
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    return this.instagram.mediaItem(
      response,
      request.instagram.accessToken,
      mediaId,
      query,
    );
  }

  @Get('media/:mediaId/insights')
  mediaInsights(
    @Req() request: AuthenticatedRequest,
    @Param('mediaId') mediaId: string,
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    return this.instagram.mediaInsights(
      response,
      request.instagram.accessToken,
      mediaId,
      query,
    );
  }
}
