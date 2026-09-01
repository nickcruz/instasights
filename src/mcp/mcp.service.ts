import { BadRequestException, Injectable } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import type { McpCredential } from '../auth/auth.types';
import {
  ACCOUNT_METRICS,
  InstagramService,
  type InstagramResult,
  MEDIA_FIELDS,
  MEDIA_METRICS,
  PROFILE_FIELDS,
} from '../instagram/instagram.service';

const PROFILE_DEFAULTS = [
  'user_id',
  'username',
  'name',
  'account_type',
  'profile_picture_url',
  'followers_count',
  'follows_count',
  'media_count',
] as const;

const MEDIA_DEFAULTS = [
  'id',
  'caption',
  'comments_count',
  'like_count',
  'media_product_type',
  'media_type',
  'permalink',
  'timestamp',
  'thumbnail_url',
] as const;

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

function query(
  values: Record<string, string | number | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

function toolResult(value: InstagramResult) {
  const body: Record<string, unknown> =
    value.body && typeof value.body === 'object' && !Array.isArray(value.body)
      ? { ...(value.body as Record<string, unknown>) }
      : { data: value.body };
  if (value.status >= 400) {
    body.upstream_status = value.status;
    if (Object.keys(value.rateLimit).length) body.rate_limit = value.rateLimit;
  }
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(body) }],
    structuredContent: body,
    isError: value.status >= 400,
  };
}

@Injectable()
export class McpService {
  constructor(private readonly instagram: InstagramService) {}

