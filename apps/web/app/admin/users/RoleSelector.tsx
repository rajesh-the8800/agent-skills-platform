'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type Props = { userId: string; currentRole: string };

const ROLES = ['USER', 'ADMIN'];

export function RoleSelector({ userId, currentRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onChange(role: string) {
    if (role === currentRole) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      disabled={loading}
      defaultValue={currentRole}
      onChange={(e) => void onChange(e.target.value)}
      className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-medium text-neutral-800 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
