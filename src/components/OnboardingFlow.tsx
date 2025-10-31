import React, { useState } from 'react';
import { WelcomePage } from './WelcomePage';
import { ProfileCompletionWizard } from './ProfileCompletionWizard';
import { TutorialPage } from './TutorialPage';
import { useUserProfile } from '../contexts/AuthContext';
import { updateUserAction } from '../lib/auth/actions';

type OnboardingStep = 'welcome' | 'profile' | 'tutorial' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
  onBack?: () => void;
  onVerificationClick?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onBack, onVerificationClick }) => {
  const { user } = useUserProfile();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  // Check if user needs onboarding
  if (user?.profileCompleted) {
    onComplete();
    return null;
  }

  const handleWelcomeContinue = () => {
    setCurrentStep('profile');
  };

  const handleWelcomeTutorial = () => {
    // Mark onboarding as complete but profile as incomplete
    updateUserAction({ profile_completed: true });
    onComplete();
  };

  const handleProfileComplete = () => {
    setCurrentStep('tutorial');
  };

  const handleProfileBack = () => {
    setCurrentStep('welcome');
  };

  const handleTutorialComplete = () => {
    setCurrentStep('complete');
    // Small delay to show completion, then redirect
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleTutorialBack = () => {
    onComplete();
  };

  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomePage 
          onBack={onBack}
          onGetStarted={handleWelcomeContinue}
          onTutorial={handleWelcomeTutorial}
        />
      );

    case 'profile':
      return (
        <ProfileCompletionWizard 
          onComplete={handleProfileComplete}
          onBack={handleProfileBack}
          onVerificationClick={onVerificationClick}
        />
      );

    case 'tutorial':
      return (
        <TutorialPage 
          onBack={handleTutorialBack}
          onComplete={handleTutorialComplete}
        />
      );

    case 'complete':
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-success">Gotowe!</h2>
            <p className="text-lg text-muted-foreground">
              Twoje konto jest już skonfigurowane i gotowe do użycia.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};