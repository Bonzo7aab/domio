"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../ui/utils';

const tabs = [
  { id: 'overview', label: 'Przegląd', href: '/manager-dashboard/overview' },
  { id: 'jobs', label: 'Zlecenia', href: '/manager-dashboard/jobs' },
  { id: 'tenders', label: 'Przetargi', href: '/manager-dashboard/tenders' },
  { id: 'properties', label: 'Nieruchomości', href: '/manager-dashboard/properties' },
  { id: 'contractors', label: 'Wykonawcy', href: '/manager-dashboard/contractors' },
];

export function ManagerDashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.id === 'overview' && (pathname === '/manager-dashboard' || pathname === '/manager-dashboard/'));
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
