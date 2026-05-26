import Link from 'next/link';
import { auth } from '@/auth';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

async function fetchStats(userId: string) {
  try {
    const res = await fetch(
      `${API_BASE}/admin/stats?adminUserId=${userId}`,
      { headers: { Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json() as Promise<{
      pending: number; awaitingReview: number; published: number;
      rejected: number; totalUsers: number; totalSkills: number;
    }>;
  } catch { return null; }
}

export default async function AdminDashboard() {
  const session = await auth();
  const stats = session?.user?.id ? await fetchStats(session.user.id) : null;

  const cards = [
    { label: 'Awaiting Review', value: stats?.awaitingReview ?? '—', href: '/admin/skills?status=AWAITING_REVIEW', accent: 'text-amber-600' },
    { label: 'Scanning (Pending)', value: stats?.pending ?? '—', href: '/admin/skills?status=PENDING', accent: 'text-blue-600' },
    { label: 'Published', value: stats?.published ?? '—', href: '/admin/skills?status=PUBLISHED', accent: 'text-emerald-600' },
    { label: 'Rejected', value: stats?.rejected ?? '—', href: '/admin/skills?status=REJECTED', accent: 'text-red-600' },
    { label: 'Total Skills', value: stats?.totalSkills ?? '—', href: '/admin/skills', accent: 'text-neutral-900 dark:text-white' },
    { label: 'Total Users', value: stats?.totalUsers ?? '—', href: '/admin/users', accent: 'text-neutral-900 dark:text-white' },
  ];

  return (
    <main className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-colors hover:border-blue-300 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className={`text-3xl font-bold ${c.accent}`}>{c.value}</div>
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/skills?status=AWAITING_REVIEW"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Review queue
        </Link>
        <Link
          href="/admin/users"
          className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          Manage users
        </Link>
      </div>
    </main>
  );
}
