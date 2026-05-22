import type { SkillCardDto } from '@agent-skills/types';

import { fetchSkillBySlug, fetchSkills } from '@/lib/api';
import type { RatingHistogramCounts } from './components/rating-histogram';

export type SkillReview = {
  id: string;
  author: string;
  date: string;
  rating: number;
  verified: boolean;
  body: string;
};

export type SkillDetailExtras = {
  breadcrumbCategory: string;
  fullDescription: string;
  features: string[];
  useCases: string[];
  limitations: string[];
  demoMarkdown: string;
  views: number;
  version: string;
  included: string[];
  creatorBio: string;
  securityScanned: boolean;
  instantInstall: boolean;
  permissionsNote: string;
  reviews: SkillReview[];
  /** Distribution of star ratings (for bar graph). */
  ratingHistogram: RatingHistogramCounts;
};


export type SkillDetail = SkillCardDto & SkillDetailExtras & { databaseId: string; creatorId: string };

const DETAILS: Record<string, SkillDetailExtras> = {};

function defaultHistogramFromInstalls(installCount: number): RatingHistogramCounts {
  const n = Math.max(installCount, 1);
  return {
    5: Math.max(0, Math.round(n * 0.68)),
    4: Math.max(0, Math.round(n * 0.18)),
    3: Math.max(0, Math.round(n * 0.08)),
    2: Math.max(0, Math.round(n * 0.04)),
    1: Math.max(0, Math.round(n * 0.02)),
  };
}

function computeHistogram(ratings: unknown): RatingHistogramCounts | null {
  if (!Array.isArray(ratings) || ratings.length === 0) return null;
  const counts: RatingHistogramCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of ratings as { stars: number }[]) {
    const s = r.stars as 1 | 2 | 3 | 4 | 5;
    if (s >= 1 && s <= 5) counts[s]++;
  }
  return counts;
}

function defaultExtras(base: SkillCardDto): SkillDetailExtras {
  const cat = base.categories[0] ?? 'General';
  return {
    breadcrumbCategory: cat,
    fullDescription: `${base.shortDescription} Full documentation and examples will appear here when this skill is published to the API.`,
    features: [
      base.shortDescription,
      `Works with: ${base.supportedAgents.join(', ')}.`,
      'SKILL.md compatible package.',
    ],
    useCases: ['Day-to-day workflows with your AI agent.', 'Team standards and repeatable prompts.'],
    limitations: ['Content may be updated by the creator over time.'],
    demoMarkdown: `## Preview\n\nInstall the skill and open SKILL.md for full instructions.\n\n\`\`\`bash\nunzip ${base.slug}.zip -d ~/.claude/skills/\n\`\`\``,
    views: Math.max(100, Math.round(base.installCount * 0.4)),
    version: '1.0.0',
    included: ['Downloadable skill package', 'Agent-ready SKILL.md'],
    creatorBio: `${base.creatorName} on SkillHub.`,
    securityScanned: true,
    instantInstall: true,
    permissionsNote: 'No special permissions required.',
    reviews: [],
    ratingHistogram: defaultHistogramFromInstalls(base.installCount),
  };
}

type RawReview = {
  id: string;
  body: string;
  stars: number;
  createdAt: string;
  user: { name: string | null; email: string };
};

function mapApiReviews(raw: unknown): SkillReview[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawReview[]).map((r) => ({
    id: r.id,
    author: r.user?.name ?? r.user?.email ?? 'Anonymous',
    date: new Date(r.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    rating: r.stars ?? 0,
    verified: false,
    body: r.body,
  }));
}

export async function getSkillDetail(slug: string): Promise<SkillDetail | null> {
  const raw = await fetchSkillBySlug(slug);
  if (!raw) return null;

  const base: SkillCardDto = {
    id: raw.id as string,
    slug: raw.slug as string,
    name: raw.name as string,
    shortDescription: raw.shortDescription as string,
    thumbnailUrl: null,
    creatorName: (raw.creatorName as string | undefined) ?? 'Unknown',
    installCount: raw.installCount as number,
    averageRating: raw.averageRating as number,
    supportedAgents: raw.supportedAgents as string[],
    updatedAt: raw.updatedAt as string,
    tags: raw.tags as string[],
    categories: raw.categories as string[],
    securityScanned: (raw.securityScanned as boolean | undefined) ?? false,
  };

  const staticExtra = DETAILS[slug] ?? defaultExtras(base);

  const apiUseCases = Array.isArray(raw.useCases) && (raw.useCases as string[]).length > 0
    ? (raw.useCases as string[])
    : null;
  const apiLimitations = Array.isArray(raw.limitations) && (raw.limitations as string[]).length > 0
    ? (raw.limitations as string[])
    : null;

  const extra: SkillDetailExtras = {
    ...staticExtra,
    useCases: apiUseCases ?? staticExtra.useCases,
    limitations: apiLimitations ?? staticExtra.limitations,
  };

  const version = (raw.version as string | undefined) ?? extra.version;

  const apiReviews = mapApiReviews(raw.reviews);
  const reviews = apiReviews.length > 0 ? apiReviews : extra.reviews;

  const ratingHistogram = computeHistogram(raw.ratings) ?? extra.ratingHistogram;
  const views = typeof raw.viewCount === 'number' ? raw.viewCount : extra.views;

  return { ...base, ...extra, reviews, ratingHistogram, views, version, databaseId: base.id, creatorId: (raw.creatorId as string) ?? '' };
}

export async function getRelatedSkills(currentSlug: string, categories: string[], limit = 3): Promise<SkillCardDto[]> {
  if (categories.length === 0) return [];
  const data = await fetchSkills({ category: categories[0], limit: limit + 1 });
  return data.items.filter((s) => s.slug !== currentSlug).slice(0, limit);
}
