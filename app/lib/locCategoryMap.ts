// NOTE: Removed hard-coded LOC_CATEGORY_URLS. We now always search id.loc.gov
// subject authorities dynamically and return either an authority page URL
// (preferred) or a search page on id.loc.gov as a fallback.

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Simple synonyms/plurals map to catch common variants
const CATEGORY_SYNONYMS: Record<string, string> = {
  cemeteries: 'cemetery',
  cemeterys: 'cemetery', // common misspelling
  museums: 'museum',
  monuments: 'monument',
  libraries: 'library',
  parks: 'park',
  schools: 'school',
};

// Cache resolved LC URLs to avoid repeated network lookups
const lcResolveCache = new Map<string, { url: string | null; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const MAX_HITS_TO_CHECK = 20;
const LC_FETCH_TIMEOUT_MS = 3000; // 3s
const SCORE_THRESHOLD = 0.5;

// ---- LC Subject Headings search / fuzzy resolve ----------------------------

interface LcSearchHit {
  uri?: string;
  label?: string;
  // allow other fields to exist without typing them
  [key: string]: unknown;
}

interface LcSearchResponse {
  hits?: LcSearchHit[];
  results?: LcSearchHit[];
}

/**
 * Fetch raw search hits from id.loc.gov for LC Subject Headings.
 * Restricts to LC Subject Headings via memberOf=sh:
 */
async function fetchLcSubjectHits(label: string, timeoutMs = LC_FETCH_TIMEOUT_MS): Promise<LcSearchHit[]> {
  // Build a focused id.loc.gov search URL that restricts to LC Subject Headings
  // collection and prefers SimpleType/Authority records as requested.
  // The API accepts multiple `q=` parameters; include the main query first
  // and then the rdftype/memberOf/cs filters as additional q parts.
  const mainQ = encodeURIComponent(label.trim());
  const rdftypeSimple = encodeURIComponent('rdftype:SimpleType');
  const rdftypeAuthority = encodeURIComponent('rdftype:Authority');
  const memberOfFilter = encodeURIComponent('memberOf:http://id.loc.gov/authorities/subjects/collection_LCSH_General');
  const csFilter = encodeURIComponent('cs:http://id.loc.gov/authorities/subjects');
  // Use fo=json and st=list as suggested; include the q parts in the same order
  const url = `https://id.loc.gov/search/?q=${mainQ}&q=${rdftypeSimple}&q=${memberOfFilter}&q=${rdftypeAuthority}&q=${csFilter}&fo=json&st=list`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        // mimic a browser UA to avoid bot-blocking or different server behavior
        'User-Agent': 'Mozilla/5.0 (compatible; Mozilla/5.0; +https://example.com)'
      }
    });
    clearTimeout(id);
    if (!resp.ok) {
      console.error('LC subject search failed:', resp.status, resp.statusText);
      return [];
    }

    // Try to parse the response as the expected JSON search shape first.
    let data: any = null;
    try {
      data = await resp.json();
    } catch (e) {
      // Fall through: some id.loc.gov endpoints return a JSON-ified Atom feed
      // (an array/jsonml) which `resp.json()` may succeed on or fail — we
      // attempt a more tolerant parsing below when necessary.
    }

    // If the response looks like the search JSON with hits/results, return
    // those immediately.
    const hitsFromJson = data?.hits ?? data?.results ?? null;
    if (Array.isArray(hitsFromJson) && hitsFromJson.length) return hitsFromJson as LcSearchHit[];

    // If the response is not the expected shape, try parsing it as text and
    // handle the Atom-style JSON (json-xml converted form) that id.loc.gov
    // sometimes returns. We'll look for `atom:entry` elements and extract
    // `atom:title` and `atom:link` hrefs that point to authorities/subjects.
    try {
      // resp.json() may have consumed the body; use a clone to read raw text
      const text = await resp.clone().text();
      const atomHits = parseAtomJsonForHits(text);
      if (atomHits.length) return atomHits;

      // final fallback: scan text for authority URIs
      const reHits = extractAuthorityUrisFromText(text);
      if (reHits.length) return reHits;
    } catch (e) {
      // ignore
    }

      // If the strict multi-q search returned no hits, try a simpler memberOf=sh:
      // form which sometimes yields results for broader terms.
      try {
        const fallbackUrl = `https://id.loc.gov/search/?q=${mainQ}&format=json&memberOf=sh%3A`;
        const fallbackResp = await fetch(fallbackUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Mozilla/5.0; +https://example.com)'
          }
        });
        if (fallbackResp.ok) {
          // tolerant parse like above
          let fdata: any = null;
          try {
            fdata = await fallbackResp.json();
          } catch (e) {
            // ignore
          }
          const fallbackHits = fdata?.hits ?? fdata?.results ?? null;
          if (Array.isArray(fallbackHits) && fallbackHits.length) return fallbackHits as LcSearchHit[];

          try {
            const text2 = await fallbackResp.clone().text();
            const atomHits2 = parseAtomJsonForHits(text2);
            if (atomHits2.length) return atomHits2;

            const reHits2 = extractAuthorityUrisFromText(text2);
            if (reHits2.length) return reHits2;
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore fallback errors
      }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      console.warn('LC subject search aborted (timeout) for', label);
    } else {
      console.error('Error fetching LC subject hits:', err);
    }
    return [];
  }

  // Final fallback: some queries return richer results when asked for Atom/XML
  // rather than JSON. Try a simple `format=atom` request and extract any
  // authority subject links from the XML body.
  try {
    const atomUrl = `https://id.loc.gov/search/?q=${mainQ}&format=atom&start=1`;
    const respAtom = await fetch(atomUrl, {
      signal: (new AbortController()).signal,
      headers: {
        Accept: 'application/atom+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; Mozilla/5.0; +https://example.com)'
      }
    });
    if (respAtom.ok) {
      const text = await respAtom.text();
      const atomExtract = extractAuthorityUrisFromText(text);
      if (atomExtract.length) return atomExtract;
    }
  } catch (e) {
    // ignore atom fallback errors
  }
  // Nothing found
  return [];
}

