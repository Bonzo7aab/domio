'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { footerColumns, footerTagline } from '../lib/footer-links';
import { openCookieSettings } from '../lib/cookie-consent';
import { cn } from './ui/utils';

const linkClassName =
  'text-sm text-muted-foreground hover:text-foreground transition-colors text-left';

function FooterLinkItem({
  label,
  href,
  action,
}: {
  label: string;
  href?: string;
  action?: 'cookie-settings';
}) {
  if (action === 'cookie-settings') {
    return (
      <button type="button" onClick={openCookieSettings} className={linkClassName}>
        {label}
      </button>
    );
  }

  if (!href) return null;

  return (
    <Link href={href} className={linkClassName}>
      {label}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column, index) => (
            <div key={column.title} className="space-y-4">
              {index === 0 ? (
                <Link href="/" className="inline-flex" aria-label="Vestiqo — strona główna">
                  <BrandLogo variant="full" className="h-7 w-auto" />
                </Link>
              ) : (
                <h3 className="text-sm font-semibold text-[hsl(var(--brand-navy))]">
                  {column.title}
                </h3>
              )}

              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className={cn(
            'mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6',
            'md:flex-row md:items-center',
          )}
        >
          <p className="text-center text-sm text-muted-foreground md:text-left">
            {footerTagline}
          </p>
          <p className="text-xs text-muted-foreground">© {year} Vestiqo</p>
        </div>
      </div>
    </footer>
  );
}
