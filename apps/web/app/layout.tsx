import './globals.css';

import type { Metadata } from 'next';
import { APP_NAME } from '@agent-skills/config';
import Link from 'next/link';

import { UserNavMenu } from './components/UserNavMenu';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'AI Skills Marketplace Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <Providers>
        <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
              <Link href="/skills" className="shrink-0 text-xl font-semibold tracking-tight text-blue-600">
                SkillHub
              </Link>
              <nav className="hidden min-w-0 items-center gap-6 text-sm text-neutral-600 md:flex dark:text-neutral-300">
                <Link href="/skills" className="hover:text-neutral-900 dark:hover:text-white">
                  Browse
                </Link>
                <Link href="/submit" className="hover:text-neutral-900 dark:hover:text-white">
                  Submit
                </Link>
              </nav>
            </div>
            <UserNavMenu />
          </div>
        </header>

        <div className="mx-auto max-w-screen-xl px-2 py-8">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
