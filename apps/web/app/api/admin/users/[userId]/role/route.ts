import { NextRequest } from 'next/server';
import { adminPatch } from '@/lib/admin-proxy';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const body = await req.json().catch(() => ({})) as { role?: string };
  return adminPatch(`users/${userId}/role`, { role: body.role });
}
