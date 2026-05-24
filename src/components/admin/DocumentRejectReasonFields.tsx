'use client';

import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DOCUMENT_REJECTION_REASONS,
  type DocumentRejectionReasonId,
  formatDocumentRejectionReason,
} from '../../lib/verification/status';

interface DocumentRejectReasonFieldsProps {
  reasonId: DocumentRejectionReasonId | '';
  customReason: string;
  onReasonIdChange: (id: DocumentRejectionReasonId | '') => void;
  onCustomReasonChange: (text: string) => void;
  disabled?: boolean;
}

export function DocumentRejectReasonFields({
  reasonId,
  customReason,
  onReasonIdChange,
  onCustomReasonChange,
  disabled,
}: DocumentRejectReasonFieldsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-destructive">Powód odrzucenia</Label>
      <Select
        value={reasonId || undefined}
        onValueChange={(value) => onReasonIdChange(value as DocumentRejectionReasonId)}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Wybierz powód…" />
        </SelectTrigger>
        <SelectContent>
          {DOCUMENT_REJECTION_REASONS.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {reasonId === 'other' && (
        <Textarea
          value={customReason}
          onChange={(e) => onCustomReasonChange(e.target.value)}
          placeholder="Opisz powód odrzucenia…"
          rows={2}
          disabled={disabled}
          className="text-sm"
        />
      )}
    </div>
  );
}

export function buildDocumentRejectReason(
  reasonId: DocumentRejectionReasonId | '',
  customReason: string
): string | null {
  if (!reasonId) return null;
  if (reasonId === 'other' && !customReason.trim()) return null;
  return formatDocumentRejectionReason(reasonId, customReason);
}
