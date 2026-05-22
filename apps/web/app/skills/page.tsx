import { Fragment } from 'react';

import { Button } from '@agent-skills/ui';
import Link from 'next/link';

import { fetchCategories, fetchSkills } from '@/lib/api';
import { HeroSection } from './components/HeroSection';

function getNumberParam(v: string | string[] | undefined, fallback: number) {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function buildSkillsQuery(opts: {
  q?: string;
  category: string;
  sort: string;
  page?: number;
}): Record<string, string> {
  const out: Record<string, string> = {};
  if (opts.q) out.q = opts.q;
  out.category = opts.category;
  out.sort = opts.sort;
  if (opts.page && opts.page > 1) out.page = String(opts.page);
  return out;
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === 'string' ? sp.q : '';
  const category = typeof sp.category === 'string' ? sp.category : 'All';
  const sort = typeof sp.sort === 'string' ? sp.sort : 'popular';
  const page = Math.max(1, getNumberParam(sp.page, 1));
  const limit = 9;

  const [data, apiCategories] = await Promise.all([
    fetchSkills({ q, category, sort, page, limit }),
    fetchCategories(),
  ]);

  const { items, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);

  const categories = ['All', ...apiCategories.map((c) => c.name)];

  const downloads = items.reduce((acc, s) => acc + s.installCount, 0);
  const avgRating =
    items.length > 0
      ? items.reduce((acc, s) => acc + s.averageRating, 0) / items.length
      : 0;

  return (
    <main className="space-y-10">
      <HeroSection
        q={q}
        category={category}
        sort={sort}
        stats={{ skills: total, downloads, avgRating }}
      />

      <section className="space-y-4">
          {/* Category pill bar */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === category;
              return (
                <Link
                  key={c}
                  href={{ pathname: '/skills', query: buildSkillsQuery({ q, category: c, sort }) }}
                  className={[
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-blue-300 hover:text-blue-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-blue-700 dark:hover:text-blue-300',
                  ].join(' ')}
                >
                  {c}
                </Link>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Showing <span className="font-medium text-neutral-900 dark:text-white">{total}</span> skills
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-300">Sort by:</div>
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950">
                {(['popular', 'rating', 'new'] as const).map((s, i, arr) => (
                  <Fragment key={s}>
                    <Link
                      className={sort === s ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-300'}
                      href={{ pathname: '/skills', query: buildSkillsQuery({ q, category, sort: s }) }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Link>
                    {i < arr.length - 1 ? (
                      <span className="text-neutral-300 dark:text-neutral-700">·</span>
                    ) : null}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
              No skills found. Try a different search or category.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">{s.name}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">by {s.creatorName}</div>
                    </div>
                    {s.securityScanned ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
                          <path d="M8 1.5 2.5 4v5c0 3.5 2.5 5.5 5.5 6 3-0.5 5.5-2.5 5.5-6V4L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                          <path d="m5.5 8 1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{s.shortDescription}</div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {s.averageRating > 0 ? s.averageRating.toFixed(1) : '—'}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <span className="text-neutral-400">↓</span>
                        <span>{s.installCount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Link href={`/skills/${s.slug}`}>
                      <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link
              href={{
                pathname: '/skills',
                query: buildSkillsQuery({ q, category, sort, page: Math.max(1, safePage - 1) }),
              }}
              aria-disabled={safePage <= 1}
              className={safePage <= 1 ? 'pointer-events-none opacity-50' : ''}
            >
              <Button variant="secondary">Previous</Button>
            </Link>
            <div className="text-xs text-neutral-600 dark:text-neutral-300">
              Page <span className="font-medium text-neutral-900 dark:text-white">{safePage}</span> of{' '}
              <span className="font-medium text-neutral-900 dark:text-white">{totalPages}</span>
            </div>
            <Link
              href={{
                pathname: '/skills',
                query: buildSkillsQuery({ q, category, sort, page: Math.min(totalPages, safePage + 1) }),
              }}
              aria-disabled={safePage >= totalPages}
              className={safePage >= totalPages ? 'pointer-events-none opacity-50' : ''}
            >
              <Button variant="secondary">Next</Button>
            </Link>
          </div>
      </section>
    </main>
  );
}
