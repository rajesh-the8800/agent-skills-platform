import * as React from 'react';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'subtle';
};

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap';
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-neutral-900 text-white',
    subtle: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  };
  return <span className={[base, variants[variant], className].filter(Boolean).join(' ')} {...props} />;
}

