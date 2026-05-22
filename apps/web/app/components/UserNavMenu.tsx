'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserNavMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (status === 'loading') {
    return <div className="h-8 w-24 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800" />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => void signIn('google', { callbackUrl: '/' })}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        Sign in
      </button>
    );
  }

  const displayName = session.user.name ?? session.user.email ?? 'Account';
  const image = session.user.image;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 rounded-md px-1 py-1 text-left text-neutral-700 transition-colors hover:text-neutral-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300/80 dark:text-neutral-200 dark:hover:text-white dark:focus-visible:ring-neutral-600/60"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <UserIcon className="h-5 w-5 shrink-0 text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200" />
        )}
        <span className="hidden max-w-[160px] truncate text-sm font-medium text-neutral-900 sm:inline dark:text-neutral-100">
          {displayName}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
        >
          <Link
            role="menuitem"
            href="/submit"
            className="block px-4 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
            onClick={() => setOpen(false)}
          >
            Submit skill
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: '/' });
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
