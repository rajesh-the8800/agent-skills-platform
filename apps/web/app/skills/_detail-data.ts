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

/** Matches `apps/api/prisma/seed.ts` skill ids (run seed after migrate). */
export const SEEDED_SKILL_DB_IDS: Record<string, string> = {
  'code-reviewer-pro': 'clseed_skill_crpro',
  'git-flow-expert': 'clseed_skill_git',
  'content-writer-ai': 'clseed_skill_cw',
  'prod-log-triage': 'clseed_skill_log',
};

export type SkillDetail = SkillCardDto & SkillDetailExtras & { databaseId: string };

const DETAILS: Record<string, SkillDetailExtras> = {
  'code-reviewer-pro': {
    breadcrumbCategory: 'Testing & QA',
    fullDescription:
      'This skill reviews your code for bugs, security vulnerabilities, logic errors, performance issues, and style violations. It produces structured findings you can triage before merge, with severity levels so your team can focus on what matters first.',
    features: [
      'Identify security vulnerabilities like SQL injection and cross-site scripting.',
      'Surface performance bottlenecks and logic errors before deployment.',
      'Categorize findings by severity to prioritize critical fixes first.',
    ],
    useCases: [
      'Pre-merge reviews on pull requests with high-risk changes.',
      'Security sweeps on legacy modules before refactors.',
      'Onboarding new contributors with consistent review feedback.',
    ],
    limitations: [
      'Does not execute code or run tests in your CI environment.',
      'May miss context that exists only in private docs or tickets.',
    ],
    demoMarkdown: `## Review Summary

### Critical
Password hashing uses SHA-256 with a static salt.

\`\`\`ts
export function hashPassword(password: string) {
  return createHash('sha256').update(password + 'salt').digest('hex');
}
\`\`\`

**Recommendation:** Prefer Argon2id or bcrypt with per-user salts.`,
    views: 2025,
    version: '1.4.0',
    included: [
      'Downloadable skill package',
      'Works with Claude Code, GitHub Copilot CLI, and SKILL.md-compatible agents.',
    ],
    creatorBio: 'Founder of Agensi. Building tools for AI-native developer workflows.',
    securityScanned: true,
    instantInstall: true,
    permissionsNote: 'No special permissions required.',
    reviews: [
      {
        id: 'r1',
        author: 'Alex M.',
        date: 'May 2, 2026',
        rating: 5,
        verified: true,
        body: 'Exactly what we needed for PR hygiene. Findings are actionable and the severity buckets match how we triage.',
      },
    ],
    ratingHistogram: { 5: 218, 4: 26, 3: 8, 2: 2, 1: 1 },
  },
  'git-flow-expert': {
    breadcrumbCategory: 'DevOps',
    fullDescription:
      'Automates common git-flow operations: branch naming, merges, release tags, and hotfix paths. Reduces mistakes when multiple contributors ship on the same cadence.',
    features: [
      'Suggests branch names and tracks flow state (feature / release / hotfix).',
      'Validates merge targets and warns on diverged histories.',
      'Generates changelog-ready commit summaries.',
    ],
    useCases: ['Teams using git-flow or similar branching models.', 'Release managers preparing tags and notes.'],
    limitations: ['Assumes a conventional remote layout; custom forks may need manual steps.'],
    demoMarkdown: `## Git flow suggestion

\`\`\`bash
git checkout -b feature/auth-refresh develop
\`\`\`

Ready to open a PR against \`develop\` when tests pass.`,
    views: 980,
    version: '2.1.0',
    included: ['Skill package', 'CLI-oriented prompts for Git operations.'],
    creatorBio: 'DevOps collective focused on shipping discipline.',
    securityScanned: true,
    instantInstall: true,
    permissionsNote: 'Requires read access to your local git repo metadata only.',
    reviews: [
      {
        id: 'r1',
        author: 'Jamie L.',
        date: 'Apr 18, 2026',
        rating: 5,
        verified: true,
        body: 'Cuts down on “wrong base branch” mistakes. Great for interns.',
      },
    ],
    ratingHistogram: { 5: 892, 4: 156, 3: 34, 2: 8, 1: 3 },
  },
  'content-writer-ai': {
    breadcrumbCategory: 'Writing',
    fullDescription:
      'Generates long-form content with tone controls, outline-first drafting, and SEO-aware headings. Best for blogs, docs, and landing pages where consistency matters.',
    features: [
      'Outline → draft → polish workflow with explicit checkpoints.',
      'Brand voice presets and glossary-aware wording.',
      'Optional keyword map for headings and meta descriptions.',
    ],
    useCases: ['Marketing pages', 'Technical blogs', 'Release notes from commit themes'],
    limitations: ['Not a substitute for legal/compliance review on regulated copy.'],
    demoMarkdown: `## Draft outline

1. Problem framing  
2. Solution overview  
3. Proof points  
4. CTA  

_Want a full draft? Run the skill with your audience + tone._`,
    views: 640,
    version: '0.9.2',
    included: ['Skill package', 'Prompt templates for Claude-compatible agents.'],
    creatorBio: 'WriterStudio — editorial systems for product teams.',
    securityScanned: true,
    instantInstall: false,
    permissionsNote: 'No network access required by default.',
    reviews: [],
    ratingHistogram: { 5: 412, 4: 198, 3: 56, 2: 12, 1: 4 },
  },
  'prod-log-triage': {
    breadcrumbCategory: 'DevOps',
    fullDescription:
      'Summarizes noisy production logs into timelines, hypotheses, and next checks. Helps on-call engineers converge faster during incidents.',
    features: [
      'Clusters repeating errors and highlights first-seen timestamps.',
      'Suggests likely root causes with confidence labels.',
      'Produces a handoff note for incident channels.',
    ],
    useCases: ['Incident triage', 'Post-incident timelines', 'Noisy service debugging'],
    limitations: ['Interpretation quality depends on log structure and redaction completeness.'],
    demoMarkdown: `## Incident snapshot

- **Spike:** 14:02–14:18 UTC  
- **Top signal:** \`connection reset by peer\` (n=1,240)  
- **Hypothesis:** Upstream LB health flaps → retry storm`,
    views: 1540,
    version: '3.0.1',
    included: ['Skill package', 'Works with Claude and Codex CLI.'],
    creatorBio: 'SRE Guild — reliability patterns for growing teams.',
    securityScanned: true,
    instantInstall: true,
    permissionsNote: 'Paste-only; does not ship logs off-device.',
    reviews: [
      {
        id: 'r1',
        author: 'Priya K.',
        date: 'Mar 30, 2026',
        rating: 4,
        verified: true,
        body: 'Good structure for handoffs. Would love JSON export next.',
      },
    ],
    ratingHistogram: { 5: 1204, 4: 412, 3: 88, 2: 21, 1: 6 },
  },
};

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

  const extra = DETAILS[slug] ?? defaultExtras(base);
  const version = (raw.version as string | undefined) ?? extra.version;

  const apiReviews = mapApiReviews(raw.reviews);
  const reviews = apiReviews.length > 0 ? apiReviews : extra.reviews;

  const ratingHistogram = computeHistogram(raw.ratings) ?? extra.ratingHistogram;
  const views = typeof raw.viewCount === 'number' ? raw.viewCount : extra.views;

  return { ...base, ...extra, reviews, ratingHistogram, views, version, databaseId: base.id };
}

export async function getRelatedSkills(currentSlug: string, categories: string[], limit = 3): Promise<SkillCardDto[]> {
  if (categories.length === 0) return [];
  const data = await fetchSkills({ category: categories[0], limit: limit + 1 });
  return data.items.filter((s) => s.slug !== currentSlug).slice(0, limit);
}
