import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const GENERATED_DIR = path.join(__dirname, '.generated');

const MIN_BYTES = 1200;

function ensureGeneratedDir(): void {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }
}

/**
 * Minimal PDF padded to at least 1.2 KB (verification dropzone minSize is 1 KB).
 */
export function buildSmallVerificationPdf(label: string): string {
  ensureGeneratedDir();

  const suffix = randomBytes(4).toString('hex');
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const filePath = path.join(GENERATED_DIR, `${safeLabel}-${suffix}.pdf`);

  const header = `%PDF-1.4\n% E2E verification mock: ${label}\n`;
  const padding = 'x'.repeat(Math.max(0, MIN_BYTES - header.length - 20));
  const body = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n${padding}\n%%EOF\n`;
  fs.writeFileSync(filePath, header + body, 'utf8');

  return filePath;
}

export interface VerificationMockFiles {
  companyRegistration: string;
  insurance: string;
  certifications: string;
  references: string;
}

export function buildVerificationMockFiles(): VerificationMockFiles {
  return {
    companyRegistration: buildSmallVerificationPdf('krs-ceidg'),
    insurance: buildSmallVerificationPdf('oc-policy'),
    certifications: buildSmallVerificationPdf('certifications'),
    references: buildSmallVerificationPdf('references'),
  };
}
