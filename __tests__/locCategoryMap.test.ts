import { resolveLcSubjectUrl } from '../app/lib/locCategoryMap';

describe('locCategoryMap.resolveLcSubjectUrl', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('parses Atom-style JSON-ML feed and returns authority URL', async () => {
    const sampleAtom = JSON.stringify([
      'atom:feed',
      {},
      [
        'atom:entry',
        {},
        ['atom:title', {}, 'Museums'],
        ['atom:link', { rel: 'alternate', href: 'http://id.loc.gov/authorities/subjects/sh85088723' }]
      ]
    ]);

    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      clone: () => ({ text: async () => sampleAtom }),
    } as any));

  const res = await resolveLcSubjectUrl('Museums');
  expect(res).toBe('https://id.loc.gov/authorities/subjects/sh85088723.html');
  });

  it('uses hits/results JSON shape when present', async () => {
    const jsonHits = { hits: [{ uri: 'http://id.loc.gov/authorities/subjects/sh123', label: 'Test' }] };
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => jsonHits,
      clone: () => ({ text: async () => JSON.stringify(jsonHits) }),
    } as any));

  const res = await resolveLcSubjectUrl('Test');
  expect(res).toBe('https://id.loc.gov/authorities/subjects/sh123.html');
  });

  it('falls back to regex-extraction when body contains authority URIs in text', async () => {
    const textBody = 'some preamble... http://id.loc.gov/authorities/subjects/sh99999999 some trailing text';
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({}),
      clone: () => ({ text: async () => textBody }),
    } as any));

  const res = await resolveLcSubjectUrl('fallback-test');
  expect(res).toBe('https://id.loc.gov/authorities/subjects/sh99999999.html');
  });
});
