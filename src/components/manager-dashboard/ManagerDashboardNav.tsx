"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../ui/utils';

const tabs = [
  { id: 'overview', label: 'Przegląd', href: '/manager-dashboard/overview' },
  { id: 'zgloszenia', label: 'Zgłoszenia', href: '/manager-dashboard/zgloszenia' },
  { id: 'ocena', label: 'Ocena Zgłoszeń', href: '/manager-dashboard/ocena-zgloszen' },
  { id: 'contractors', label: 'Wykonawcy', href: '/manager-dashboard/contractors' },
];

export function ManagerDashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.id === 'overview' &&
                (pathname === '/manager-dashboard' || pathname === '/manager-dashboard/')) ||
              (tab.id === 'zgloszenia' && pathname.startsWith('/manager-dashboard/zgloszenia')) ||
              (tab.id === 'ocena' && pathname.startsWith('/manager-dashboard/ocena-zgloszen')) ||
              (tab.id === 'contractors' && pathname.startsWith('/manager-dashboard/contractors'));
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors border-b-2",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
