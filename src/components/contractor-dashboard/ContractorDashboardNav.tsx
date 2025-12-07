"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../ui/utils';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', href: '/contractor-dashboard/dashboard' },
  { id: 'applications', label: 'Moje aplikacje', href: '/contractor-dashboard/applications' },
  { id: 'projects', label: 'Projekty', href: '/contractor-dashboard/projects' },
  { id: 'ratings', label: 'Oceny', href: '/contractor-dashboard/ratings' },
  { id: 'pricing', label: 'Cennik', href: '/contractor-dashboard/pricing' },
];

export function ContractorDashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.id === 'dashboard' && (pathname === '/contractor-dashboard' || pathname === '/contractor-dashboard/'));
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

