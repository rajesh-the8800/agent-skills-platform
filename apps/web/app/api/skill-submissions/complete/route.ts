import { auth } from '@/auth';
import { getSkillSubmitUserId } from '@/lib/skill-submit-user';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  const allowedUserId = getSkillSubmitUserId(session);

  const body = (await req.json().catch(() => null)) as { userId?: string } | null;
  if (!body || body.userId !== allowedUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const res = await fetch(`${apiUrl}/skill-submissions/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ error: 'Invalid JSON from API' }));
  return NextResponse.json(data, { status: res.status });
}
