'use client';

import React from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { cn } from '../ui/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'datetime'
  | 'string-array';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: SelectOption[];
  fullWidth?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
}

export type FieldValue = string | number | string[] | null | undefined;

export interface FormSection {
  title?: string;
  fields: FieldDef[];
}

export type EditableFormValues = Record<string, FieldValue>;

interface EditableFormProps {
  sections: FormSection[];
  initialValues: EditableFormValues;
  busy?: boolean;
  submitLabel?: string;
  onSave: (patch: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
}

function toInputDate(value: FieldValue): string {
  if (typeof value !== 'string' || value.length === 0) return '';
  return value.slice(0, 10);
}

function toInputDateTime(value: FieldValue): string {
  if (typeof value !== 'string' || value.length === 0) return '';
  const trimmed = value.replace('Z', '').slice(0, 16);
  return trimmed;
}

function toTextareaArray(value: FieldValue): string {
  if (Array.isArray(value)) return value.join('\n');
  return '';
}

function fromTextareaArray(value: string): string[] | null {
  const parts = value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function valuesEqual(a: FieldValue, b: FieldValue): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  if ((a === null || a === undefined || a === '') && (b === null || b === undefined || b === '')) return true;
  return false;
}

export function EditableForm({
  sections,
  initialValues,
  busy,
  submitLabel = 'Zapisz zmiany',
  onSave,
}: EditableFormProps) {
  const [values, setValues] = React.useState<EditableFormValues>(initialValues);
  const initialRef = React.useRef(initialValues);
  const [submitting, setSubmitting] = React.useState(false);

  const setValue = (key: string, next: FieldValue) => {
    setValues((prev) => ({ ...prev, [key]: next }));
  };

  const submit = async () => {
    const patch: Record<string, unknown> = {};
    const initial = initialRef.current;
    for (const section of sections) {
      for (const field of section.fields) {
        const cur = values[field.key];
        const init = initial[field.key];
        if (!valuesEqual(cur, init)) {
          patch[field.key] = cur === '' ? null : cur;
        }
      }
    }
    if (Object.keys(patch).length === 0) {
      toast.info('Brak zmian do zapisania.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await onSave(patch);
      if (result !== false) {
        initialRef.current = { ...values };
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <div key={section.title ?? idx} className="space-y-3">
          {section.title && (
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h4>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className={cn('space-y-1', (field.fullWidth || field.type === 'textarea' || field.type === 'string-array') && 'md:col-span-2')}
              >
                <Label htmlFor={field.key} className="text-xs uppercase tracking-wide text-muted-foreground">
                  {field.label}
                </Label>
                <FieldInput field={field} value={values[field.key]} onChange={(v) => setValue(field.key, v)} />
                {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" size="sm" disabled={busy || submitting} onClick={submit}>
        {submitting ? 'Zapisywanie…' : submitLabel}
      </Button>
    </div>
  );
}

interface FieldInputProps {
  field: FieldDef;
  value: FieldValue;
  onChange: (next: FieldValue) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          id={field.key}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          id={field.key}
          type="number"
          inputMode="decimal"
          placeholder={field.placeholder}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange(null);
              return;
            }
            const num = Number(raw);
            onChange(Number.isFinite(num) ? num : null);
          }}
        />
      );
    case 'select':
      return (
        <Select
          value={(value as string) ?? ''}
          onValueChange={(v) => onChange(v === '__null__' ? null : v)}
        >
          <SelectTrigger id={field.key}>
            <SelectValue placeholder={field.placeholder ?? 'Wybierz…'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'date':
      return (
        <Input
          id={field.key}
          type="date"
          value={toInputDate(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        />
      );
    case 'datetime':
      return (
        <Input
          id={field.key}
          type="datetime-local"
          value={toInputDateTime(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        />
      );
    case 'string-array':
      return (
        <Textarea
          id={field.key}
          rows={field.rows ?? 3}
          placeholder={field.placeholder ?? 'Jeden element w linii…'}
          value={toTextareaArray(value)}
          onChange={(e) => onChange(fromTextareaArray(e.target.value))}
        />
      );
    case 'text':
    default:
      return (
        <Input
          id={field.key}
          type="text"
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
