import { NextResponse } from 'next/server';
import { resolveLcSubjectUrl } from '../../../lib/locCategoryMap';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json({ error: 'missing query parameter `q`' }, { status: 400 });
  }

  try {
    const resolved = await resolveLcSubjectUrl(q);
    return NextResponse.json({ query: q, url: resolved ?? null });
  } catch (err) {
    console.error('Error resolving LC subject url for', q, err);
    return NextResponse.json({ query: q, url: null, error: 'internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const q = (body?.q || '').trim();
    if (!q) return NextResponse.json({ error: 'missing body.q' }, { status: 400 });
    const resolved = await resolveLcSubjectUrl(q);
    return NextResponse.json({ query: q, url: resolved ?? null });
  } catch (err) {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
}
