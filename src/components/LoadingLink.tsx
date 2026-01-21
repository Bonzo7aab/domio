'use client';

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { useNavigation } from '../contexts/NavigationContext';

interface LoadingLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  [key: string]: unknown;
}

export function LoadingLink({ 
  children, 
  onClick, 
  ...props 
}: LoadingLinkProps) {
  const { startNavigation } = useNavigation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call custom onClick if provided
    onClick?.(e);
    
    // Start navigation loading indicator
    // Only if it's not a modifier key click (cmd/ctrl for new tab, etc.)
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      startNavigation();
    }
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
