import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  context: { params: Promise<{ skillId: string }> },
) {
  const { skillId } = await context.params;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  await fetch(`${apiUrl}/skills/${encodeURIComponent(skillId)}/view`, {
    method: 'POST',
  }).catch(() => null);

  return new NextResponse(null, { status: 204 });
}
