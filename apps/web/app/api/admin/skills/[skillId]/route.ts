import { NextRequest } from 'next/server';
import { adminGet } from '@/lib/admin-proxy';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ skillId: string }> }) {
  const { skillId } = await params;
  return adminGet(`skills/${skillId}`, {});
}