// Parse Atom-style JSON (jsonml) responses id.loc.gov sometimes returns.
// The payload is usually an array where entries are sub-arrays beginning with
// "atom:entry". We scan for those entries and extract a label and any
// alternate link hrefs that point to id.loc.gov/authorities/subjects/...
function parseAtomJsonForHits(bodyText: string): LcSearchHit[] {
  if (!bodyText) return [];
  let parsed: any;
  try {
    parsed = JSON.parse(bodyText);
  } catch (e) {
    return [];
  }

  const hits: LcSearchHit[] = [];

  // Walk the jsonml structure recursively and collect atom:entry nodes
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node) && node.length > 0 && node[0] === 'atom:entry') {
      // node is like [ 'atom:entry', {attrs}, [ 'atom:title', ... ], [ 'atom:link', { href, rel, type } ], ... ]
      let title: string | undefined;
      let uri: string | undefined;
      for (const child of node.slice(1)) {
        if (!Array.isArray(child) || child.length === 0) continue;
        const tag = child[0];
        if (tag === 'atom:title' && typeof child[2] === 'string') {
          title = child[2];
        }
        if (tag === 'atom:link') {
          const attrs = child[1] || {};
          const href = attrs.href || attrs.HREF || attrs.Href;
          const rel = attrs.rel || attrs.REL;
          // prefer alternate links that point to authorities/subjects
          // Prefer true authority subject URIs that start with the `sh` id
          // component (e.g. /authorities/subjects/sh85088723). Reject
          // collection or classification URIs like collection_LCSH_General.
          if (typeof href === 'string' && /id\.loc\.gov\/authorities\/subjects\/sh[A-Za-z0-9_.-]+/.test(href)) {
            uri = href;
          }
        }
      }
      if (uri || title) {
        hits.push({ uri, label: title });
      }
    }

    // Recurse into arrays/objects
    if (Array.isArray(node)) {
      for (const c of node) walk(c);
    } else if (typeof node === 'object') {
      for (const k of Object.keys(node)) walk(node[k]);
    }
  }

  walk(parsed);
  return hits;
}

