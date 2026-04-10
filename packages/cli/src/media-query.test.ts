import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMediaListSearchParams,
  resolveDaysToSinceIso,
} from "./media-query";

test("resolveDaysToSinceIso computes a trailing ISO timestamp", () => {
  assert.equal(
    resolveDaysToSinceIso(30, new Date("2026-04-10T12:00:00.000Z")),
    "2026-03-11T12:00:00.000Z",
  );
});

test("buildMediaListSearchParams includes days and flat metrics", () => {
  const params = buildMediaListSearchParams({
    limit: 10,
    mediaType: "VIDEO",
    days: 30,
    flatMetrics: true,
    now: new Date("2026-04-10T12:00:00.000Z"),
  });

  assert.equal(params.get("limit"), "10");
  assert.equal(params.get("mediaType"), "VIDEO");
  assert.equal(params.get("flatMetrics"), "true");
  assert.equal(params.get("since"), "2026-03-11T12:00:00.000Z");
});

test("explicit since overrides derived days", () => {
  const params = buildMediaListSearchParams({
    days: 30,
    since: "2026-04-01T00:00:00.000Z",
    now: new Date("2026-04-10T12:00:00.000Z"),
  });

  assert.equal(params.get("since"), "2026-04-01T00:00:00.000Z");
});
