import { NextRequest } from 'next/server';
import { adminPost } from '@/lib/admin-proxy';

export async function POST(req: NextRequest, { params }: { params: Promise<{ skillId: string }> }) {
  const { skillId } = await params;
  const body = await req.json().catch(() => ({})) as { note?: string };
  return adminPost(`skills/${skillId}/reject`, { note: body.note });
}