// As a final fallback, scan raw text for authority subject URIs. This catches
// cases where the payload isn't well-formed JSON-ML or our walker misses the
// link location but the URI appears in the text somewhere.
function extractAuthorityUrisFromText(bodyText: string): LcSearchHit[] {
  if (!bodyText) return [];
  const hits: LcSearchHit[] = [];
  // Only capture authority subjects that begin with the 'sh' prefix to avoid
  // matching collection or classification URIs (e.g. collection_LCSH_General).
  const re = /https?:\/\/id\.loc\.gov\/authorities\/subjects\/sh[A-Za-z0-9_.-]+/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(bodyText))) {
    const uri = m[0];
    if (!seen.has(uri)) {
      seen.add(uri);
      hits.push({ uri });
    }
  }
  return hits;
}

// Generate a small, deterministic list of candidate queries derived from the
// original label. Starts with the original input, then single tokens, then
// reversed order, then pair permutations (bounded) to avoid combinatorial explosion.
function generateCandidateQueries(label: string, maxCandidates = 12): string[] {
  const normalized = normalizeCategory(label);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const candidates = new Set<string>();
  candidates.add(normalized);

  // Add a full-phrase plural/singular variant
  if (normalized.endsWith('s')) candidates.add(normalized.slice(0, -1));
  else candidates.add(`${normalized}s`);

  // Single tokens and their plural/singular variants
  for (const t of tokens) {
    const tk = t.trim();
    if (!tk) continue;
    candidates.add(tk);
    if (tk.endsWith('s')) candidates.add(tk.slice(0, -1));
    else candidates.add(`${tk}s`);
    if (candidates.size >= maxCandidates) break;
  }

  // Reversed
  if (tokens.length > 1) candidates.add(tokens.slice().reverse().join(' '));

  // Pair permutations (bounded)
  if (tokens.length <= 6) {
    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        if (i === j) continue;
        candidates.add(`${tokens[i]} ${tokens[j]}`);
        if (candidates.size >= maxCandidates) break;
      }
      if (candidates.size >= maxCandidates) break;
    }
  }

  // Add synonyms/plural mappings for generated candidates
  const snapshot = Array.from(candidates);
  for (const c of snapshot) {
    const key = c.toLowerCase();
    if (CATEGORY_SYNONYMS[key]) candidates.add(CATEGORY_SYNONYMS[key]);
    // try naive singular by removing trailing 's'
    if (key.endsWith('s')) candidates.add(key.slice(0, -1));
    // try naive plural by adding trailing 's'
    if (!key.endsWith('s')) candidates.add(`${key}s`);
    if (candidates.size >= maxCandidates) break;
  }

  // Ensure deterministic order: original first, then the rest in insertion order
  const out: string[] = [];
  out.push(normalized);
  for (const c of candidates) {
    if (c === normalized) continue;
    out.push(c);
    if (out.length >= maxCandidates) break;
  }
  return out;
}

/**
 * Simple fuzzy scoring between the query and a candidate label.
 *  - 1.0  = exact match (case-insensitive)
 *  - 0.9  = one starts with the other
 *  - 0.75 = one contains the other
 *  - 0.4–0.7 = based on word overlap (Jaccard similarity)
 */
function scoreLabelMatch(query: string, candidate: string): number {
  const q = query.toLowerCase().trim();
  const c = candidate.toLowerCase().trim();

  if (!q || !c) return 0;

  if (q === c) return 1.0;

  if (c.startsWith(q) || q.startsWith(c)) return 0.9;

  if (c.includes(q) || q.includes(c)) return 0.75;

  const qTokens = new Set(q.split(/\s+/));
  const cTokens = new Set(c.split(/\s+/));

  let intersection = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) intersection++;
  }
  const unionSize = new Set([...qTokens, ...cTokens]).size;
  const jaccard = unionSize === 0 ? 0 : intersection / unionSize; // 0–1

  // Map Jaccard [0,1] into [0.4,0.7] just so "kinda close" isn't treated as 0
  return 0.4 + jaccard * 0.3;
}

