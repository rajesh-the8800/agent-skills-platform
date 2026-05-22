import * as React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-neutral-200 bg-white shadow-sm',
        'hover:shadow-md transition-shadow',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={['p-4', className].filter(Boolean).join(' ')} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={['px-4 pb-4', className].filter(Boolean).join(' ')} {...props} />;
}

