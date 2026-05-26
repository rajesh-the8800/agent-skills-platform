import { NextRequest } from 'next/server';
import { adminGet } from '@/lib/admin-proxy';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return adminGet('skills', {
    status: sp.get('status') ?? 'AWAITING_REVIEW',
    page: sp.get('page') ?? '1',
    limit: sp.get('limit') ?? '20',
  });
}
