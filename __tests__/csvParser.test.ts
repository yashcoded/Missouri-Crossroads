import { parseCategoryPairs } from '../app/lib/parseCategoryPairs';

describe('parseCategoryPairs', () => {
  test('parses single category with www link and extracts label after colon', () => {
    const cats = 'LOC:Historic Site';
    const links = 'www.example.com';
    const pairs = parseCategoryPairs(cats, links);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].label).toBe('Historic Site');
    // URL normalization should prepend https and include trailing slash
    expect(pairs[0].url).toBe('https://www.example.com/');
  });

  test('parses multiple categories with matching links', () => {
    const cats = 'LOC:One;LOC:Two';
    const links = 'http://one.test;two.test/path';
    const pairs = parseCategoryPairs(cats, links);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].label).toBe('One');
    expect(pairs[1].label).toBe('Two');
    expect(pairs[0].url).toBe('http://one.test/');
    expect(pairs[1].url).toBe('https://two.test/path');
  });

  test('applies single link to all categories', () => {
    const cats = 'LOC:A;LOC:B;LOC:C';
    const links = 'single.example.com';
    const pairs = parseCategoryPairs(cats, links);
    expect(pairs).toHaveLength(3);
    expect(pairs.every(p => p.url === 'https://single.example.com/')).toBe(true);
  });

  test('handles invalid/empty links gracefully (url undefined)', () => {
    const cats = 'LOC:A;LOC:B';
    const links = 'not a url;';
    const pairs = parseCategoryPairs(cats, links);
    expect(pairs).toHaveLength(2);
    // invalid link should be filtered out, resulting in linksNormalized.length === 0
    // so mismatched branch will assign undefined URLs
    expect(pairs[0].url).toBeUndefined();
    expect(pairs[1].url).toBeUndefined();
  });

  test('handles more links than categories by using corresponding indices', () => {
    const cats = 'LOC:Solo';
    const links = 'a.test;b.test';
    const pairs = parseCategoryPairs(cats, links);
    expect(pairs).toHaveLength(1);
    // first link should be applied
    expect(pairs[0].url).toBe('https://a.test/');
  });
});
