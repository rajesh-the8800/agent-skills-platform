import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { getSkillSubmitUserId } from '@/lib/skill-submit-user';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ skillId: string }> }) {
  const session = await auth();
  const userId = getSkillSubmitUserId(session);
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const { skillId: slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const res = await fetch(`${apiUrl}/skills/${slug}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ ...body, userId }),
  });

  const data = await res.json().catch(() => ({ error: 'Invalid JSON from API' }));
  if (res.ok) revalidatePath(`/skills/${slug}`);
  return NextResponse.json(data, { status: res.status });
}
