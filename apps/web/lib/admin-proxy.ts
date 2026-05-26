import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

function getSecret() {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) throw new Error('INTERNAL_API_SECRET not set');
  return secret;
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== 'ADMIN') return null;
  return session;
}

export async function adminGet(path: string, params: Record<string, string>) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sp = new URLSearchParams({ adminUserId: session.user.id, ...params });
  const res = await fetch(`${API_BASE}/admin/${path}?${sp}`, {
    headers: { Authorization: `Bearer ${getSecret()}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({ error: 'Invalid response' }));
  return NextResponse.json(data, { status: res.status });
}

export async function adminPost(path: string, body: Record<string, unknown>) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const res = await fetch(`${API_BASE}/admin/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getSecret()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId: session.user.id, ...body }),
  });
  const data = await res.json().catch(() => ({ error: 'Invalid response' }));
  return NextResponse.json(data, { status: res.status });
}

export async function adminPatch(path: string, body: Record<string, unknown>) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const res = await fetch(`${API_BASE}/admin/${path}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getSecret()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId: session.user.id, ...body }),
  });
  const data = await res.json().catch(() => ({ error: 'Invalid response' }));
  return NextResponse.json(data, { status: res.status });
}
