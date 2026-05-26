export type ID = string;

export type SkillCardDto = {
  id: ID;
  slug: string;
  name: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  creatorName: string;
  installCount: number;
  averageRating: number;
  supportedAgents: string[];
  updatedAt: string;
  tags: string[];
  categories: string[];
  securityScanned: boolean;
};

