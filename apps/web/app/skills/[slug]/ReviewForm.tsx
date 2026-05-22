'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Button } from '@agent-skills/ui';
import { LoginModal } from '@/app/components/LoginModal';

type Props = { skillId: string };

export function WriteReviewButton({ skillId }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);

  const handleClick = () => {
    if (status === 'unauthenticated') {
      setLoginOpen(true);
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        className="shrink-0 self-start rounded-xl"
        onClick={handleClick}
        type="button"
        disabled={status === 'loading'}
      >
        Write a review
      </Button>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        callbackUrl={pathname ?? '/'}
      />

      {open ? <ReviewModal skillId={skillId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="text-2xl leading-none transition-colors"
          style={{ color: star <= (hover || value) ? '#eab308' : '#d1d5db' }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const router = useRouter();
  const [stars, setStars] = React.useState(0);
  const [body, setBody] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) { setError('Please select a star rating.'); return; }
    if (body.trim().length < 10) { setError('Review must be at least 10 characters.'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skillId)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars, body: body.trim() }),
      });
      const data = await res.json() as { error?: string; message?: string | string[] };
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? data.error ?? 'Failed to submit review');
        setError(msg);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Write a review</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Share your experience with this skill.</p>

        <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Rating</label>
            <div className="mt-1">
              <StarPicker value={stars} onChange={setStars} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Review</label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you think? How did you use it?"
              className="mt-1 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit review'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
