import { StatsRow } from './StatsRow';
import { LiveSearchInput } from './LiveSearchInput';
import { PublishSkillLink } from './PublishSkillLink';

export function HeroSection({
  q,
  category,
  sort,
  stats,
}: {
  q: string;
  category: string;
  sort: string;
  stats: { skills: number; downloads: number; avgRating: number };
}) {
  return (
    <section className="pt-6">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
          Browse AI Agent <span className="text-blue-600">Skills</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg dark:text-neutral-300">
          Discover and install SKILL.md skills for Claude Code, OpenClaw, Codex CLI, Cursor, and
          20+ AI coding agents. Filter by category and popularity, or{' '}
          <PublishSkillLink />{' '}
          to share with the community.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <LiveSearchInput initialQuery={q} category={category} sort={sort} />
        </div>

        <StatsRow skills={stats.skills} downloads={stats.downloads} avgRating={stats.avgRating} />
      </div>
    </section>
  );
}
