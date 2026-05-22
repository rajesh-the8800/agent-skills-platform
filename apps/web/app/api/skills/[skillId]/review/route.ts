import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  context: { params: Promise<{ skillId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to write a review' }, { status: 401 });
  }

  const { skillId } = await context.params;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const res = await fetch(`${apiUrl}/skills/${encodeURIComponent(skillId)}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ ...body, userId: session.user.id }),
  });

  const data = await res.json().catch(() => ({ error: 'Unexpected response' }));
  return NextResponse.json(data, { status: res.status });
}
