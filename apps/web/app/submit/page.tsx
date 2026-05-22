import { auth } from '@/auth';
import { getSkillSubmitUserId } from '@/lib/skill-submit-user';

import { SubmitSkillForm, type CategoryOption } from './submit-skill-form';

export const metadata = {
  title: 'Submit a skill · SkillHub',
  description: 'Publish a new agent skill package to the marketplace.',
};

export default async function SubmitPage() {
  const session = await auth();
  const userId = getSkillSubmitUserId(session);

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  let categories: CategoryOption[] = [];
  try {
    const res = await fetch(`${apiUrl}/categories`, { next: { revalidate: 120 } });
    if (res.ok) {
      categories = (await res.json()) as CategoryOption[];
    }
  } catch {
    categories = [];
  }

  return (
    <main className="pb-16">
      <SubmitSkillForm userId={userId} categories={categories} />
    </main>
  );
}
