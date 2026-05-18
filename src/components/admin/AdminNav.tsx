'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, FileWarning, Building2, Settings } from 'lucide-react';
import { cn } from '../ui/utils';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/verification', label: 'Weryfikacja', icon: ClipboardCheck },
  { href: '/admin/offers', label: 'Oferty wykonawców', icon: FileWarning },
  { href: '/admin/listings', label: 'Zgłoszenia zarządców', icon: Building2 },
  { href: '/admin/settings', label: 'Ustawienia', icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
