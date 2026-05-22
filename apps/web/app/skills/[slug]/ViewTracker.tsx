'use client';

import { useEffect } from 'react';

export function ViewTracker({ skillId }: { skillId: string }) {
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/api/skills/${encodeURIComponent(skillId)}/view`, {
        method: 'POST',
        signal: controller.signal,
      }).catch(() => null);
    }, 50);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [skillId]);

  return null;
}
