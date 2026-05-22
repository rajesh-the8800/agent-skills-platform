'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  callbackUrl: string;
};

export function LoginModal({ open, onClose, callbackUrl }: LoginModalProps) {
  const [loading, setLoading] = React.useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:border dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-blue-600">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
              ◆
            </span>
            SkillHub
          </div>
          <h2 id="login-modal-title" className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to download and install skills
          </p>
        </div>

        <div className="mt-8">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              void signIn('google', { callbackUrl });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
          We use a secure session cookie after sign-in. By continuing you agree to our terms.
        </p>
      </div>
    </div>
  );
}
