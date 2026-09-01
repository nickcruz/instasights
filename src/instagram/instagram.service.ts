import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG, type AppConfig } from '../config/environment';

export const PROFILE_FIELDS = [
  'id',
  'user_id',
  'username',
  'name',
  'account_type',
  'profile_picture_url',
  'followers_count',
  'follows_count',
  'media_count',
] as const;

export const MEDIA_FIELDS = [
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
] as const;

export const ACCOUNT_METRICS = [
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
] as const;

export const MEDIA_METRICS = [
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
] as const;

const PROFILE_FIELD_SET = new Set<string>(PROFILE_FIELDS);
const MEDIA_FIELD_SET = new Set<string>(MEDIA_FIELDS);
const ACCOUNT_METRIC_SET = new Set<string>(ACCOUNT_METRICS);
const MEDIA_METRIC_SET = new Set<string>(MEDIA_METRICS);
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

export type InstagramResult = {
  status: number;
  body: unknown;
  rateLimit: Record<string, string>;
};

@Injectable()
export class InstagramService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  profile(
    token: string,
    query: Record<string, unknown>,
  ): Promise<InstagramResult> {
    return this.forward('/me', token, query, { fields: PROFILE_FIELD_SET });
  }

  accountInsights(
    token: string,
    userId: string,
    query: Record<string, unknown>,
  ): Promise<InstagramResult> {
    return this.forward(`/${this.id(userId)}/insights`, token, query, {
      metrics: ACCOUNT_METRIC_SET,
      timeRange: true,
    });
  }

  media(
    token: string,
    userId: string,
    query: Record<string, unknown>,
  ): Promise<InstagramResult> {
    return this.forward(`/${this.id(userId)}/media`, token, query, {
      fields: MEDIA_FIELD_SET,
      pagination: true,
      timeRange: true,
    });
  }

  mediaItem(
    token: string,
    mediaId: string,
    query: Record<string, unknown>,
  ): Promise<InstagramResult> {
    return this.forward(`/${this.id(mediaId)}`, token, query, {
      fields: MEDIA_FIELD_SET,
    });
  }

  mediaInsights(
    token: string,
    mediaId: string,
    query: Record<string, unknown>,
  ): Promise<InstagramResult> {
    return this.forward(`/${this.id(mediaId)}/insights`, token, query, {
      metrics: MEDIA_METRIC_SET,
    });
  }

  private async forward(
    path: string,
    token: string,
    rawQuery: Record<string, unknown>,
    policy: Policy,
  ): Promise<InstagramResult> {
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
      const name =
        cause && typeof cause === 'object' && 'name' in cause
          ? String(cause.name)
          : '';
      const timedOut = name === 'TimeoutError' || name === 'AbortError';
      return {
        status: timedOut ? 504 : 502,
        rateLimit: {},
        body: {
          error: {
            message: timedOut
              ? 'Instagram request timed out'
              : 'Instagram request failed',
          },
        },
      };
    }

    const rateLimit: Record<string, string> = {};
    for (const header of RATE_LIMIT_HEADERS) {
      const value = upstream.headers.get(header);
      if (value) rateLimit[header] = value;
    }
    const body = (await upstream.json().catch(() => undefined)) as unknown;
    if (body === undefined) {
      return {
        status: 502,
        rateLimit,
        body: { error: { message: 'Instagram returned a non-JSON response' } },
      };
    }
    return {
      status: upstream.status,
      rateLimit,
      body: upstream.ok
        ? this.safeSuccess(body)
        : this.safeError(body, upstream.status),
    };
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
      message: `Instagram request failed with status ${status}`,
    };
    for (const key of ['type', 'code', 'error_subcode', 'fbtrace_id']) {
      if (typeof error[key] === 'string' || typeof error[key] === 'number') {
        safe[key] = error[key];
      }
    }
    return { error: safe };
  }
}
