import { auth } from '@/auth';
import { getSkillSubmitUserId } from '@/lib/skill-submit-user';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  const allowedUserId = getSkillSubmitUserId(session);

  if (!allowedUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  // Enforce the userId to be the authenticated user's id
  formData.set('userId', allowedUserId);

  const res = await fetch(`${apiUrl}/skill-submissions/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
    body: formData,
  });

  const data = await res.json().catch(() => ({ error: 'Invalid JSON from API' }));
  return NextResponse.json(data, { status: res.status });
}
