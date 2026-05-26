import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import path from 'node:path';

import { PrismaService } from '../prisma/prisma.service';

interface Finding {
  file: string;
  rule: string;
  line: number;
}

interface Rule {
  id: string;
  description: string;
  pattern: RegExp;
  extensions: Set<string> | null; // null = all text files
}

const RULES: Rule[] = [
  // Shell: pipe to shell execution
  {
    id: 'SHELL_PIPE_EXEC',
    description: 'Output piped directly into a shell interpreter',
    pattern: /(?:curl|wget)\s+[^\n|]+\|\s*(?:ba)?sh/i,
    extensions: new Set(['.sh', '.bash', '.zsh', '.fish', '.md']),
  },
  // Shell: base64 decode + execute
  {
    id: 'BASE64_EXEC',
    description: 'Base64-decoded content executed as a command',
    pattern: /base64\s+(?:-d|--decode)[^\n]*\|\s*(?:ba)?sh/i,
    extensions: new Set(['.sh', '.bash', '.zsh', '.fish']),
  },
  // Shell: eval with command substitution
  {
    id: 'SHELL_EVAL',
    description: 'eval() used with command substitution or variable expansion',
    pattern: /\beval\s+["'`$]/i,
    extensions: new Set(['.sh', '.bash', '.zsh', '.fish']),
  },
  // Shell: delete root or home
  {
    id: 'RM_DESTRUCTIVE',
    description: 'Recursive forced deletion of root or home directory',
    pattern: /rm\s+-[a-z]*r[a-z]*f[a-z]*\s+(?:\/|~\/?\s*$|~\s)/i,
    extensions: new Set(['.sh', '.bash', '.zsh', '.fish']),
  },
  // Shell: reverse shell via /dev/tcp
  {
    id: 'REVERSE_SHELL_TCP',
    description: 'Bash /dev/tcp reverse shell pattern',
    pattern: /\/dev\/tcp\//,
    extensions: new Set(['.sh', '.bash', '.zsh', '.fish']),
  },
  // Shell: netcat execute
  {
    id: 'NETCAT_EXEC',
    description: 'netcat used to execute a program (-e flag)',
    pattern: /\bnc(?:at)?\s+[^\n]*\s-e\s/i,
    extensions: new Set(['.sh', '.bash', '.zsh', '.fish']),
  },
  // Shell: reading /etc/shadow or /etc/passwd
  {
    id: 'SENSITIVE_FILE_READ',
    description: 'Script reads sensitive system credential files',
    pattern: /\/etc\/(?:shadow|passwd|sudoers)/,
    extensions: new Set(['.sh', '.bash', '.zsh', '.fish', '.py', '.rb']),
  },
  // JS/TS: dangerous eval
  {
    id: 'JS_EVAL',
    description: 'eval() or new Function() used for dynamic code execution',
    pattern: /\beval\s*\(|new\s+Function\s*\(/,
    extensions: new Set(['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx']),
  },
  // Python: eval/exec with non-literal
  {
    id: 'PY_EVAL_EXEC',
    description: 'eval() or exec() called with a non-literal argument',
    pattern: /\b(?:eval|exec)\s*\(\s*(?!["'])/,
    extensions: new Set(['.py']),
  },
  // Python: subprocess with shell=True
  {
    id: 'PY_SUBPROCESS_SHELL',
    description: 'subprocess called with shell=True (command injection risk)',
    pattern: /subprocess\.[a-z_]+\s*\([^)]*shell\s*=\s*True/i,
    extensions: new Set(['.py']),
  },
  // Prompt injection in SKILL.md
  {
    id: 'PROMPT_INJECTION',
    description: 'Possible prompt injection — instruction override attempt detected',
    pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?|you\s+are\s+now\s+(?:a\s+)?(?:DAN|jailbreak)|disregard\s+(?:all\s+)?(?:previous|prior)\s+instructions?/i,
    extensions: new Set(['.md', '.txt']),
  },
];

function scanContent(filePath: string, content: string): Finding[] {
  const ext = path.extname(filePath).toLowerCase();
  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (const rule of RULES) {
    if (rule.extensions !== null && !rule.extensions.has(ext)) continue;

    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        findings.push({ file: filePath, rule: `${rule.id}: ${rule.description}`, line: i + 1 });
        break; // one finding per rule per file is enough
      }
    }
  }

  return findings;
}

@Injectable()
export class ScannerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScannerService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const stuck = await this.prisma.skill.findMany({
      where: { status: 'PENDING', createdAt: { lt: cutoff }, deletedAt: null },
      include: {
        versions: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    for (const skill of stuck) {
      const version = skill.versions[0];
      if (!version) continue;
      this.logger.warn(`Re-scanning stuck PENDING skill ${skill.id}`);
      void this.scan(skill.id, version.skillMd, version.files as Record<string, string>);
    }
  }

  async scan(skillId: string, skillMd: string, files: Record<string, string>): Promise<void> {
    try {
      const allFindings: Finding[] = [];

      allFindings.push(...scanContent('skill.md', skillMd));
      for (const [filePath, content] of Object.entries(files)) {
        allFindings.push(...scanContent(filePath, content));
      }

      if (allFindings.length === 0) {
        await this.prisma.skill.update({
          where: { id: skillId },
          data: { status: 'PUBLISHED', securityScanned: true },
        });
        this.logger.log(`Skill ${skillId} passed scan — published`);
      } else {
        const reason = allFindings
          .map((f) => `${f.file}:${f.line} — ${f.rule}`)
          .join('; ');
        await this.prisma.skill.update({
          where: { id: skillId },
          data: { status: 'REJECTED', securityScanned: true, rejectionReason: reason },
        });
        this.logger.warn(`Skill ${skillId} rejected — ${reason}`);
      }
    } catch (err) {
      this.logger.error(`Scanner failed for skill ${skillId}`, err instanceof Error ? err.stack : String(err));
    }
  }
}
