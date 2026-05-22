import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CREATOR_ID = 'clseed_user_creator';

const CATEGORIES = [
  { id: 'clseed_cat_crev', name: 'Code Review', slug: 'code-review' },
  { id: 'clseed_cat_devx', name: 'Developer Experience', slug: 'developer-experience' },
  { id: 'clseed_cat_cont', name: 'Content', slug: 'content' },
  { id: 'clseed_cat_ops', name: 'Operations', slug: 'operations' },
  { id: 'clseed_cat_sec', name: 'Security', slug: 'security' },
];

const SKILLS = [
  {
    id: 'clseed_skill_crpro',
    slug: 'code-reviewer-pro',
    name: 'Code Reviewer Pro',
    shortDescription: 'Advanced code review with security scanning and best practices analysis',
    description:
      'Advanced code review with security scanning and best practices analysis. Use before merge to catch issues early.',
  },
  {
    id: 'clseed_skill_git',
    slug: 'git-flow-expert',
    name: 'Git Flow Expert',
    shortDescription: 'Automate git workflows with intelligent branch management',
    description:
      'Automate git workflows with intelligent branch management. Ideal for teams using git-flow.',
  },
  {
    id: 'clseed_skill_cw',
    slug: 'content-writer-ai',
    name: 'Content Writer AI',
    shortDescription: 'Generate blog posts, docs, and marketing copy with your brand voice',
    description:
      'Generate blog posts, docs, and marketing copy with your brand voice. Outline-first workflow.',
  },
  {
    id: 'clseed_skill_log',
    slug: 'prod-log-triage',
    name: 'Prod Log Triage',
    shortDescription:
      'Summarize logs, identify root causes, and propose fixes with confidence levels',
    description:
      'Summarize logs, identify root causes, and propose fixes with confidence levels. Built for on-call.',
  },
];

async function main() {
  await prisma.user.upsert({
    where: { id: CREATOR_ID },
    create: {
      id: CREATOR_ID,
      email: 'creator@skillhub.local',
      name: 'SkillHub Creator',
      provider: 'seed',
      avatar: null,
    },
    update: {},
  });

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name },
    });
  }

  for (const s of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: s.slug },
      create: {
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortDescription: s.shortDescription,
        description: s.description,
        creatorId: CREATOR_ID,
        tags: [],
        supportedAgents: ['Claude', 'Codex'],
        installCount: 0,
      },
      update: {
        name: s.name,
        shortDescription: s.shortDescription,
        description: s.description,
      },
    });

    const skillRow = await prisma.skill.findUnique({ where: { slug: s.slug } });
    if (!skillRow) continue;

    await prisma.skillVersion.upsert({
      where: { skillId_version: { skillId: skillRow.id, version: '1.0.0' } },
      create: {
        skillId: skillRow.id,
        version: '1.0.0',
        skillMd: '# Seed skill\n\nThis is a placeholder SKILL.md for seeded data.',
        files: {},
        fileSize: 2048,
      },
      update: {
        skillMd: '# Seed skill\n\nThis is a placeholder SKILL.md for seeded data.',
        files: {},
        fileSize: 2048,
      },
    });
  }

  const crCat = await prisma.category.findUnique({ where: { slug: 'code-review' } });
  const crSkill = await prisma.skill.findUnique({ where: { slug: 'code-reviewer-pro' } });
  if (crCat && crSkill) {
    await prisma.skillCategory.upsert({
      where: { skillId_categoryId: { skillId: crSkill.id, categoryId: crCat.id } },
      create: { skillId: crSkill.id, categoryId: crCat.id },
      update: {},
    });
  }

  console.log('Seed complete:', SKILLS.length, 'skills,', CATEGORIES.length, 'categories');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
