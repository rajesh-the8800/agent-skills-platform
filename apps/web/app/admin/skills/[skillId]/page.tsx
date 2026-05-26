import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { ReviewActions } from './ReviewActions';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

type SkillDetail = {
  id: string; slug: string; name: string; shortDescription: string; description: string;
  status: string; securityScanned: boolean; rejectionReason: string | null;
  creatorName: string; creatorEmail: string; skillMd: string | null; version: string | null;
  tags: string[]; categories: string[]; supportedAgents: string[];
  createdAt: string; updatedAt: string;
  history: { action: string; note: string | null; reviewerName: string; createdAt: string }[];
};

async function fetchSkill(userId: string, skillId: string): Promise<SkillDetail | null> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/skills/${skillId}?adminUserId=${userId}`,
      { headers: { Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json() as Promise<SkillDetail>;
  } catch { return null; }
}

const STATUS_STYLES: Record<string, string> = {
  AWAITING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

export default async function AdminSkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const skill = await fetchSkill(session.user.id, skillId);
  if (!skill) notFound();

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin / Skills</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{skill.name}</h1>
        </div>
        <Link href="/admin/skills" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          ← Back
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[skill.status] ?? ''}`}>
          {skill.status.replace('_', ' ')}
        </span>
        {skill.securityScanned && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Security scanned
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Metadata</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-neutral-500">Creator</dt><dd className="font-medium">{skill.creatorName} ({skill.creatorEmail})</dd></div>
              <div><dt className="text-neutral-500">Version</dt><dd className="font-mono">{skill.version ?? '—'}</dd></div>
              <div><dt className="text-neutral-500">Slug</dt><dd className="font-mono">{skill.slug}</dd></div>
              <div><dt className="text-neutral-500">Submitted</dt><dd>{new Date(skill.createdAt).toLocaleDateString()}</dd></div>
              <div className="sm:col-span-2"><dt className="text-neutral-500">Categories</dt><dd>{skill.categories.join(', ') || '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-neutral-500">Agents</dt><dd>{skill.supportedAgents.join(', ') || '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-neutral-500">Tags</dt><dd>{skill.tags.join(', ') || '—'}</dd></div>
              {skill.rejectionReason && (
                <div className="sm:col-span-2">
                  <dt className="text-red-500">Rejection reason</dt>
                  <dd className="font-mono text-xs text-red-700 dark:text-red-400">{skill.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{skill.description}</p>
          </section>

          {skill.skillMd && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">SKILL.md</h2>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-4 font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                {skill.skillMd}
              </pre>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <ReviewActions skillId={skill.id} status={skill.status} />

          {skill.history.length > 0 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Review history</h2>
              <ul className="mt-4 space-y-3">
                {skill.history.map((h, i) => (
                  <li key={i} className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${h.action === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {h.action}
                      </span>
                      <span className="text-neutral-400">by {h.reviewerName}</span>
                    </div>
                    {h.note && <div className="text-neutral-600 dark:text-neutral-400">{h.note}</div>}
                    <div className="text-xs text-neutral-400">{new Date(h.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
