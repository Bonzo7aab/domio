'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex flex-col md:flex-row items-center justify-between h-full gap-2 md:gap-4">
          {/* Brand */}
          <div className="flex items-center">
            <span className="text-sm font-semibold text-foreground">Domio</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <Link 
              href="/pricing" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cennik
            </Link>
            <Link 
              href="/contractors" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Wykonawcy
            </Link>
            <Link 
              href="/managers" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Zarządcy
            </Link>
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Polityka prywatności
            </Link>
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Regulamin
            </Link>
          </div>

          {/* Copyright */}
          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground">
              © 2024 Domio
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
