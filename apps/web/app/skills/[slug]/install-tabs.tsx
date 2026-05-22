'use client';

import * as React from 'react';

type TabId = 'claude' | 'openclaw' | 'codex';

const TABS: { id: TabId; label: string; command: (slug: string) => string }[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    command: (slug) => `unzip ${slug}.zip -d ~/.claude/skills/`,
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    command: (slug) => `unzip ${slug}.zip -d ~/.openclaw/skills/`,
  },
  {
    id: 'codex',
    label: 'Codex CLI',
    command: (slug) => `unzip ${slug}.zip -d ~/.codex/skills/`,
  },
];

export function InstallTabs({ slug }: { slug: string }) {
  const [tab, setTab] = React.useState<TabId>('claude');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              tab === t.id
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <pre className="overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-950 p-4 text-xs text-neutral-100 dark:border-neutral-800">
        {TABS.find((t) => t.id === tab)!.command(slug)}
      </pre>
    </div>
  );
}
