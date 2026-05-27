'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/app/components/LoginModal';
import type { SkillDetail } from '../../_detail-data';
import type { CategoryOption } from '@/app/submit/submit-skill-form';

const AGENTS = ['Claude', 'Codex', 'ChatGPT', 'Gemini', 'Cursor', 'Other'] as const;

type Props = { skill: SkillDetail; userId: string | null; categories: CategoryOption[] };

export function EditSkillForm({ skill, userId, categories }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [loginOpen, setLoginOpen] = React.useState(false);

  const [name, setName] = React.useState(skill.name);
  const [shortDescription, setShortDescription] = React.useState(skill.shortDescription);
  const [description, setDescription] = React.useState(skill.fullDescription);
  const [tagsRaw, setTagsRaw] = React.useState(skill.tags.join(', '));
  const [agents, setAgents] = React.useState<Set<string>>(new Set(skill.supportedAgents));
  const [categoryIds, setCategoryIds] = React.useState<Set<string>>(
    new Set(
      categories
        .filter((c) => skill.categories.includes(c.name))
        .map((c) => c.id),
    ),
  );
  const [useCases, setUseCases] = React.useState<string[]>(
    skill.useCases.length > 0 ? skill.useCases : [''],
  );
  const [limitations, setLimitations] = React.useState<string[]>(
    skill.limitations.length > 0 ? skill.limitations : [''],
  );
  const [repoUrl, setRepoUrl] = React.useState(skill.repoUrl ?? '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => setter((prev) => prev.map((v, i) => (i === index ? value : v)));

  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((prev) => [...prev, '']);

  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const toggleAgent = (a: string) =>
    setAgents((prev) => { const n = new Set(prev); n.has(a) ? n.delete(a) : n.add(a); return n; });

  const toggleCategory = (id: string) =>
    setCategoryIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'unauthenticated' || !userId) { setLoginOpen(true); return; }
    if (agents.size === 0) { setError('Select at least one supported agent.'); return; }

    setError(null);
    setSaved(false);
    setLoading(true);

    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20);

    try {
      const res = await fetch(`/api/skills/${skill.slug}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          shortDescription: shortDescription.trim(),
          description: description.trim(),
          tags,
          supportedAgents: Array.from(agents),
          categoryIds: Array.from(categoryIds),
          useCases: useCases.map((s) => s.trim()).filter(Boolean),
          limitations: limitations.map((s) => s.trim()).filter(Boolean),
          repoUrl: repoUrl.trim() || null,
        }),
      });

      const data = await res.json() as { error?: string; message?: string | string[] };
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? data.error ?? 'Save failed';
        setError(msg);
        return;
      }

      setSaved(true);
      router.refresh();
      router.push(`/skills/${skill.slug}`);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Edit</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">Edit skill</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Update metadata for <span className="font-medium text-neutral-900 dark:text-white">{skill.name}</span>.
          To ship a new package version, use the Submit page.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
      {saved && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          Changes saved.
        </div>
      )}

      {/* Basics */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Skill name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Short description</label>
            <input required minLength={8} maxLength={220} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Full description</label>
            <textarea required minLength={20} maxLength={20000} rows={6} value={description} onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              GitHub repository <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="https://github.com/you/your-skill"
            />
            <p className="mt-1 text-xs text-neutral-500">Share your source so users can inspect or contribute.</p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Use cases</h2>
        <div className="mt-4 space-y-2">
          {useCases.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={item} onChange={(e) => updateListItem(setUseCases, i, e.target.value)} maxLength={300}
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                placeholder={`Use case ${i + 1}`} />
              {useCases.length > 1 && (
                <button type="button" onClick={() => removeListItem(setUseCases, i)}
                  className="shrink-0 text-neutral-400 hover:text-red-500" aria-label="Remove">✕</button>
              )}
            </div>
          ))}
          {useCases.length < 20 && (
            <button type="button" onClick={() => addListItem(setUseCases)}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline">+ Add use case</button>
          )}
        </div>
      </section>

      {/* Known limitations */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Known limitations</h2>
        <div className="mt-4 space-y-2">
          {limitations.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={item} onChange={(e) => updateListItem(setLimitations, i, e.target.value)} maxLength={300}
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                placeholder={`Limitation ${i + 1}`} />
              {limitations.length > 1 && (
                <button type="button" onClick={() => removeListItem(setLimitations, i)}
                  className="shrink-0 text-neutral-400 hover:text-red-500" aria-label="Remove">✕</button>
              )}
            </div>
          ))}
          {limitations.length < 20 && (
            <button type="button" onClick={() => addListItem(setLimitations)}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline">+ Add limitation</button>
          )}
        </div>
      </section>

      {/* Discovery */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Discovery</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Tags (comma-separated)</label>
            <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500/30 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="typescript, security, docs" />
          </div>
          {categories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((c) => {
                  const on = categoryIds.has(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'}`}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Supported agents</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGENTS.map((a) => {
                const on = agents.has(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAgent(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'}`}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link href={`/skills/${skill.slug}`} className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          ← Back to skill
        </Link>
        <button type="submit" disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} callbackUrl={`/skills/${skill.slug}/edit`} />
    </form>
  );
}
