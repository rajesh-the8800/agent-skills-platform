import { NextRequest } from 'next/server';
import { adminGet } from '@/lib/admin-proxy';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return adminGet('users', {
    page: sp.get('page') ?? '1',
    limit: sp.get('limit') ?? '20',
  });
}
