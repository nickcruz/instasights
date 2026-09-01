import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';

import { AuthService } from '../auth/auth.service';
import { MCP_SCOPE, type McpCredential, OAuthError } from '../auth/auth.types';
import { APP_CONFIG, type AppConfig } from '../config/environment';
import { Inject } from '@nestjs/common';
import { McpService } from './mcp.service';

@Controller()
export class McpController {
  constructor(
    private readonly auth: AuthService,
    private readonly mcpServer: McpService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get([
    '.well-known/oauth-protected-resource',
    '.well-known/oauth-protected-resource/mcp',
  ])
  protectedResource(): Record<string, unknown> {
    return {
      resource: this.auth.resourceUrl(),
      resource_name: 'Instasights Instagram analytics',
      authorization_servers: [this.config.publicUrl],
      scopes_supported: [MCP_SCOPE],
      bearer_methods_supported: ['header'],
    };
  }

  @Get('.well-known/oauth-authorization-server')
  authorizationServer(): Record<string, unknown> {
    return {
      issuer: this.config.publicUrl,
      authorization_endpoint: `${this.config.publicUrl}/oauth/authorize`,
      token_endpoint: `${this.config.publicUrl}/oauth/token`,
      registration_endpoint: `${this.config.publicUrl}/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [MCP_SCOPE],
    };
  }

  @Post('oauth/register')
  @HttpCode(201)
  register(@Body() body: unknown, @Res() response: Response): void {
    this.oauthResponse(response, 201, () => this.auth.registerClient(body));
  }

  @Get('oauth/authorize')
  authorize(
    @Query() query: Record<string, unknown>,
    @Res() response: Response,
  ): void {
    try {
      response.redirect(302, this.auth.createInstagramAuthorization(query));
    } catch (cause) {
      this.oauthError(response, cause);
    }
  }

  @Get(['api/callback', 'auth/instagram/callback'])
  async callback(
    @Query('state') state: string,
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const destination = await this.auth.completeInstagramAuthorization({
        state,
        code,
        error,
        errorDescription,
      });
      response.redirect(302, destination);
    } catch (cause) {
      this.oauthError(response, cause);
    }
  }

  @Post('oauth/token')
  token(@Body() body: unknown, @Res() response: Response): void {
    this.oauthResponse(response, 200, () =>
      this.auth.exchangeAuthorizationCode(body),
    );
  }

  @Post('mcp')
  async handleMcp(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    if (!this.originAllowed(request.headers.origin)) {
      response.status(403).json({ error: 'origin_not_allowed' });
      return;
    }
    const credential = this.authenticate(request, response);
    if (!credential) return;

    const server = this.mcpServer.createServer(credential);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch {
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message: 'Internal server error' },
        });
      }
    } finally {
      await transport.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    }
  }

  @Get('mcp')
  handleMcpGet(@Req() request: Request, @Res() response: Response): void {
    if (!this.originAllowed(request.headers.origin)) {
      response.status(403).json({ error: 'origin_not_allowed' });
      return;
    }
    if (!this.authenticate(request, response)) return;
    response
      .status(405)
      .setHeader('Allow', 'POST')
      .json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Method not allowed' },
      });
  }

  @Delete('mcp')
  handleMcpDelete(@Req() request: Request, @Res() response: Response): void {
    this.handleMcpGet(request, response);
  }

  private authenticate(
    request: Request,
    response: Response,
  ): McpCredential | undefined {
    const match = request.headers.authorization?.match(/^Bearer ([^\s]+)$/);
    if (!match) {
      this.unauthorized(response, 'unauthorized');
      return undefined;
    }
    try {
      return this.auth.readMcpCredential(match[1]);
    } catch {
      this.unauthorized(response, 'invalid_token');
      return undefined;
    }
  }

  private unauthorized(response: Response, error: string): void {
    const metadata = `${this.config.publicUrl}/.well-known/oauth-protected-resource/mcp`;
    response.setHeader(
      'WWW-Authenticate',
      `Bearer resource_metadata="${metadata}", scope="${MCP_SCOPE}"`,
    );
    response.status(401).json({ error });
  }

  private originAllowed(origin: string | undefined): boolean {
    if (!origin) return true;
    const allowed = new Set([
      new URL(this.config.publicUrl).origin,
      'https://claude.ai',
      'https://www.claude.ai',
      'https://claude.com',
      'https://www.claude.com',
    ]);
    return allowed.has(origin);
  }

  private oauthResponse(
    response: Response,
    status: number,
    operation: () => Record<string, unknown>,
  ): void {
    try {
      response.status(status).json(operation());
    } catch (cause) {
      this.oauthError(response, cause);
    }
  }

  private oauthError(response: Response, cause: unknown): void {
    if (cause instanceof OAuthError) {
      response.status(cause.status).json({
        error: cause.code,
        error_description: cause.message,
      });
      return;
    }
    response.status(400).json({
      error: 'invalid_request',
      error_description: 'OAuth request is invalid or expired',
    });
  }
}
