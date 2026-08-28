import { randomBytes } from 'node:crypto';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function loopbackPostPage(input: {
  redirectUri: string;
  state: string;
  credential?: string;
  error?: string;
}): { html: string; nonce: string } {
  const nonce = randomBytes(18).toString('base64');
  const fields = [
    ['state', input.state],
    input.credential ? ['credential', input.credential] : undefined,
    input.error ? ['error', input.error] : undefined,
  ]
    .filter((field): field is string[] => Boolean(field))
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`,
    )
    .join('');

  return {
    nonce,
    html: `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Instasights</title></head><body><form method="post" action="${escapeHtml(input.redirectUri)}">${fields}<noscript><button type="submit">Return to Instasights</button></noscript></form><script nonce="${nonce}">document.forms[0].submit()</script></body></html>`,
  };
}