/**
 * Try to resolve a human label (e.g. "Anthropological archives")
 * to the *best* LC Subject Heading URL using fuzzy matching.
 *
 * Returns something like:
 *   https://id.loc.gov/authorities/subjects/sh85005574.html
 * or null if nothing is a good match.
 */
async function resolveLcSubjectUrlFuzzy(label: string): Promise<string | null> {
  const normalized = normalizeCategory(label);

  // Check cache
  const cached = lcResolveCache.get(normalized);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.url;
  }

  // Generate candidate queries (original, tokens, small permutations)
  const candidates = generateCandidateQueries(label);

  // Accumulate best score per normalized authority URI across all candidates
  const bestByUri = new Map<string, { uri: string; label?: string; score: number; firstCandidateIndex: number }>();

  for (let ci = 0; ci < candidates.length; ci++) {
    const candidate = candidates[ci];
    const hits = await fetchLcSubjectHits(candidate);
    if (!hits.length) continue;

    const query = candidate.toLowerCase().trim();

    // Limit number of hits to check to avoid excessive work
    const hitsToCheck = hits.slice(0, MAX_HITS_TO_CHECK);

    for (const hit of hitsToCheck) {
      const hitLabel = typeof hit.label === 'string' ? hit.label : undefined;
      const hitUriRaw = typeof hit.uri === 'string' ? hit.uri : undefined;
      if (!hitUriRaw) continue;

      // Only consider authority subject URIs
      if (!/id\.loc\.gov\/authorities\/subjects\//.test(hitUriRaw)) continue;

      // Normalize URI early for consistent deduping
      const normUri = ensureHtmlSuffix(hitUriRaw);

      // If we don't have a label, we can't score well; skip scoring but keep
      // a placeholder with score 0 if not present yet.
      const score = hitLabel ? scoreLabelMatch(query, hitLabel) : 0;

      // Hard short-circuit: exact match (within floating point tolerance)
      if (score >= 0.999) {
        lcResolveCache.set(normalized, { url: normUri, ts: Date.now() });
        return normUri;
      }

      const existing = bestByUri.get(normUri);
      if (!existing || score > existing.score || (score === existing.score && ci < existing.firstCandidateIndex)) {
        bestByUri.set(normUri, { uri: normUri, label: hitLabel, score, firstCandidateIndex: ci });
      }
    }
  }

  // Choose the best-scoring URI across all candidates
  let chosen: { uri: string; label?: string; score: number; firstCandidateIndex: number } | null = null;
  for (const v of bestByUri.values()) {
    if (!chosen || v.score > chosen.score || (v.score === chosen.score && v.firstCandidateIndex < chosen.firstCandidateIndex)) {
      chosen = v;
    }
  }

  if (chosen && chosen.score >= SCORE_THRESHOLD) {
    lcResolveCache.set(normalized, { url: chosen.uri, ts: Date.now() });
    return chosen.uri;
  }

  // Nothing authoritative found after trying candidates: cache null and return null
  lcResolveCache.set(normalized, { url: null, ts: Date.now() });
  return null;
}



function ensureHtmlSuffix(uri: string): string {
  let trimmed = uri.trim();
  // Prefer https
  if (trimmed.startsWith('http://')) trimmed = 'https://' + trimmed.slice('http://'.length);

  // Strip common machine-readable suffixes that id.loc.gov may return
  if (trimmed.endsWith('.json')) trimmed = trimmed.slice(0, -'.json'.length);
  if (trimmed.endsWith('.rdf')) trimmed = trimmed.slice(0, -'.rdf'.length);

  // If it already points to an HTML page or is a directory-like URL, return
  // with a stable trailing form. We prefer canonical .html pages for user
  // navigation.
  if (trimmed.endsWith('.html')) return trimmed;
  if (trimmed.endsWith('/')) trimmed = trimmed.slice(0, -1);

  return `${trimmed}.html`;
}

// ---- Public API ------------------------------------------------------------

