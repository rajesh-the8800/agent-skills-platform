'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Button } from '@agent-skills/ui';

import { LoginModal } from '@/app/components/LoginModal';

type Props = {
  skillId: string;
  slug: string;
  label: string;
  downloadIcon: React.ReactNode;
};

export function SkillDownloadButton({
  skillId,
  slug,
  label,
  downloadIcon,
}: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const autoStarted = React.useRef(false);

  const callbackUrl = `/skills/${slug}?download=1`;

  const runDownload = React.useCallback(async () => {
    if (!skillId) {
      setError('This skill is not available for download yet. Run database seed.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skillId)}/download`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
        setError(data.message ?? data.error ?? `Download failed (${res.status})`);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = /filename="?([^";\n]+)"?/.exec(disposition);
      const filename = match?.[1] ?? `${slug}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
      router.replace(`/skills/${slug}`);
    }
  }, [skillId, slug, router]);

  React.useEffect(() => {
    if (status !== 'authenticated' || searchParams.get('download') !== '1') return;
    if (autoStarted.current) return;
    autoStarted.current = true;
    void runDownload();
  }, [status, searchParams, runDownload]);

  const onClick = () => {
    if (!skillId) {
      setError('This skill is not available for download yet.');
      return;
    }
    if (status === 'unauthenticated') {
      setLoginOpen(true);
      return;
    }
    if (status === 'authenticated') {
      void runDownload();
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Button
          type="button"
          disabled={busy || status === 'loading' || !skillId}
          onClick={onClick}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-medium hover:bg-blue-700 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          {downloadIcon}
          {busy ? 'Preparing download…' : label}
        </Button>
        {error ? <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        {!skillId ? (
          <p className="text-center text-xs text-neutral-500">Seed the database to enable downloads.</p>
        ) : null}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} callbackUrl={callbackUrl} />
    </>
  );
}
