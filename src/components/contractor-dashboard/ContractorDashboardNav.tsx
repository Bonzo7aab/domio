"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../ui/utils';

const tabs = [
  { id: 'offers', label: 'Moje Oferty', href: '/contractor-dashboard/applications' },
  { id: 'favorites', label: 'Ulubione Zgłoszenia', href: '/contractor-dashboard/favorites' },
  { id: 'ratings', label: 'Ocena Zgłoszeń', href: '/contractor-dashboard/ratings' },
  { id: 'services', label: 'Usługi', href: '/contractor-dashboard/pricing' },
];

export function ContractorDashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.id === 'favorites' &&
                pathname.startsWith('/contractor-dashboard/favorites')) ||
              (tab.id === 'offers' &&
                (pathname === '/contractor-dashboard' ||
                  pathname === '/contractor-dashboard/' ||
                  pathname === '/contractor-dashboard/dashboard'));
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
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

