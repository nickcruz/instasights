# Instagram API Contract

Instasights uses the Instagram API with Instagram Login. It does not use Facebook Login, Instagram Basic Display, messaging, publishing, or comments permissions.

## Authentication

- Authorization host: `https://www.instagram.com/oauth/authorize`
- Short-token exchange: `POST https://api.instagram.com/oauth/access_token`
- Long-token exchange: `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token`
- Refresh: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`
- Scopes: `instagram_business_basic`, `instagram_business_manage_insights`
- Redirect URI: exact configured HTTPS callback; `/api/callback` is retained for the existing Meta app and `/auth/instagram/callback` is an equivalent alias
- Long-lived token lifetime: approximately 60 days; refresh only while the token is valid and at least 24 hours old

The CLI receives an encrypted, proof-bound application credential rather than the raw Instagram token. No token is persisted by the API.

## Live Graph requests

The API pins `GRAPH_API_VERSION` and exposes allowlisted wrappers for:

- `GET /me` — professional-account profile
- `GET /{instagram-user-id}/insights` — account insights
- `GET /{instagram-user-id}/media` — cursor-paginated media
- `GET /{instagram-media-id}` — media fields
- `GET /{instagram-media-id}/insights` — media insights

Instasights uses `Authorization: Bearer` for upstream Graph calls. It never forwards arbitrary Graph paths. Full upstream `paging.next` and `paging.previous` URLs are removed because Meta may place access tokens in them; only `paging.cursors` is returned.

## Metrics and limitations

- Prefer current metrics such as `views`, `reach`, `accounts_engaged`, and `total_interactions`.
- Do not request deprecated `impressions`, `plays`, `video_views`, `profile_views`, or contact-click time-series metrics.
- Available media metrics vary by media type.
- Some account metrics require at least 100 followers.
- Empty data means unavailable, not zero.
- Account insight history is generally limited to 90 days.
- Media insights may be delayed and have separate retention rules.

## Access requirements

The Instagram account must be Business or Creator. A personal Instagram account is unsupported. A truly external user may require Advanced Access, App Review, and Business Verification; app-role/test users can use Standard Access while developing.

## Official references

- https://developers.facebook.com/docs/instagram-platform/overview
- https://developers.facebook.com/docs/instagram-platform/insights/
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/
- https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/
- https://developers.facebook.com/docs/graph-api/changelog/version22.0/
