import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInsightsPath,
  buildMediaListPath,
  parseOptions,
} from '../src/instasights.mjs';

test('parseOptions requires flag/value pairs', () => {
  assert.deepEqual(parseOptions(['--limit', '10', '--after', 'cursor']), {
    limit: '10',
    after: 'cursor',
  });
  assert.throws(() => parseOptions(['--limit']), /requires a value/);
});

test('insights path uses live metrics and supports explicit time ranges', () => {
  const path = buildInsightsPath([
    '--metric',
    'views,reach',
    '--since',
    '100',
    '--until',
    '200',
  ]);
  assert.match(path, /^\/v1\/instagram\/me\/insights\?/);
  const query = new URL(`https://example.test${path}`).searchParams;
  assert.equal(query.get('metric'), 'views,reach');
  assert.equal(query.get('since'), '100');
  assert.equal(query.get('until'), '200');
});

test('command builders reject misspelled options', () => {
  assert.throws(() => buildInsightsPath(['--metrc', 'views']), /Unsupported option/);
  assert.throws(() => buildMediaListPath(['--limt', '5']), /Unsupported option/);
});

test('media list path preserves cursor paging', () => {
  const path = buildMediaListPath(['--limit', '5', '--after', 'cursor_123']);
  const query = new URL(`https://example.test${path}`).searchParams;
  assert.equal(query.get('limit'), '5');
  assert.equal(query.get('after'), 'cursor_123');
});