  createServer(credential: McpCredential): Server {
    const server = new Server(
      { name: 'instasights', version: '3.0.0' },
      { capabilities: { tools: {} } },
    );
    server.setRequestHandler(ListToolsRequestSchema, () =>
      Promise.resolve({ tools: this.tools() }),
    );
    server.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.callTool(
        request.params.name,
        this.arguments(request.params.arguments),
        credential,
      ),
    );
    return server;
  }

  tools(): Tool[] {
    const fields = (values: readonly string[], description: string) => ({
      type: 'array' as const,
      minItems: 1,
      uniqueItems: true,
      items: { type: 'string' as const, enum: [...values] },
      description,
    });
    const timestamp = {
      type: 'integer' as const,
      minimum: 0,
      description: 'Unix timestamp in seconds.',
    };
    return [
      {
        name: 'instagram_get_profile',
        title: 'Get Instagram profile',
        description:
          'Read the authenticated professional Instagram account profile live. No data is stored by Instasights.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fields: fields(
              PROFILE_FIELDS,
              `Profile fields. Defaults to ${PROFILE_DEFAULTS.join(', ')}.`,
            ),
          },
        },
        annotations: READ_ONLY,
      },
      {
        name: 'instagram_get_account_insights',
        title: 'Get Instagram account insights',
        description:
          'Read selected account-level analytics live from Instagram. Metrics must be explicitly selected.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['metrics'],
          properties: {
            metrics: fields(ACCOUNT_METRICS, 'Account insight metrics to request.'),
            period: {
              type: 'string',
              enum: ['day', 'week', 'days_28', 'month', 'lifetime'],
            },
            metricType: {
              type: 'string',
              enum: ['time_series', 'total_value'],
            },
            breakdown: {
              type: 'string',
              enum: [
                'age',
                'city',
                'contact_button_type',
                'country',
                'follow_type',
                'gender',
                'media_product_type',
              ],
            },
            since: timestamp,
            until: timestamp,
          },
        },
        annotations: READ_ONLY,
      },
      {
        name: 'instagram_list_media',
        title: 'List Instagram media',
        description:
          'List media live with cursor pagination. Pass paging.cursors.after as after to fetch the next page.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            fields: fields(
              MEDIA_FIELDS,
              `Media fields. Defaults to ${MEDIA_DEFAULTS.join(', ')}.`,
            ),
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            after: { type: 'string', minLength: 1, maxLength: 2048 },
            before: { type: 'string', minLength: 1, maxLength: 2048 },
            since: timestamp,
            until: timestamp,
          },
        },
        annotations: READ_ONLY,
      },
      {
        name: 'instagram_get_media',
        title: 'Get Instagram media',
        description: 'Read one media item live by its numeric Instagram media ID.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['mediaId'],
          properties: {
            mediaId: { type: 'string', pattern: '^\\d+$' },
            fields: fields(
              MEDIA_FIELDS,
              `Media fields. Defaults to ${MEDIA_DEFAULTS.join(', ')}.`,
            ),
          },
        },
        annotations: READ_ONLY,
      },
      {
        name: 'instagram_get_media_insights',
        title: 'Get Instagram media insights',
        description:
          'Read selected analytics for one media item live. Metric availability varies by media type.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['mediaId', 'metrics'],
          properties: {
            mediaId: { type: 'string', pattern: '^\\d+$' },
            metrics: fields(MEDIA_METRICS, 'Media insight metrics to request.'),
          },
        },
        annotations: READ_ONLY,
      },
    ];
  }

  private async callTool(
    name: string,
    args: Record<string, unknown>,
    credential: McpCredential,
  ) {
    switch (name) {
      case 'instagram_get_profile': {
        this.only(args, ['fields']);
        const fields = this.stringArray(
          args.fields,
          PROFILE_FIELDS,
          false,
        ) ?? [...PROFILE_DEFAULTS];
        return toolResult(
          await this.instagram.profile(credential.accessToken, {
            fields: fields.join(','),
          }),
        );
      }
      case 'instagram_get_account_insights': {
        this.only(args, [
          'metrics',
          'period',
          'metricType',
          'breakdown',
          'since',
          'until',
        ]);
        const metrics = this.stringArray(args.metrics, ACCOUNT_METRICS, true);
        return toolResult(
          await this.instagram.accountInsights(
            credential.accessToken,
            credential.userId,
            query({
              metric: metrics?.join(','),
              period: this.optionalString(args.period),
              metric_type: this.optionalString(args.metricType),
              breakdown: this.optionalString(args.breakdown),
              since: this.optionalInteger(args.since),
              until: this.optionalInteger(args.until),
            }),
          ),
        );
      }
      case 'instagram_list_media': {
        this.only(args, [
          'fields',
          'limit',
          'after',
          'before',
          'since',
          'until',
        ]);
        const fields =
          this.stringArray(args.fields, MEDIA_FIELDS, false) ?? [...MEDIA_DEFAULTS];
        return toolResult(
          await this.instagram.media(
            credential.accessToken,
            credential.userId,
            query({
              fields: fields.join(','),
              limit: this.optionalInteger(args.limit),
              after: this.optionalString(args.after),
              before: this.optionalString(args.before),
              since: this.optionalInteger(args.since),
              until: this.optionalInteger(args.until),
            }),
          ),
        );
      }
      case 'instagram_get_media': {
        this.only(args, ['mediaId', 'fields']);
        const mediaId = this.mediaId(args.mediaId);
        const fields =
          this.stringArray(args.fields, MEDIA_FIELDS, false) ?? [...MEDIA_DEFAULTS];
        return toolResult(
          await this.instagram.mediaItem(credential.accessToken, mediaId, {
            fields: fields.join(','),
          }),
        );
      }
      case 'instagram_get_media_insights': {
        this.only(args, ['mediaId', 'metrics']);
        const mediaId = this.mediaId(args.mediaId);
        const metrics = this.stringArray(args.metrics, MEDIA_METRICS, true);
        return toolResult(
          await this.instagram.mediaInsights(credential.accessToken, mediaId, {
            metric: metrics?.join(','),
          }),
        );
      }
      default:
        throw new BadRequestException('Unknown tool');
    }
  }

  private arguments(value: unknown): Record<string, unknown> {
    if (value === undefined) return {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Tool arguments must be an object');
    }
    return value as Record<string, unknown>;
  }

  private only(args: Record<string, unknown>, allowed: string[]): void {
    const unexpected = Object.keys(args).find((key) => !allowed.includes(key));
    if (unexpected) {
      throw new BadRequestException(`Unsupported tool argument: ${unexpected}`);
    }
  }

  private stringArray(
    value: unknown,
    allowed: readonly string[],
    required: boolean,
  ): string[] | undefined {
    if (value === undefined && !required) return undefined;
    if (
      !Array.isArray(value) ||
      value.length < 1 ||
      value.some((item) => typeof item !== 'string' || !allowed.includes(item))
    ) {
      throw new BadRequestException('Tool argument contains an unsupported value');
    }
    return [...new Set(value as string[])];
  }

  private optionalString(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !value || value.length > 2048) {
      throw new BadRequestException('Tool string argument is invalid');
    }
    return value;
  }

  private optionalInteger(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    if (!Number.isSafeInteger(value) || (value as number) < 0) {
      throw new BadRequestException('Tool integer argument is invalid');
    }
    return value as number;
  }

  private mediaId(value: unknown): string {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      throw new BadRequestException('mediaId must be a numeric Instagram media ID');
    }
    return value;
  }
}
