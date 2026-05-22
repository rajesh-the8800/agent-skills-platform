import { IconDownload, IconGrid, IconStar } from './icons';

export function StatsRow({ skills, downloads, avgRating }: { skills: number; downloads: number; avgRating: number }) {
  const items = [
    { icon: IconGrid, label: `${skills}+ Skills` },
    { icon: IconDownload, label: `${downloads.toLocaleString()}+ Downloads` },
    { icon: IconStar, label: `${avgRating.toFixed(1)} Avg Rating` },
  ] as const;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600 dark:text-neutral-300">
      {items.map((it) => (
        <div key={it.label} className="inline-flex items-center gap-2">
          <it.icon className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

