import { adminGet } from '@/lib/admin-proxy';

export async function GET() {
  return adminGet('stats', {});
}
