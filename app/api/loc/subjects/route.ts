import { NextResponse } from 'next/server';
import { resolveLcSubjectUrl } from '../../../lib/locCategoryMap';

type BatchRequest = { qs?: string[] };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BatchRequest;
    const qs = Array.isArray(body?.qs) ? body.qs.map(s => String(s || '').trim()).filter(Boolean) : [];
    if (!qs.length) {
      return NextResponse.json({ error: 'missing qs array' }, { status: 400 });
    }

    // Resolve all queries in parallel but allow errors per-item.
    const promises = qs.map(async q => {
      try {
        const url = await resolveLcSubjectUrl(q);
        return { q, url };
      } catch (err) {
        console.error('Error resolving LC subject for batch item', q, err);
        return { q, url: null };
      }
    });

    const results = await Promise.all(promises);
    const map: Record<string, string | null> = {};
    for (const r of results) map[r.q] = r.url ?? null;

    return NextResponse.json({ results: map });
  } catch (err) {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  // Support GET?q=one&q=two as a convenience
  const qs = url.searchParams.getAll('q').map(s => s.trim()).filter(Boolean);
  if (!qs.length) {
    return NextResponse.json({ error: 'missing q params' }, { status: 400 });
  }

  try {
    const promises = qs.map(async q => ({ q, url: await resolveLcSubjectUrl(q) }));
    const results = await Promise.all(promises);
    const map: Record<string, string | null> = {};
    for (const r of results) map[r.q] = r.url ?? null;
    return NextResponse.json({ results: map });
  } catch (err) {
    console.error('Batch resolve GET error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
