import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import AdmZip = require('adm-zip');
import path from 'node:path';

import { PrismaService } from '../prisma/prisma.service';
import type { SkillUploadDto } from './dto/skill-upload.dto';
import { ScannerService } from './scanner.service';

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try { return JSON.parse(value) as string[]; } catch { return []; }
  }
  return [];
}

const MAX_ZIP_SIZE = 52_428_800; // 50 MB
const MAX_FILE_SIZE = 2_097_152; // 2 MB per file
const MAX_FILE_COUNT = 100;

const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.sh', '.bash', '.zsh', '.fish',
  '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.env',
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift', '.php', '.cs',
  '.cpp', '.c', '.h', '.hpp',
  '.html', '.htm', '.css', '.xml', '.csv', '.properties',
  '.sql', '.graphql', '.gql', '.proto', '.lock', '.editorconfig',
  '.gitignore', '.npmignore',
]);

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();
  if (!ext && ['makefile', 'dockerfile', 'procfile', 'readme', 'license', 'changelog'].includes(base)) {
    return true;
  }
  return TEXT_EXTENSIONS.has(ext);
}

function isSafePath(filePath: string): boolean {
  const normalized = path.posix.normalize(filePath);
  return !normalized.startsWith('..') && !normalized.startsWith('/') && !normalized.includes('\0');
}

function extractZip(buffer: Buffer): { skillMd: string; files: Record<string, string> } {
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new BadRequestException('Invalid ZIP file — could not parse the uploaded package');
  }

  try {
    const entries = zip.getEntries();

    if (entries.length > MAX_FILE_COUNT) {
      throw new BadRequestException(`ZIP contains too many files (max ${MAX_FILE_COUNT})`);
    }

    const fileEntries = entries.filter(
      (e) => !e.isDirectory && !e.entryName.startsWith('__MACOSX/') && !e.entryName.includes('/._'),
    );

    const topDirs = new Set(fileEntries.map((e) => e.entryName.split('/')[0]));
    const hasCommonRoot =
      topDirs.size === 1 &&
      fileEntries.every((e) => e.entryName.includes('/'));
    const rootPrefix = hasCommonRoot ? [...topDirs][0] + '/' : '';

    let skillMd: string | null = null;
    const files: Record<string, string> = {};

    for (const entry of fileEntries) {
      const rawPath = entry.entryName;
      const normalizedPath = rootPrefix ? rawPath.slice(rootPrefix.length) : rawPath;

      if (!normalizedPath) continue;
      if (!isSafePath(normalizedPath)) {
        throw new BadRequestException(`Unsafe file path detected: ${rawPath}`);
      }

      if (entry.header.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File "${normalizedPath}" exceeds the 2 MB per-file limit`,
        );
      }

      if (!isTextFile(normalizedPath)) {
        continue;
      }

      const rawData = entry.getData();
      if (rawData.length > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File "${normalizedPath}" exceeds the 2 MB per-file limit`,
        );
      }
      const content = rawData.toString('utf-8');

      if (normalizedPath.toLowerCase() === 'skill.md') {
        skillMd = content;
      } else {
        files[normalizedPath] = content;
      }
    }

    if (!skillMd) {
      throw new BadRequestException('ZIP must contain a SKILL.md file at the root');
    }

    return { skillMd, files };
  } catch (e) {
    if (e instanceof HttpException) throw e;
    throw new BadRequestException('Invalid ZIP file — could not read package contents');
  }
}

@Injectable()
export class SkillSubmissionsService {
  private readonly logger = new Logger(SkillSubmissionsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ScannerService) private readonly scanner: ScannerService,
  ) {}

  async upload(dto: SkillUploadDto, zipBuffer: Buffer) {
    try {
      return await this.doUpload(dto, zipBuffer);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error('Unexpected upload error', e instanceof Error ? e.stack : msg);
      throw new InternalServerErrorException(`Upload failed: ${msg}`);
    }
  }

  private async doUpload(dto: SkillUploadDto, zipBuffer: Buffer) {
    if (zipBuffer.length > MAX_ZIP_SIZE) {
      throw new BadRequestException('ZIP file exceeds the 50 MB size limit');
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const taken = await this.prisma.skill.findFirst({
      where: { slug: dto.slug, deletedAt: null },
      select: { id: true },
    });
    if (taken) {
      throw new ConflictException('This URL slug is already taken. Choose another.');
    }

    const { skillMd, files } = extractZip(zipBuffer);

    const categoryIds = toStringArray(dto.categoryIds);
    if (categoryIds.length > 0) {
      const count = await this.prisma.category.count({
        where: { id: { in: categoryIds } },
      });
      if (count !== categoryIds.length) {
        throw new BadRequestException('One or more categories are invalid');
      }
    }

    const tags = toStringArray(dto.tags).map((t) => t.trim()).filter(Boolean);

    try {
      const useCases = toStringArray(dto.useCases).map((s) => s.trim()).filter(Boolean);
      const limitations = toStringArray(dto.limitations).map((s) => s.trim()).filter(Boolean);

      const skill = await this.prisma.skill.create({
        data: {
          slug: dto.slug,
          name: dto.name.trim(),
          shortDescription: dto.shortDescription.trim(),
          description: dto.description.trim(),
          creatorId: dto.userId,
          tags,
          supportedAgents: toStringArray(dto.supportedAgents),
          useCases,
          limitations,
          installCount: 0,
          categories:
            categoryIds.length > 0
              ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
              : undefined,
          versions: {
            create: {
              version: dto.version,
              skillMd,
              files,
              fileSize: zipBuffer.length,
            },
          },
        },
        include: {
          versions: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      void this.scanner.scan(skill.id, skillMd, files);

      return {
        skillId: skill.id,
        slug: skill.slug,
        version: skill.versions[0]?.version ?? dto.version,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This URL slug is already taken. Choose another.');
      }
      throw e;
    }
  }
}
