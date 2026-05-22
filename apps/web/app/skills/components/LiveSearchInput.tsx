'use client';

import { Input } from '@agent-skills/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function LiveSearchInput({
  initialQuery,
  category,
  sort,
}: {
  initialQuery: string;
  category: string;
  sort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const q = value.trim();
      if (q) params.set('q', q);
      params.set('category', category);
      params.set('sort', sort);
      router.replace(`${pathname}?${params.toString()}`);
    }, 250);

    return () => clearTimeout(timer);
  }, [value, category, sort, pathname, router]);

  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.3 4.1 4.1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search skills..."
        className="h-12 rounded-2xl pl-11 pr-4 text-base"
      />
    </div>
  );
}
