import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { TenderContestDocumentMeta } from '../../types/tender-contest';

const BUCKET = 'job-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function inferDocumentType(fileName: string): TenderContestDocumentMeta['type'] {
  const lower = fileName.toLowerCase();
  if (lower.includes('rysun') || lower.includes('drawing')) return 'drawings';
  if (lower.includes('wymag') || lower.includes('stwior')) return 'requirements';
  if (lower.includes('spec') || lower.includes('koszt')) return 'specification';
  return 'other';
}

export async function uploadTenderDocument(
  supabase: SupabaseClient<Database>,
  file: File,
  userId: string,
  tenderId?: string,
): Promise<{ data: TenderContestDocumentMeta | null; error: Error | null }> {
  const fileType = file.type.toLowerCase();
  const allowed = ALLOWED_TYPES.map((t) => t.toLowerCase());
  if (!allowed.includes(fileType) && fileType !== 'image/jpeg') {
    return {
      data: null,
      error: new Error(
        'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX',
      ),
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { data: null, error: new Error('Plik jest zbyt duży. Maksymalny rozmiar: 10MB') };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const folder = tenderId || 'draft';
  const filePath = `${userId}/tenders/${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return {
    data: {
      id: crypto.randomUUID(),
      name: file.name,
      url: urlData.publicUrl,
      path: filePath,
      type: inferDocumentType(file.name),
    },
    error: null,
  };
}

export async function uploadTenderDocuments(
  supabase: SupabaseClient<Database>,
  files: File[],
  userId: string,
  tenderId?: string,
): Promise<{ data: TenderContestDocumentMeta[]; errors: unknown[] }> {
  const results: TenderContestDocumentMeta[] = [];
  const errors: unknown[] = [];

  for (const file of files) {
    const { data, error } = await uploadTenderDocument(supabase, file, userId, tenderId);
    if (error || !data) {
      errors.push({ file: file.name, error });
    } else {
      results.push(data);
    }
  }

  return { data: results, errors };
}