/**
 * Get the most appropriate LOC URL for a given category/subject:
 *
 * 1. If it matches a known hard-coded category -> return that URL.
 * 2. Else, try to resolve as an LC Subject Heading (fuzzy).
 * 3. Else, fall back to a generic LOC search JSON endpoint.
 */
export async function getLocUrlForCategory(
  category?: string | null
): Promise<string | null> {
  if (!category) {
    return null;
  }

  // normalize and apply synonyms/plurals
  let normalized = normalizeCategory(category);
  if (CATEGORY_SYNONYMS[normalized]) {
    normalized = CATEGORY_SYNONYMS[normalized];
  }

  // Try LC Subject Headings via id.loc.gov with fuzzy matching
  const subjectUrl = await resolveLcSubjectUrlFuzzy(category);
  if (subjectUrl) {
    return subjectUrl;
  }

  // 3) Fallback: return an id.loc.gov search page (HTML) so callers always
  // receive a navigable page within id.loc.gov rather than a JSON endpoint.
  return buildLocSearchFallback(category);
}

// Build a richer id.loc.gov search fallback URL that mirrors the multi-q
// search used by our resolver (rdftype, cs, memberOf). We encode spaces as
// plus signs for a friendlier query string.
function buildLocSearchFallback(label?: string | null): string | null {
  if (!label) return null;
  const raw = label.trim();
  // encode with encodeURIComponent then replace %20 with '+' to emulate
  // application/x-www-form-urlencoded spaces.
  const q0 = encodeURIComponent(raw).replace(/%20/g, '+');
  const parts = [
    `q=${q0}`,
    `q=${encodeURIComponent('rdftype:SimpleType')}`,
    `q=${encodeURIComponent('rdftype:Authority')}`,
    `q=${encodeURIComponent('cs:http://id.loc.gov/authorities/subjects')}`,
    `q=${encodeURIComponent('memberOf:http://id.loc.gov/authorities/subjects/collection_LCSH_General')}`,
  ];
  return `https://id.loc.gov/search/?${parts.join('&')}`;
}

// Public thin wrapper to expose subject-heading fuzzy resolver for server-side
// usage (API endpoints, ingestion scripts, etc.). Returns a LOC authorities
// page URL (eg. https://id.loc.gov/authorities/subjects/sh85005574.html) or
// null when no good match is found.
export async function resolveLcSubjectUrl(label?: string | null): Promise<string | null> {
  if (!label) return null;

  // First try the fuzzy resolver which prefers id.loc.gov authority URIs.
  const candidate = await resolveLcSubjectUrlFuzzy(label);
  if (candidate && /https?:\/\/id\.loc\.gov\/authorities\/subjects\/.+/.test(candidate)) {
    return ensureHtmlSuffix(candidate);
  }

  // If the fuzzy resolver returned something else (or null), try to fetch
  // raw subject hits and pick the first authorities/subjects URI if present.
  try {
    const hits = await fetchLcSubjectHits(label);
    for (const h of hits) {
      if (h && typeof h.uri === 'string' && /id\.loc\.gov\/authorities\/subjects\//.test(h.uri)) {
        return ensureHtmlSuffix(h.uri);
      }
    }
  } catch (err) {
    // ignore — we'll return null below
  }

  // Nothing authoritative found
  return null;
}

/**
 * Debug helper: return detailed information about candidate queries, raw
 * hits, and computed scores so callers can see why a label did or did not
 * resolve to an authority URI. Intended for debugging; not used in prod.
 */
