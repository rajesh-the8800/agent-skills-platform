'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/app/components/LoginModal';

const AGENTS = ['Claude', 'Codex', 'ChatGPT', 'Gemini', 'Cursor', 'Other'] as const;

export type CategoryOption = { id: string; name: string; slug: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
}

type Props = { userId: string | null; categories: CategoryOption[] };

export function SubmitSkillForm({ userId, categories }: Props) {
  const { status } = useSession();
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugManual, setSlugManual] = React.useState(false);
  const [shortDescription, setShortDescription] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tagsRaw, setTagsRaw] = React.useState('');
  const [version, setVersion] = React.useState('1.0.0');
  const [agents, setAgents] = React.useState<Set<string>>(new Set(['Claude']));
  const [categoryIds, setCategoryIds] = React.useState<Set<string>>(new Set());
  const [useCases, setUseCases] = React.useState<string[]>(['']);
  const [limitations, setLimitations] = React.useState<string[]>(['']);
  const [file, setFile] = React.useState<File | null>(null);
  const [drag, setDrag] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadPct, setUploadPct] = React.useState<number | null>(null);
  const [success, setSuccess] = React.useState<{ slug: string; skillId: string } | null>(null);

  React.useEffect(() => {
    if (slugManual) return;
    const next = slugify(name);
    setSlug(next);
  }, [name, slugManual]);

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => setter((prev) => prev.map((v, i) => (i === index ? value : v)));

  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((prev) => [...prev, '']);

  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const toggleAgent = (a: string) => {
    setAgents((prev) => {
      const n = new Set(prev);
      if (n.has(a)) n.delete(a);
      else n.add(a);
      return n;
    });
  };

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const onPickFile = (f: File | null) => {
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const okType =
      f.name.toLowerCase().endsWith('.zip') ||
      f.type === 'application/zip' ||
      f.type === 'application/x-zip-compressed' ||
      f.type === 'application/octet-stream';
    if (!okType) {
      setError('Please upload a .zip file (skill package).');
      setFile(null);
      return;
    }
    if (f.size > 52_428_800) {
      setError('Maximum package size is 50 MB.');
      setFile(null);
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'unauthenticated' || !userId) {
      setLoginOpen(true);
      return;
    }
    setError(null);
    setSuccess(null);

    if (!file) {
      setError('Choose a skill package (.zip) to upload.');
      return;
    }
    if (agents.size === 0) {
      setError('Select at least one supported agent.');
      return;
    }
    const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2;
    if (!slugOk) {
      setError('URL slug must be lowercase with hyphens only (e.g. my-skill-name).');
      return;
    }

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);

    const form = new FormData();
    form.append('file', file);
    form.append('userId', userId);
    form.append('slug', slug);
    form.append('name', name.trim());
    form.append('shortDescription', shortDescription.trim());
    form.append('description', description.trim());
    form.append('tags', JSON.stringify(tags));
    form.append('supportedAgents', JSON.stringify(Array.from(agents)));
    form.append('categoryIds', JSON.stringify(Array.from(categoryIds)));
    form.append('version', version.trim());
    form.append('useCases', JSON.stringify(useCases.map((s) => s.trim()).filter(Boolean)));
    form.append('limitations', JSON.stringify(limitations.map((s) => s.trim()).filter(Boolean)));

    setLoading(true);
    setUploadPct(null);

    try {
      const result = await new Promise<{ slug: string; skillId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/skill-submissions/upload');
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          const json = JSON.parse(xhr.responseText) as {
            slug?: string;
            skillId?: string;
            message?: string | string[];
            error?: string;
          };
          if (xhr.status >= 200 && xhr.status < 300) {
            if (!json.slug || !json.skillId) {
              reject(new Error('Invalid response after publish'));
            } else {
              resolve({ slug: json.slug, skillId: json.skillId });
            }
          } else {
            const msg = Array.isArray(json.message)
              ? json.message.join(', ')
              : json.message ?? json.error ?? 'Publish failed';
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(form);
      });

      setSuccess(result);
      setFile(null);
      setUploadPct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-blue-200 bg-blue-50/80 p-8 text-center dark:border-blue-900/60 dark:bg-blue-950/30">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">
          Skill submitted for review
        </h2>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{success.slug}</span> has been
          received and is pending admin approval. You'll be able to view it in the marketplace once it's approved.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Awaiting review
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/skills"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Browse marketplace
          </Link>
          <button
            type="button"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => {
              setSuccess(null);
              setName('');
              setShortDescription('');
              setDescription('');
              setTagsRaw('');
              setVersion('1.0.0');
              setAgents(new Set(['Claude']));
              setCategoryIds(new Set());
              setSlugManual(false);
              setUseCases(['']);
              setLimitations(['']);
            }}
          >
            Submit another skill
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Publish</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">Submit a skill</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Package your agent skill as a ZIP, add metadata, and ship it to the marketplace.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Skill name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="e.g. API design reviewer"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">URL slug</label>
            <div className="mt-1 flex rounded-xl border border-neutral-200 bg-neutral-50 text-sm dark:border-neutral-700 dark:bg-neutral-900/80">
              <span className="flex shrink-0 items-center border-r border-neutral-200 px-3 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                /skills/
              </span>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-neutral-900 outline-none ring-blue-500/30 focus:ring-2 dark:text-neutral-100"
                placeholder="my-skill-name"
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">Autogenerated from the name; edit if you need a specific URL.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Short description</label>
            <input
              required
              minLength={8}
              maxLength={220}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="One line for cards and search results"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Full description</label>
            <textarea
              required
              minLength={20}
              maxLength={20000}
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="What it does, prerequisites, and how buyers should use it."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Use cases</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          List the primary workflows or scenarios this skill is designed for.
        </p>
        <div className="mt-4 space-y-2">
          {useCases.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item}
                onChange={(e) => updateListItem(setUseCases, i, e.target.value)}
                maxLength={300}
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                placeholder={`Use case ${i + 1}`}
              />
              {useCases.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem(setUseCases, i)}
                  className="shrink-0 text-neutral-400 hover:text-red-500"
                  aria-label="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {useCases.length < 20 && (
            <button
              type="button"
              onClick={() => addListItem(setUseCases)}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline"
            >
              + Add use case
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Known limitations</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Be upfront about what this skill cannot do or where it may fall short.
        </p>
        <div className="mt-4 space-y-2">
          {limitations.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={item}
                onChange={(e) => updateListItem(setLimitations, i, e.target.value)}
                maxLength={300}
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                placeholder={`Limitation ${i + 1}`}
              />
              {limitations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem(setLimitations, i)}
                  className="shrink-0 text-neutral-400 hover:text-red-500"
                  aria-label="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {limitations.length < 20 && (
            <button
              type="button"
              onClick={() => addListItem(setLimitations)}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline"
            >
              + Add limitation
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Discovery</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Tags (comma-separated)</label>
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="typescript, security, docs"
            />
          </div>
          {categories.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((c) => {
                  const on = categoryIds.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Supported agents</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGENTS.map((a) => {
                const on = agents.has(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAgent(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      on
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Package version</label>
            <input
              required
              pattern="\d+\.\d+\.\d+"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mt-1 w-40 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 font-mono text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Package</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Upload a ZIP (max 50 MB). After publish, downloads use the same secure flow as other skills.
        </p>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('skill-zip-input')?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) onPickFile(f);
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
            drag
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900/40'
          }`}
          onClick={() => document.getElementById('skill-zip-input')?.click()}
        >
          <input
            id="skill-zip-input"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Drop your skill ZIP here</p>
              <p className="mt-1 text-xs text-neutral-500">or click to browse</p>
            </>
          )}
        </div>
        {uploadPct !== null && loading ? (
          <p className="mt-2 text-xs text-neutral-500">Uploading… {uploadPct}%</p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link href="/skills" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          ← Browse skills
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Publishing…' : 'Publish skill'}
        </button>
      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        callbackUrl="/submit"
      />
    </form>
  );
}
