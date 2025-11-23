import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and basic info */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-foreground">Domio</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Platforma łącząca zarządców nieruchomości z wykwalifikowanymi wykonawcami
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <Link 
              href="/pricing" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cennik
            </Link>
            <Link 
              href="/contractors" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Wykonawcy
            </Link>
            <Link 
              href="/managers" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Zarządcy
            </Link>
            <Link 
              href="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Polityka prywatności
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Regulamin
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-xs text-muted-foreground">
              © 2024 Domio. Wszystkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