export async function debugResolveLcSubject(label?: string | null) {
  if (!label) return { label: null, candidates: [] };
  const normalized = normalizeCategory(label);
  const candidates = generateCandidateQueries(label, 20);
  const out: any[] = [];

  for (const candidate of candidates) {
    // Build the primary focused id.loc.gov search URL
    const mainQ = encodeURIComponent(candidate.trim());
    const rdftypeSimple = encodeURIComponent('rdftype:SimpleType');
    const rdftypeAuthority = encodeURIComponent('rdftype:Authority');
    const memberOfFilter = encodeURIComponent('memberOf:http://id.loc.gov/authorities/subjects/collection_LCSH_General');
    const csFilter = encodeURIComponent('cs:http://id.loc.gov/authorities/subjects/collection_LCSH_General');
    const primaryUrl = `https://id.loc.gov/search/?q=${mainQ}&q=${rdftypeSimple}&q=${memberOfFilter}&q=${rdftypeAuthority}&q=${csFilter}&format=json`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), LC_FETCH_TIMEOUT_MS);
  let primaryResp: any = null;
  let primaryHits: LcSearchHit[] = [];
  let primaryBody: any = null;
    try {
    const resp = await fetch(primaryUrl, { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Mozilla/5.0; +https://example.com)' } });
      primaryResp = { ok: resp.ok, status: resp.status, statusText: resp.statusText };
      if (resp.ok) {
        const text = await resp.text();
        primaryBody = text;
        // Try structured JSON first
        try {
          const data = JSON.parse(text) as LcSearchResponse;
          primaryHits = data.hits ?? data.results ?? [];
        } catch (e) {
          // ignore parse error
        }

        // If JSON parse gave no hits, try Atom JSON-ML parsing and regex extraction
        if (!primaryHits.length) {
          const atomHits = parseAtomJsonForHits(text);
          if (atomHits.length) {
            primaryHits = atomHits;
          } else {
            const reHits = extractAuthorityUrisFromText(text);
            if (reHits.length) primaryHits = reHits;
          }
        }
      }
    } catch (e) {
      primaryResp = { ok: false, error: String(e) };
    } finally {
      clearTimeout(id);
    }

    // If primary returned no hits, try the simpler memberOf=sh: fallback
    let fallbackResp: any = null;
    let fallbackHits: LcSearchHit[] = [];
    let fallbackBody: any = null;
    if (!primaryHits.length) {
      const fallbackUrl = `https://id.loc.gov/search/?q=${mainQ}&format=json&memberOf=sh%3A`;
      const controller2 = new AbortController();
      const id2 = setTimeout(() => controller2.abort(), LC_FETCH_TIMEOUT_MS);
      try {
  const resp2 = await fetch(fallbackUrl, { signal: controller2.signal, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Mozilla/5.0; +https://example.com)' } });
        fallbackResp = { ok: resp2.ok, status: resp2.status, statusText: resp2.statusText };
        if (resp2.ok) {
          const text2 = await resp2.text();
          fallbackBody = text2;
          try {
            const data2 = JSON.parse(text2) as LcSearchResponse;
            fallbackHits = data2.hits ?? data2.results ?? [];
          } catch (e) {
            // ignore
          }

          if (!fallbackHits.length) {
            const atomHits2 = parseAtomJsonForHits(text2);
            if (atomHits2.length) fallbackHits = atomHits2;
            else {
              const reHits2 = extractAuthorityUrisFromText(text2);
              if (reHits2.length) fallbackHits = reHits2;
            }
          }
        }
      } catch (e) {
        fallbackResp = { ok: false, error: String(e) };
      } finally {
        clearTimeout(id2);
      }
    }

    const usedHits = primaryHits.length ? primaryHits : fallbackHits;
    const scored = (usedHits || []).slice(0, MAX_HITS_TO_CHECK).map(h => {
      const rawUri = h.uri ?? null;
      const normUri = typeof rawUri === 'string' ? ensureHtmlSuffix(rawUri) : null;
      return {
        label: h.label ?? null,
        uri: normUri,
        score: typeof h.label === 'string' ? scoreLabelMatch(candidate.toLowerCase().trim(), h.label) : 0,
      };
    });

    // attach truncated bodies for inspection
    const primaryBodySnippet = primaryBody ? String(primaryBody).slice(0, 15000) : null;
    const fallbackBodySnippet = fallbackBody ? String(fallbackBody).slice(0, 15000) : null;

    out.push({ candidate, primary: primaryResp, primaryBody: primaryBodySnippet, fallback: fallbackResp, fallbackBody: fallbackBodySnippet, hits: scored });
  }

  return { label, normalized, candidates: out };
}

