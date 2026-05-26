import Link from 'next/link';
import { auth } from '@/auth';
import { RoleSelector } from './RoleSelector';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

type UserItem = {
  id: string; name: string | null; email: string; role: string;
  createdAt: string; _count: { skills: number };
};

async function fetchUsers(userId: string, page: number) {
  try {
    const sp = new URLSearchParams({ adminUserId: userId, page: String(page), limit: '20' });
    const res = await fetch(`${API_BASE}/admin/users?${sp}`, {
      headers: { Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` },
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], total: 0 };
    return res.json() as Promise<{ items: UserItem[]; total: number; page: number; limit: number }>;
  } catch { return { items: [], total: 0 }; }
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300',
  MODERATOR: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
  USER: 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const sp = (await searchParams) ?? {};
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const data = session?.user?.id ? await fetchUsers(session.user.id, page) : { items: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(data.total / 20));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Users</h1>
        </div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          ← Dashboard
        </Link>
      </div>

      <div className="text-sm text-neutral-600 dark:text-neutral-400">{data.total} user{data.total !== 1 ? 's' : ''}</div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 dark:border-neutral-800">
            <tr className="text-left text-xs font-semibold text-neutral-500">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Skills</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.items.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <td className="px-5 py-3">
                  <div className="font-medium text-neutral-900 dark:text-white">{u.name ?? '—'}</div>
                  <div className="text-xs text-neutral-500">{u.email}</div>
                </td>
                <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">{u._count.skills}</td>
                <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  {u.id === session?.user?.id ? (
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role] ?? ''}`}>
                      {u.role} (you)
                    </span>
                  ) : (
                    <RoleSelector userId={u.id} currentRole={u.role} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/admin/users?page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
          >
            <span className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">Previous</span>
          </Link>
          <span className="text-xs text-neutral-500">Page {page} of {totalPages}</span>
          <Link
            href={`/admin/users?page=${Math.min(totalPages, page + 1)}`}
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
