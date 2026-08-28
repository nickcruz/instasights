import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';

import { APP_CONFIG, type AppConfig } from '../config/environment';

const PROFILE_FIELDS = new Set([
  'id',
  'user_id',
  'username',
  'name',
  'account_type',
  'profile_picture_url',
  'followers_count',
  'follows_count',
  'media_count',
]);

const MEDIA_FIELDS = new Set([
  'id',
  'caption',
  'comments_count',
  'is_comment_enabled',
  'like_count',
  'media_product_type',
  'media_type',
  'media_url',
  'owner',
  'permalink',
  'shortcode',
  'thumbnail_url',
  'timestamp',
  'username',
]);

const ACCOUNT_METRICS = new Set([
  'accounts_engaged',
  'comments',
  'follows_and_unfollows',
  'likes',
  'reach',
  'replies',
  'saves',
  'shares',
  'total_interactions',
  'views',
]);

const MEDIA_METRICS = new Set([
  'comments',
  'follows',
  'likes',
  'navigation',
  'profile_activity',
  'profile_visits',
  'reach',
  'replies',
  'saved',
  'shares',
  'total_interactions',
  'views',
  'watch_time',
]);

const RATE_LIMIT_HEADERS = [
  'retry-after',
  'x-app-usage',
  'x-business-use-case-usage',
] as const;

type Policy = {
  fields?: Set<string>;
  metrics?: Set<string>;
  pagination?: boolean;
  timeRange?: boolean;
};

@Injectable()
export class InstagramService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  profile(
    response: Response,
    token: string,
    query: Record<string, unknown>,
  ): Promise<void> {
    return this.forward(response, '/me', token, query, {
      fields: PROFILE_FIELDS,
    });
  }

  accountInsights(
    response: Response,
    token: string,
    userId: string,
    query: Record<string, unknown>,
  ): Promise<void> {
    return this.forward(response, `/${this.id(userId)}/insights`, token, query, {
      metrics: ACCOUNT_METRICS,
      timeRange: true,
    });
  }

  media(
    response: Response,
    token: string,
    userId: string,
    query: Record<string, unknown>,
  ): Promise<void> {
    return this.forward(response, `/${this.id(userId)}/media`, token, query, {
      fields: MEDIA_FIELDS,
      pagination: true,
      timeRange: true,
    });
  }

  mediaItem(
    response: Response,
    token: string,
    mediaId: string,
    query: Record<string, unknown>,
  ): Promise<void> {
    return this.forward(response, `/${this.id(mediaId)}`, token, query, {
      fields: MEDIA_FIELDS,
    });
  }

  mediaInsights(
    response: Response,
    token: string,
    mediaId: string,
    query: Record<string, unknown>,
  ): Promise<void> {
    return this.forward(response, `/${this.id(mediaId)}/insights`, token, query, {
      metrics: MEDIA_METRICS,
    });
  }

  private async forward(
    response: Response,
    path: string,
    token: string,
    rawQuery: Record<string, unknown>,
    policy: Policy,
  ): Promise<void> {
    const url = new URL(
      `https://graph.instagram.com/${this.config.graphVersion}${path}`,
    );
    const query = this.validateQuery(rawQuery, policy);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (cause) {
      const causeName =
        cause && typeof cause === 'object' && 'name' in cause
          ? String(cause.name)
          : '';
      const timedOut = causeName === 'TimeoutError' || causeName === 'AbortError';
      response.status(timedOut ? 504 : 502).json({
        error: {
          message: timedOut
            ? 'Instagram request timed out'
            : 'Instagram request failed',
        },
      });
      return;
    }

    for (const header of RATE_LIMIT_HEADERS) {
      const value = upstream.headers.get(header);
      if (value) response.setHeader(header, value);
    }

    const body = (await upstream.json().catch(() => undefined)) as unknown;
    if (body === undefined) {
      response.status(502).json({
        error: { message: 'Instagram returned a non-JSON response' },
      });
      return;
    }

    response.status(upstream.status).json(
      upstream.ok ? this.safeSuccess(body) : this.safeError(body, upstream.status),
    );
  }

  private validateQuery(
    raw: Record<string, unknown>,
    policy: Policy,
  ): Record<string, string> {
    const allowed = new Set<string>();
    if (policy.fields) allowed.add('fields');
    if (policy.metrics) {
      allowed.add('metric');
      allowed.add('metric_type');
      allowed.add('period');
      allowed.add('breakdown');
    }
    if (policy.pagination) {
      allowed.add('limit');
      allowed.add('after');
      allowed.add('before');
    }
    if (policy.timeRange) {
      allowed.add('since');
      allowed.add('until');
    }

    const result: Record<string, string> = {};
    for (const [key, rawValue] of Object.entries(raw)) {
      if (!allowed.has(key)) {
        throw new BadRequestException(`Unsupported query parameter: ${key}`);
      }
      if (typeof rawValue !== 'string' || !rawValue) {
        throw new BadRequestException(`${key} must be a non-empty string`);
      }
      result[key] = rawValue;
    }

    if (result.fields && policy.fields) {
      result.fields = this.commaList('fields', result.fields, policy.fields);
    }
    if (result.metric && policy.metrics) {
      result.metric = this.commaList('metric', result.metric, policy.metrics);
    }
    if (result.limit && !/^(?:[1-9]|[1-9]\d|100)$/.test(result.limit)) {
      throw new BadRequestException('limit must be an integer from 1 to 100');
    }
    for (const key of ['since', 'until'] as const) {
      if (result[key] && !/^\d{1,12}$/.test(result[key])) {
        throw new BadRequestException(`${key} must be a Unix timestamp`);
      }
    }
    if (
      result.period &&
      !['day', 'week', 'days_28', 'month', 'lifetime'].includes(result.period)
    ) {
      throw new BadRequestException('period is unsupported');
    }
    if (
      result.metric_type &&
      !['time_series', 'total_value'].includes(result.metric_type)
    ) {
      throw new BadRequestException('metric_type is unsupported');
    }
    if (
      result.breakdown &&
      ![
        'age',
        'city',
        'contact_button_type',
        'country',
        'follow_type',
        'gender',
        'media_product_type',
      ].includes(result.breakdown)
    ) {
      throw new BadRequestException('breakdown is unsupported');
    }
    return result;
  }

  private commaList(name: string, value: string, allowed: Set<string>): string {
    const items = value.split(',').map((item) => item.trim());
    if (!items.length || items.some((item) => !allowed.has(item))) {
      throw new BadRequestException(`${name} contains an unsupported value`);
    }
    return [...new Set(items)].join(',');
  }

  private id(value: string): string {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('Instagram resource ID is invalid');
    }
    return value;
  }

  private safeSuccess(body: unknown): unknown {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
    const result = { ...(body as Record<string, unknown>) };
    const paging = result.paging;
    if (paging && typeof paging === 'object' && !Array.isArray(paging)) {
      const source = paging as Record<string, unknown>;
      result.paging = source.cursors ? { cursors: source.cursors } : {};
    }
    return result;
  }

  private safeError(body: unknown, status: number): Record<string, unknown> {
    const source =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>).error
        : undefined;
    const error =
      source && typeof source === 'object'
        ? (source as Record<string, unknown>)
        : {};
    const safe: Record<string, unknown> = {
      message:
        typeof error.message === 'string'
          ? error.message
          : `Instagram request failed with status ${status}`,
    };
    for (const key of ['type', 'code', 'error_subcode', 'fbtrace_id']) {
      if (typeof error[key] === 'string' || typeof error[key] === 'number') {
        safe[key] = error[key];
      }
    }
    return { error: safe };
  }
}
