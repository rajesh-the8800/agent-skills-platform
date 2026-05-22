import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { id: 'clseed_cat_crev',   name: 'Code & Review',      slug: 'code-review' },
  { id: 'clseed_cat_test',   name: 'Testing & QA',        slug: 'testing-qa' },
  { id: 'clseed_cat_devops', name: 'DevOps',              slug: 'devops' },
  { id: 'clseed_cat_sec',    name: 'Security',            slug: 'security' },
  { id: 'clseed_cat_docs',   name: 'Writing & Docs',      slug: 'writing-docs' },
  { id: 'clseed_cat_data',   name: 'Data & Analytics',    slug: 'data-analytics' },
  { id: 'clseed_cat_res',    name: 'Research',            slug: 'research' },
  { id: 'clseed_cat_pm',     name: 'Project Management',  slug: 'project-management' },
  { id: 'clseed_cat_comm',   name: 'Communication',       slug: 'communication' },
  { id: 'clseed_cat_des',    name: 'Design',              slug: 'design' },
  { id: 'clseed_cat_fin',    name: 'Finance',             slug: 'finance' },
  { id: 'clseed_cat_edu',    name: 'Education',           slug: 'education' },
  { id: 'clseed_cat_prod',   name: 'Productivity',        slug: 'productivity' },
];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name },
    });
  }

  console.log('Seed complete:', CATEGORIES.length, 'categories');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
