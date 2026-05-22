import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getSkillSubmitUserId } from '@/lib/skill-submit-user';
import { getSkillDetail } from '../../_detail-data';
import type { CategoryOption } from '@/app/submit/submit-skill-form';
import { EditSkillForm } from './edit-skill-form';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Edit skill · ${slug} · SkillHub` };
}

export default async function EditSkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [session, skill] = await Promise.all([auth(), getSkillDetail(slug)]);

  if (!skill) redirect('/skills');

  const userId = getSkillSubmitUserId(session);
  if (!userId || userId !== skill.creatorId) redirect(`/skills/${slug}`);

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  let categories: CategoryOption[] = [];
  try {
    const res = await fetch(`${apiUrl}/categories`, { next: { revalidate: 120 } });
    if (res.ok) categories = (await res.json()) as CategoryOption[];
  } catch {
    categories = [];
  }

  return (
    <main className="pb-16">
      <EditSkillForm skill={skill} userId={userId} categories={categories} />
    </main>
  );
}
