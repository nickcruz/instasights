import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import {
  buildLoopbackRedirectUri,
  OAUTH_CALLBACK_TIMEOUT_MS,
  waitForCallback,
} from "./oauth";

function listen(server: http.Server) {
  return new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
}

function close(server: http.Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function reserveFreePort() {
  const probe = http.createServer();
  await listen(probe);

  const address = probe.address();
  assert.ok(address && typeof address !== "string");
  const { port } = address;

  await close(probe);

  return port;
}

test("waitForCallback stays pending until the localhost callback arrives", async () => {
  const port = await reserveFreePort();
  const redirectUri = buildLoopbackRedirectUri(port);
  const callbackPromise = waitForCallback({
    redirectUri,
    expectedState: "state_123",
    timeoutMs: 500,
  });

  await new Promise<void>((resolve, reject) => {
    const request = http.get(
      `http://127.0.0.1:${port}/callback?code=code_123&state=state_123`,
      (response) => {
        response.resume();
        response.on("end", resolve);
      },
    );

    request.on("error", reject);
  });

  const callback = await callbackPromise;

  assert.deepEqual(callback, {
    code: "code_123",
    state: "state_123",
    error: null,
  });
});

test("waitForCallback times out after the configured browser wait window", async () => {
  const port = await reserveFreePort();

  await assert.rejects(
    waitForCallback({
      redirectUri: buildLoopbackRedirectUri(port),
      expectedState: "state_123",
      timeoutMs: 5,
    }),
    /Timed out waiting for Google sign-in to finish in the browser/,
  );
});

test("oauth callback timeout stays set to five minutes", () => {
  assert.equal(OAUTH_CALLBACK_TIMEOUT_MS, 5 * 60 * 1000);
});
