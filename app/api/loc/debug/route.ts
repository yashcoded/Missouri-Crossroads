import { NextResponse } from 'next/server';
import { debugResolveLcSubject } from '../../../lib/locCategoryMap';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 });

  try {
    const debug = await debugResolveLcSubject(q);
    return NextResponse.json(debug);
  } catch (err) {
    console.error('debugResolve error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
