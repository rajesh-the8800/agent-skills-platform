import type { Session } from 'next-auth';

export function getSkillSubmitUserId(session: Session | null): string | null {
  return session?.user?.id?.trim() ?? null;
}
