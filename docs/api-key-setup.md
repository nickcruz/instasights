# API Key Setup

This document explains the legacy developer API key flow for the hosted REST API.

The recommended path is the Instagram Insights skill plus bundled CLI OAuth flow. API keys remain available as a compatibility option for scripts and manual clients.

## Before you create a key

The user should already have:

1. Signed in with Google
2. Linked an Instagram account
3. Completed at least one successful sync

The supported human-facing page for this flow is:

```text
https://YOUR_APP_DOMAIN/developers
```

## Create a key

Sign in on `/developers`, open the legacy API key section, and create a personal key.

Copy the key immediately. The full secret is only shown once.

Recommended shell setup:

```bash
export INSTAGRAM_INSIGHTS_API_KEY="paste-the-key-from-the-developers-page"
```

## Use the key with REST

Example:

```bash
curl -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \
  https://YOUR_APP_DOMAIN/api/v1/account
```

Queue a sync:

```bash
curl -X POST \
  -H "Authorization: Bearer $INSTAGRAM_INSIGHTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force":false,"staleAfterHours":12}' \
  https://YOUR_APP_DOMAIN/api/v1/sync-runs
```

## Common errors

### `401 Missing bearer token`

The client is not sending `Authorization: Bearer ...`.

### `401 Invalid API key`

The key is malformed, revoked, expired, or copied incorrectly.

### `400 No linked Instagram account found`

The key owner has not connected Instagram yet.

### `404 Sync run not found`

The sync run belongs to another user or the ID is incorrect.

## Recommendation

Prefer the skill and bundled CLI whenever possible:

```bash
./skills/instagram-insights/instagram-insights auth login
./skills/instagram-insights/instagram-insights setup status
```
