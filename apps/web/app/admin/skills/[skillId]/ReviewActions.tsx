'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type Props = { skillId: string; status: string };

export function ReviewActions({ skillId, status }: Props) {
  const router = useRouter();
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState<'approve' | 'reject' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const canAct = status === 'AWAITING_REVIEW' || status === 'PUBLISHED' || status === 'REJECTED';

  async function act(action: 'approve' | 'reject') {
    if (action === 'reject' && !note.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/skills/${skillId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string; message?: string };
        throw new Error(d.message ?? d.error ?? 'Action failed');
      }
      router.refresh();
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  if (!canAct) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Admin action</h2>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          Note / Rejection reason
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Optional for approval, required for rejection"
          className="mt-1 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void act('approve')}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading === 'approve' ? 'Approving…' : 'Approve & publish'}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void act('reject')}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </section>
  );
}
