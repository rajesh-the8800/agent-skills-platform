'use client';

import * as React from 'react';
import { Button } from '@agent-skills/ui';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  return (
    <Button
      variant="secondary"
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        window.localStorage.setItem('theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
      }}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  );
}

