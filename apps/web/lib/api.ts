import type { SkillCardDto } from '@agent-skills/types';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

export type CategoryDto = { id: string; name: string; slug: string };

export type SkillListResponse = {
  items: SkillCardDto[];
  page: number;
  limit: number;
  total: number;
};

export async function fetchSkills(params: {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<SkillListResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.category && params.category !== 'All') sp.set('category', params.category);
  if (params.sort) sp.set('sort', params.sort);
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));

  try {
    const res = await fetch(`${API_BASE}/skills?${sp}`, { cache: 'no-store' });
    if (!res.ok) return { items: [], page: 1, limit: params.limit ?? 12, total: 0 };
    return res.json() as Promise<SkillListResponse>;
  } catch {
    return { items: [], page: 1, limit: params.limit ?? 12, total: 0 };
  }
}

export async function fetchCategories(): Promise<CategoryDto[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json() as Promise<CategoryDto[]>;
  } catch {
    return [];
  }
}

export async function fetchSkillBySlug(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API_BASE}/skills/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json() as Promise<Record<string, unknown>>;
  } catch {
    return null;
  }
}
