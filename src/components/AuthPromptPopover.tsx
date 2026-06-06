'use client';

import React, { useCallback, useState } from 'react';
import { useNavigationWithLoading } from '../hooks/useNavigationWithLoading';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export interface AuthPromptPopoverProps {
  title: string;
  description: string;
  children: React.ReactElement;
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AuthPromptPopover({
  title,
  description,
  children,
  align = 'end',
  open,
  onOpenChange,
}: AuthPromptPopoverProps) {
  const router = useNavigationWithLoading();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const popoverOpen = isControlled ? open : internalOpen;

  const setPopoverOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const navigateWithoutClickThrough = (
    event: React.MouseEvent | React.PointerEvent,
    href: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setPopoverOpen(false);
    // Defer navigation so the popover close does not pass the click to the job card below.
    window.setTimeout(() => {
      router.push(href);
    }, 0);
  };

  return (
    <Popover modal open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72"
        align={align}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            className="w-full sm:flex-1"
            onPointerDown={(event) =>
              navigateWithoutClickThrough(event, '/user-type-selection')
            }
          >
            Zaloguj się
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:flex-1"
            onPointerDown={(event) => navigateWithoutClickThrough(event, '/register')}
          >
            Zarejestruj się
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const AUTH_PROMPT_APPLY_OFFER = {
  title: 'Złóż ofertę',
  description: 'Zaloguj się, aby składać oferty na zgłoszenia.',
} as const;

export const AUTH_PROMPT_MESSAGES = {
  title: 'Wiadomości',
  description: 'Zaloguj się, aby przeglądać i wysyłać wiadomości.',
} as const;

export const AUTH_PROMPT_FAVORITES = {
  title: 'Zapisane zgłoszenia',
  description: 'Zaloguj się lub załóż konto, aby zapisywać zgłoszenia do przejrzenia później.',
} as const;
