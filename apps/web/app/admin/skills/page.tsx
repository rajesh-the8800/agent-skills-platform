import Link from 'next/link';
import { auth } from '@/auth';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

type SkillItem = {
  id: string; slug: string; name: string; shortDescription: string;
  status: string; securityScanned: boolean; createdAt: string;
  creatorName: string; tags: string[]; categories: string[];
};

async function fetchQueue(userId: string, status: string, page: number) {
  try {
    const sp = new URLSearchParams({ adminUserId: userId, status, page: String(page), limit: '20' });
    const res = await fetch(`${API_BASE}/admin/skills?${sp}`, {
      headers: { Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` },
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], total: 0 };
    return res.json() as Promise<{ items: SkillItem[]; total: number; page: number; limit: number }>;
  } catch { return { items: [], total: 0 }; }
}

const STATUS_LABELS: Record<string, string> = {
  AWAITING_REVIEW: 'Awaiting Review',
  PENDING: 'Scanning',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};

const STATUS_STYLES: Record<string, string> = {
  AWAITING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  PENDING: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  REJECTED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
};

export default async function AdminSkillsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const sp = (await searchParams) ?? {};
  const status = sp.status ?? 'AWAITING_REVIEW';
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const data = session?.user?.id ? await fetchQueue(session.user.id, status, page) : { items: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(data.total / 20));

  const tabs = ['AWAITING_REVIEW', 'PENDING', 'PUBLISHED', 'REJECTED'];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Skills</h1>
        </div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          ← Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/skills?status=${t}`}
            className={[
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              status === t
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200',
            ].join(' ')}
          >
            {STATUS_LABELS[t]}
          </Link>
        ))}
      </div>

      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        {data.total} skill{data.total !== 1 ? 's' : ''}
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
          No skills in this state.
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">{s.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] ?? ''}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </div>
                <div className="text-sm text-neutral-500">by {s.creatorName}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-300">{s.shortDescription}</div>
              </div>
              <Link
                href={`/admin/skills/${s.id}`}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/admin/skills?status=${status}&page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
          >
            <span className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">Previous</span>
          </Link>
          <span className="text-xs text-neutral-500">Page {page} of {totalPages}</span>
          <Link
            href={`/admin/skills?status=${status}&page=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
          >
            <span className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">Next</span>
          </Link>
        </div>
      )}
    </main>
  );
}
