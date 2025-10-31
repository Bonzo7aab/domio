// import React, { useState, useEffect } from 'react';
// import { MobileHeader } from '../components/mobile/MobileHeader';
// import { MobileBottomNav } from '../components/mobile/MobileBottomNav';
// import { MobileJobList } from '../components/mobile/MobileJobList';
// import { MobileJobDetails } from '../components/mobile/MobileJobDetails';
// import { MobileMapView } from '../components/mobile/MobileMapView';
// import { MobileProfile } from '../components/mobile/MobileProfile';
// import { MobileSearch } from '../components/mobile/MobileSearch';
// // import { MobileFilters } from '../components/mobile/MobileFilters';
// // import { MobileLoginPage } from '../components/mobile/MobileLoginPage';
// // import { MobileRegisterPage } from '../components/mobile/MobileRegisterPage';
// import { MobileUserTypeSelection } from '../components/mobile/MobileUserTypeSelection';
// // import { MobilePostJob } from '../components/mobile/MobilePostJob';
// // import { MobileManagerDashboard } from '../components/mobile/MobileManagerDashboard';
// // import { MobileContractorDashboard } from '../components/mobile/MobileContractorDashboard';
// import { MobileNotifications } from '../components/mobile/MobileNotifications';
// // import { MobilePricing } from '../components/mobile/MobilePricing';
// import { MobileSwipeToRefresh } from '../components/mobile/MobileSwipeToRefresh';
// import { MobileFab } from '../components/mobile/MobileFab';
// import { AuthProvider, useAuth } from '../contexts/AuthContext';
// import { Toaster } from '../components/ui/sonner';
// import { toast } from 'sonner';

// type MobileViewType = 
//   | 'home' 
//   | 'search' 
//   | 'map' 
//   | 'profile' 
//   | 'notifications'
//   | 'job-details'
//   | 'post-job'
//   | 'login'
//   | 'register'
//   | 'user-type-selection'
//   | 'manager-dashboard'
//   | 'contractor-dashboard'
//   | 'pricing'
//   | 'filters';

// const MobileMainApp: React.FC = () => {
//   const { user, isAuthenticated } = useAuth();
//   const [currentView, setCurrentView] = useState<MobileViewType>('home');
//   const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
//   const [selectedUserType, setSelectedUserType] = useState<'contractor' | 'manager' | null>(null);
//   const [showFilters, setShowFilters] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filters, setFilters] = useState<any>({});
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

//   // Navigation handlers
//   const handleBottomNavChange = (view: MobileViewType) => {
//     setCurrentView(view);
//   };

//   const handleJobSelect = (jobId: string) => {
//     setSelectedJobId(jobId);
//     setCurrentView('job-details');
//   };

//   const handleBackPress = () => {
//     if (currentView === 'job-details' || currentView === 'filters' || currentView === 'post-job') {
//       setCurrentView('home');
//       setSelectedJobId(null);
//     } else if (currentView === 'login' || currentView === 'register') {
//       if (selectedUserType) {
//         setSelectedUserType(null);
//         setCurrentView('user-type-selection');
//       } else {
//         setCurrentView('home');
//       }
//     } else if (currentView === 'user-type-selection') {
//       setCurrentView('home');
//     } else {
//       // Already on main view, maybe show exit confirmation
//       toast.info('Naciśnij ponownie aby wyjść');
//     }
//   };

//   const handleLoginClick = () => {
//     setCurrentView('user-type-selection');
//   };

//   const handleUserTypeSelect = (type: 'contractor' | 'manager', action: 'login' | 'register') => {
//     setSelectedUserType(type);
//     setCurrentView(action);
//   };

//   const handlePostJobClick = () => {
//     if (isAuthenticated && user?.userType === 'manager') {
//       setCurrentView('post-job');
//     } else {
//       setCurrentView('user-type-selection');
//     }
//   };

//   const handlePricingClick = () => {
//     setCurrentView('pricing');
//   };

//   const handleFiltersClick = () => {
//     setShowFilters(true);
//     setCurrentView('filters');
//   };

