import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-black text-white hover:bg-neutral-800 focus-visible:ring-black',
    secondary:
      'bg-white text-black border border-neutral-200 hover:bg-neutral-50 focus-visible:ring-neutral-300',
  };

  return (
    <button
      className={[base, variants[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

