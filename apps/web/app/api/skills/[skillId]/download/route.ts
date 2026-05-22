import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  context: { params: Promise<{ skillId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { skillId } = await context.params;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Use only the platform-injected real IP (not the user-supplied x-forwarded-for header)
  const clientIp = _req.headers.get('x-real-ip') ?? '';

  const res = await fetch(`${apiUrl}/skills/${encodeURIComponent(skillId)}/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
      'x-forwarded-for': clientIp,
    },
    body: JSON.stringify({ userId: session.user.id }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Download failed' }));
    return NextResponse.json(data, { status: res.status });
  }

  const zipBuffer = await res.arrayBuffer();
  const disposition = res.headers.get('Content-Disposition') ?? 'attachment; filename="skill.zip"';

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': disposition,
      'Content-Length': String(zipBuffer.byteLength),
    },
  });
}
