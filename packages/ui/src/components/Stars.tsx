import * as React from 'react';

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={filled ? 'h-4 w-4 fill-yellow-400' : 'h-4 w-4 fill-neutral-200'}
    >
      <path d="M10 15.27l-5.18 2.73 1-5.82-4.23-4.12 5.84-.85L10 .9l2.57 5.31 5.84.85-4.23 4.12 1 5.82z" />
    </svg>
  );
}

export function Stars({ value, max = 5, className }: { value: number; max?: number; className?: string }) {
  const v = Math.max(0, Math.min(max, value));
  const rounded = Math.round(v * 10) / 10;
  return (
    <div className={['inline-flex items-center gap-1', className].filter(Boolean).join(' ')}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <StarIcon key={i} filled={i + 1 <= Math.round(rounded)} />
        ))}
      </div>
      <span className="text-xs text-neutral-600">{rounded.toFixed(1)}</span>
    </div>
  );
}

