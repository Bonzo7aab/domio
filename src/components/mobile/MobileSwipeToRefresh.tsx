import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface MobileSwipeToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: React.ReactNode;
  threshold?: number;
}

export const MobileSwipeToRefresh: React.FC<MobileSwipeToRefreshProps> = ({
  onRefresh,
  isRefreshing,
  children,
  threshold = 60
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, threshold * 1.5);
      setPullDistance(distance);
      setCanRefresh(distance >= threshold);
    }
  };

  const handleTouchEnd = async () => {
    setIsDragging(false);
    
    if (canRefresh && !isRefreshing) {
      await onRefresh();
    }
    
    setPullDistance(0);
    setCanRefresh(false);
  };

  const refreshIconRotation = isRefreshing ? 'animate-spin' : canRefresh ? 'rotate-180' : '';
  const refreshOpacity = pullDistance > 0 ? Math.min(pullDistance / threshold, 1) : 0;

  return (
    <div 
      ref={containerRef}
      className="mobile-swipe-refresh relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: refreshOpacity
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-lg border">
          <RefreshCw 
            className={`h-5 w-5 text-primary transition-transform duration-200 ${refreshIconRotation}`} 
          />
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${Math.min(pullDistance, threshold)}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
};