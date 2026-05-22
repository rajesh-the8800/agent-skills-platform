import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={[
        'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm',
        'placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-300',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