//   // Pull to refresh handler
//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     // Simulate API call
//     await new Promise(resolve => setTimeout(resolve, 1500));
//     setIsRefreshing(false);
//     toast.success('Odświeżono listę zleceń');
//   };

//   // Get user location on app start
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setUserLocation({
//             lat: position.coords.latitude,
//             lng: position.coords.longitude
//           });
//         },
//         (error) => {
//           console.log('Location permission denied');
//         }
//       );
//     }
//   }, []);

//   // Check if user needs onboarding
//   useEffect(() => {
//     if (isAuthenticated && user && !user.profileCompleted) {
//       // In mobile version, we might want to show a different onboarding
//       toast.info('Dokończ konfigurację profilu');
//     }
//   }, [isAuthenticated, user]);

//   // Render current view
//   const renderCurrentView = () => {
//     switch (currentView) {
//       case 'home':
//         return (
//           <MobileSwipeToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
//             <MobileJobList
//               onJobSelect={handleJobSelect}
//               onSearchFocus={() => setCurrentView('search')}
//               onFiltersClick={handleFiltersClick}
//               filters={filters}
//               userLocation={userLocation}
//             />
//           </MobileSwipeToRefresh>
//         );

//       case 'search':
//         return (
//           <MobileSearch
//             onBack={() => setCurrentView('home')}
//             onJobSelect={handleJobSelect}
//             searchQuery={searchQuery}
//             onSearchChange={setSearchQuery}
//           />
//         );

//       case 'map':
//         return (
//           <MobileMapView
//             onJobSelect={handleJobSelect}
//             userLocation={userLocation}
//             onLocationChange={setUserLocation}
//             filters={filters}
//           />
//         );

//       case 'notifications':
//         return (
//           <MobileNotifications
//             userType={user?.userType}
//             onJobSelect={handleJobSelect}
//           />
//         );

//       case 'profile':
//         if (!isAuthenticated) {
//           return (
//             <MobileProfile
//               onLoginClick={handleLoginClick}
//               onPricingClick={handlePricingClick}
//             />
//           );
//         }
//         return (
//           <MobileProfile
//             user={user ? {
//               id: user.id,
//               name: `${user.firstName} ${user.lastName}`,
//               email: user.email,
//               userType: user.userType,
//               avatar: user.avatar,
//               companyName: user.company,
//             } : undefined}
//             onLogout={() => {
//               setCurrentView('home');
//               toast.success('Wylogowano pomyślnie');
//             }}
//             onPricingClick={handlePricingClick}
//           />
//         );

//       case 'job-details':
//         return selectedJobId ? (
//           <MobileJobDetails
//             jobId={selectedJobId}
//             onBack={handleBackPress}
//             onApply={() => {
//               if (!isAuthenticated) {
//                 setCurrentView('user-type-selection');
//                 return;
//               }
              
//               if (user?.userType !== 'contractor') {
//                 toast.error('Tylko wykonawcy mogą składać oferty');
//                 return;
//               }
              
//               toast.success('Oferta została złożona!');
//             }}
//           />
//         ) : null;

//       case 'post-job':
//         return (
//           <div className="p-4">
//             <h2>Post Job - Not implemented</h2>
//             <button onClick={handleBackPress}>Back</button>
//           </div>
//         );

//       case 'user-type-selection':
//         return (
//           <MobileUserTypeSelection
//             onBack={handleBackPress}
//             onUserTypeSelect={handleUserTypeSelect}
//           />
//         );

//       case 'login':
//         return (
//           <MobileLoginPage
//             onBack={handleBackPress}
//             onRegisterClick={() => setCurrentView('register')}
//             userType={selectedUserType}
//             onSuccess={() => {
//               if (user?.userType === 'manager') {
//                 setCurrentView('manager-dashboard');
//               } else if (user?.userType === 'contractor') {
//                 setCurrentView('contractor-dashboard');
//               } else {
//                 setCurrentView('home');
//               }
//             }}
//           />
//         );

//       case 'register':
//         return (
//           <MobileRegisterPage
//             onBack={handleBackPress}
//             onLoginClick={() => setCurrentView('login')}
//             userType={selectedUserType}
//             onSuccess={() => {
//               setCurrentView('home');
//               toast.success('Konto zostało utworzone');
//             }}
//           />
//         );

//       case 'manager-dashboard':
//         return (
//           <MobileManagerDashboard
//             onBack={() => setCurrentView('profile')}
//             onPostJob={() => setCurrentView('post-job')}
//             onJobSelect={handleJobSelect}
//           />
//         );

//       case 'contractor-dashboard':
//         return (
//           <MobileContractorDashboard
//             onBack={() => setCurrentView('profile')}
//             onJobSelect={handleJobSelect}
//             onBrowseJobs={() => setCurrentView('home')}
//           />
//         );

//       case 'pricing':
//         return (
//           <MobilePricing
//             onBack={handleBackPress}
//             onRegister={(userType) => {
//               setSelectedUserType(userType);
//               setCurrentView('register');
//             }}
//           />
//         );

//       case 'filters':
//         return (
//           <MobileFilters
//             onBack={() => {
//               setShowFilters(false);
//               setCurrentView('home');
//             }}
//             onApplyFilters={(newFilters) => {
//               setFilters(newFilters);
//               setShowFilters(false);
//               setCurrentView('home');
//               toast.success('Filtry zostały zastosowane');
//             }}
//             currentFilters={filters}
//           />
//         );

//       default:
//         return null;
//     }
//   };

//   // Show dashboard views if authenticated and in specific modes
//   if (isAuthenticated && user?.userType === 'manager' && currentView === 'profile') {
//     setCurrentView('manager-dashboard');
//   }
//   if (isAuthenticated && user?.userType === 'contractor' && currentView === 'profile') {
//     setCurrentView('contractor-dashboard');
//   }

//   return (
//     <div className="mobile-app min-h-screen bg-background">
//       {/* Mobile Header - conditional rendering */}
//       {!['search', 'job-details', 'post-job', 'login', 'register', 'user-type-selection', 'filters', 'pricing'].includes(currentView) && (
//         <MobileHeader
//           title={currentView === 'home' ? 'Urbi.eu' : 
//                  currentView === 'map' ? 'Mapa zleceń' :
//                  currentView === 'notifications' ? 'Powiadomienia' :
//                  currentView === 'profile' ? 'Profil' :
//                  currentView === 'manager-dashboard' ? 'Panel zarządcy' :
//                  currentView === 'contractor-dashboard' ? 'Panel wykonawcy' : 'Urbi'}
//           showSearch={currentView === 'home'}
//           onSearchClick={() => setCurrentView('search')}
//           showNotifications={isAuthenticated}
//           notificationCount={3} // Mock count
//           onNotificationsClick={() => setCurrentView('notifications')}
//         />
//       )}

//       {/* Main Content */}
//       <div className={`flex-1 overflow-hidden ${
//         !['search', 'job-details', 'post-job', 'login', 'register', 'user-type-selection', 'filters', 'pricing'].includes(currentView) 
//           ? 'pb-16' // Space for bottom nav
//           : ''
//       }`}>
//         {renderCurrentView()}
//       </div>

//       {/* Floating Action Button */}
//       {currentView === 'home' && (
//         <MobileFab
//           icon={isAuthenticated && user?.userType === 'manager' ? 'plus' : 'briefcase'}
//           onClick={handlePostJobClick}
//           label={isAuthenticated && user?.userType === 'manager' ? 'Dodaj zlecenie' : 'Znajdź zlecenia'}
//         />
//       )}

//       {/* Bottom Navigation - conditional rendering */}
//       {!['job-details', 'post-job', 'login', 'register', 'user-type-selection', 'filters', 'pricing', 'search'].includes(currentView) && (
//         <MobileBottomNav
//           currentView={currentView}
//           onViewChange={handleBottomNavChange}
//           isAuthenticated={isAuthenticated}
//           userType={user?.userType}
//         />
//       )}
//     </div>
//   );
// };

// // Export the Mobile App wrapped with AuthProvider
// export default function MobileApp() {
//   return (
//     <AuthProvider>
//       <MobileMainApp />
//       <Toaster />
//     </AuthProvider>
//   );
// }