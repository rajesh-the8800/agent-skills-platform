import type { SVGProps } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@agent-skills/ui';

import { getRelatedSkills, getSkillDetail } from '../_detail-data';
import { RatingHistogramBars } from '../components/rating-histogram';
import { InstallTabs } from './install-tabs';
import { SkillDownloadButton } from './skill-download-button';
import { WriteReviewButton } from './ReviewForm';
import { ViewTracker } from './ViewTracker';

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 text-white" fill="none" aria-hidden="true">
      <path
        d="M12 3 3 8v8l9 5 9-5V8l-9-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3 8 12 13l9-5M12 13v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={['mt-0.5 h-5 w-5 shrink-0 text-blue-600', className].filter(Boolean).join(' ')}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 5 3.5 9 7 10 3.5-1 7-5 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 3v10m0 0 4-4m-4 4-4-4M5 21h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkillDetail(slug);
  if (!skill) return { title: 'Skill not found' };
  return { title: `${skill.name} · SkillHub`, description: skill.shortDescription };
}

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkillDetail(slug);
  if (!skill) notFound();

  const related = await getRelatedSkills(skill.slug, skill.categories, 3);
  const reviewCount = skill.reviews.length;
  const histogramTotal =
    skill.ratingHistogram[5] +
    skill.ratingHistogram[4] +
    skill.ratingHistogram[3] +
    skill.ratingHistogram[2] +
    skill.ratingHistogram[1];
  const avgFromHistogram =
    histogramTotal > 0
      ? (5 * skill.ratingHistogram[5] +
          4 * skill.ratingHistogram[4] +
          3 * skill.ratingHistogram[3] +
          2 * skill.ratingHistogram[2] +
          skill.ratingHistogram[1]) /
        histogramTotal
      : skill.averageRating;
  const avg =
    reviewCount > 0
      ? skill.reviews.reduce((a, r) => a + r.rating, 0) / reviewCount
      : skill.averageRating;
  const displayAvg = histogramTotal > 0 ? avgFromHistogram : avg;
  const updatedLabel = new Date(skill.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  return (
    <main className="space-y-10 pb-16">
      <ViewTracker skillId={skill.databaseId} />
      {/* Breadcrumbs */}
      <nav className="text-sm text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/skills" className="hover:text-neutral-900 dark:hover:text-white">
              Skills
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span className="hover:text-neutral-900 dark:hover:text-white">{skill.breadcrumbCategory}</span>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-neutral-900 dark:text-neutral-100">{skill.slug}</li>
        </ol>
      </nav>

      {/* Hero + pricing */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm">
              <PackageIcon />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
                {skill.slug}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">by {skill.creatorName}</p>
              <p className="max-w-3xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
                {skill.shortDescription}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{skill.installCount.toLocaleString()} developers installed this skill</span>
                <span className="hidden sm:inline">·</span>
                <span>Updated {updatedLabel}</span>
              </div>
              <ul className="space-y-3 pt-2">
                {skill.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm text-neutral-700 dark:text-neutral-200">
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {skill.supportedAgents.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                  >
                    {a}
                  </span>
                ))}
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  and SKILL.md-compatible agents.
                </span>
              </div>
              <div className="flex flex-wrap gap-4 pt-1 text-xs text-neutral-600 dark:text-neutral-300">
                {skill.securityScanned ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldIcon />
                    Security scanned
                  </span>
                ) : null}
                {skill.instantInstall ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BoltIcon />
                    Instant install
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <Suspense
              fallback={
                <Button
                  disabled
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-medium opacity-60"
                >
                  <DownloadIcon />
                  Download Skill
                </Button>
              }
            >
              <SkillDownloadButton
                skillId={skill.databaseId}
                slug={skill.slug}
                label="Download Skill"
                downloadIcon={<DownloadIcon />}
              />
            </Suspense>
            <a
              href="https://github.com/DigitalExplorers/agent-skills"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-base font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
              </svg>
              View GitHub Repository
            </a>
            <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white">Included in download</div>
              <ul className="mt-3 space-y-2">
                {skill.included.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <CheckIcon className="mt-0 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                {skill.creatorName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-900 dark:text-white">{skill.creatorName}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Creator</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-4 border-y border-neutral-200 py-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
        <span>
          <span className="font-semibold text-neutral-900 dark:text-white">{skill.installCount}</span> installs
        </span>
        <span className="text-neutral-300 dark:text-neutral-600">|</span>
        <span>
          <span className="font-semibold text-neutral-900 dark:text-white">{skill.views.toLocaleString()}</span>{' '}
          views
        </span>
        <span className="text-neutral-300 dark:text-neutral-600">|</span>
        <span>
          <span className="text-yellow-500">★</span>{' '}
          <span className="font-semibold text-neutral-900 dark:text-white">{displayAvg.toFixed(1)}</span> (
          {histogramTotal})
        </span>
        <span className="text-neutral-300 dark:text-neutral-600">|</span>
        <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-900">
          v{skill.version}
        </span>
      </div>

      {/* See it in action */}
      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
          <span className="text-blue-500">✦</span> See it in action
        </h2>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 font-mono text-xs leading-relaxed text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
          {skill.demoMarkdown}
        </pre>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">About this skill</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{skill.fullDescription}</p>
            <Link href="/skills" className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:underline">
              Learn more →
            </Link>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Use cases</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
              {skill.useCases.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Known limitations</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
              {skill.limitations.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">How to install</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Pick your agent runtime and run the command in your terminal.
            </p>
            <div className="mt-4">
              <InstallTabs slug={skill.slug} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Reviews</h2>
            <div className="mt-4 flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex shrink-0 flex-col">
                <div className="text-4xl font-bold text-neutral-900 dark:text-white">
                  {displayAvg.toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {histogramTotal > 0
                    ? `Based on ${histogramTotal.toLocaleString()} rating${histogramTotal === 1 ? '' : 's'}`
                    : reviewCount > 0
                      ? `Based on ${reviewCount} review${reviewCount === 1 ? '' : 's'}`
                      : 'No ratings yet'}
                </div>
              </div>
              <div className="min-w-0 flex-1 lg:px-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Rating breakdown
                </p>
                <RatingHistogramBars counts={skill.ratingHistogram} />
              </div>
              <WriteReviewButton skillId={skill.databaseId} />
            </div>
            <div className="mt-6 space-y-4">
              {skill.reviews.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No reviews yet.</p>
              ) : (
                skill.reviews.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span aria-label={`${r.rating} out of 5 stars`}>
                        <span className="text-yellow-500">{'★'.repeat(r.rating)}</span>
                        <span className="text-neutral-300 dark:text-neutral-600">{'★'.repeat(5 - r.rating)}</span>
                      </span>
                      {r.verified ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                          Verified download
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">{r.author}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{r.date}</div>
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{r.body}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {skill.securityScanned ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                <ShieldIcon />
                Security scanned
              </div>
              <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200/90">
                Package passed automated checks. Always review before use in production.
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Permissions</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{skill.permissionsNote}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {skill.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Compatibility</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {skill.supportedAgents.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs dark:border-neutral-700"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                {skill.creatorName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">{skill.creatorName}</div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{skill.creatorBio}</p>
              </div>
            </div>
            <Button variant="secondary" className="mt-4 w-full rounded-xl" type="button" disabled>
              Ask the creator
            </Button>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Related skills</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/skills/${r.slug}`}
                  className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:border-blue-300 hover:text-blue-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-blue-800 dark:hover:text-blue-300"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
