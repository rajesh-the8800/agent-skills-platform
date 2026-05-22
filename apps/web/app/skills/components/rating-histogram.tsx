/** Counts per star level (5 = highest). */
export type RatingHistogramCounts = {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
};

const ORDER = [5, 4, 3, 2, 1] as const;

export function RatingHistogramBars({ counts }: { counts: RatingHistogramCounts }) {
  const total = ORDER.reduce((sum, k) => sum + counts[k], 0);

  return (
    <div className="flex w-full max-w-md flex-col gap-2.5">
      {ORDER.map((stars) => {
        const c = counts[stars];
        const pctOfTotal = total > 0 ? (c / total) * 100 : 0;

        return (
          <div key={stars} className="grid grid-cols-[1.75rem_1fr_2.75rem] items-center gap-2">
            <div className="flex items-center gap-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="w-3 text-right font-medium text-neutral-700 dark:text-neutral-200">{stars}</span>
              <span className="text-yellow-500" aria-hidden>
                ★
              </span>
            </div>
            <div className="min-w-0">
              <div
                className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                title={`${pctOfTotal.toFixed(0)}% of all ratings`}
              >
                <div
                  className="h-full min-w-0 rounded-full bg-blue-600 dark:bg-blue-500"
                  style={{ width: `${pctOfTotal}%` }}
                />
              </div>
            </div>
            <span className="text-right text-xs tabular-nums text-neutral-600 dark:text-neutral-300">{c}</span>
          </div>
        );
      })}
    </div>
  );
}
