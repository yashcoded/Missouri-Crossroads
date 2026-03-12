// Pure utility to parse category/links pairs from CSV-derived strings.
// Kept intentionally free of any server-side or runtime side-effects so it can
// be imported safely in unit tests.
export function parseCategoryPairs(
  catSource: string,
  linksRawString: string
): { raw: string; label: string; url?: string }[] {
  const splitSemicolon = (s?: string) => (s || '').split(';').map(x => x.trim()).filter(Boolean);
  const labelFrom = (item: string) => {
    const parts = item.split(':').map(p => p.trim());
    return parts.length > 1 ? parts.slice(1).join(':').trim() : item;
  };

  const normalizeUrl = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    let candidate = raw.trim();
    if (!candidate) return undefined;

    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
      if (candidate.startsWith('//')) candidate = 'https:' + candidate;
      else if (candidate.startsWith('www.')) candidate = 'https://' + candidate;
      else if (/^[\w.-]+\.[a-z]{2,}($|\/)/i.test(candidate)) candidate = 'https://' + candidate;
    }

    try {
      const u = new URL(candidate);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
    } catch (_e) {
      return undefined;
    }
    return undefined;
  };

  const categories = splitSemicolon(catSource || '');
  const linksRaw = splitSemicolon(linksRawString || '');
  const linksNormalized = linksRaw.map(l => normalizeUrl(l)).filter(Boolean) as string[];

  const categoryPairs: { raw: string; label: string; url?: string }[] = [];
  if (categories.length > 0) {
    if (linksNormalized.length === categories.length) {
      for (let i = 0; i < categories.length; i++) {
        categoryPairs.push({ raw: categories[i], label: labelFrom(categories[i]), url: linksNormalized[i] });
      }
    } else if (linksNormalized.length === 1) {
      for (const c of categories) categoryPairs.push({ raw: c, label: labelFrom(c), url: linksNormalized[0] });
    } else {
      // In the route this logs a dev-only warning; keep silent here to remain a pure
      // utility. The route can choose to warn when it observes mismatches.
      for (let i = 0; i < categories.length; i++) {
        const url = i < linksNormalized.length ? linksNormalized[i] : undefined;
        categoryPairs.push({ raw: categories[i], label: labelFrom(categories[i]), url });
      }
    }
  }

  return categoryPairs;
}
