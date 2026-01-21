'use client';

import React, { useEffect, useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { Progress } from './ui/progress';

export function NavigationProgressBar() {
  const { isNavigating } = useNavigation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isNavigating) {
      // Reset and show progress bar
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsVisible(true);
      setProgress(0);
      /* eslint-enable react-hooks/set-state-in-effect */

      // Clear any existing intervals/timeouts
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      // Animate progress: start at 30%, gradually increase to 90%
      let currentProgress = 30;
      setProgress(currentProgress);

      progressIntervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 15; // Random increment for realistic progress
        if (currentProgress >= 90) {
          currentProgress = 90;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
        setProgress(currentProgress);
      }, 200);
    } else {
      // Navigation completed - animate to 100% and fade out
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Complete the progress bar
      setProgress(100);

      // Fade out after a brief delay
      fadeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        // Reset progress after fade out completes
        setTimeout(() => {
          setProgress(0);
        }, 300);
      }, 300);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [isNavigating]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ pointerEvents: 'none' }}
    >
      <Progress 
        value={progress} 
        className="h-1 rounded-none"
      />
    </div>
  );
}
