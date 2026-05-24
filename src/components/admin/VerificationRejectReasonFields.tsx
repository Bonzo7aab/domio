'use client';

import React from 'react';
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
  VERIFICATION_REJECTION_REASONS,
  type VerificationRejectionReasonId,
  formatVerificationRejectionReason,
} from '../../lib/verification/status';

interface VerificationRejectReasonFieldsProps {
  reasonId: VerificationRejectionReasonId | '';
  customReason: string;
  onReasonIdChange: (id: VerificationRejectionReasonId | '') => void;
  onCustomReasonChange: (text: string) => void;
  disabled?: boolean;
}

export function VerificationRejectReasonFields({
  reasonId,
  customReason,
  onReasonIdChange,
  onCustomReasonChange,
  disabled,
}: VerificationRejectReasonFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="rejectReasonPreset">Powód odrzucenia</Label>
        <Select
          value={reasonId || undefined}
          onValueChange={value => onReasonIdChange(value as VerificationRejectionReasonId)}
          disabled={disabled}
        >
          <SelectTrigger id="rejectReasonPreset" className="w-full">
            <SelectValue placeholder="Wybierz powód odrzucenia…" />
          </SelectTrigger>
          <SelectContent>
            {VERIFICATION_REJECTION_REASONS.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {reasonId === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="rejectReasonCustom">Szczegóły (Inne)</Label>
          <Textarea
            id="rejectReasonCustom"
            value={customReason}
            onChange={e => onCustomReasonChange(e.target.value)}
            placeholder="Opisz powód odrzucenia widoczny dla użytkownika…"
            rows={3}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

export function buildRejectReasonFromFields(
  reasonId: VerificationRejectionReasonId | '',
  customReason: string,
  documentPrefill: string
): string | null {
  if (reasonId) {
    if (reasonId === 'other' && !customReason.trim()) {
      return null;
    }
    const formatted = formatVerificationRejectionReason(reasonId, customReason);
    if (documentPrefill.trim()) {
      return `${formatted}\n\n${documentPrefill.trim()}`;
    }
    return formatted;
  }
  if (documentPrefill.trim()) {
    return documentPrefill.trim();
  }
  return null;
}
