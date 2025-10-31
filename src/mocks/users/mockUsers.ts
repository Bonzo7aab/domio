import { User } from '../../types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'zarzadca@test.pl',
    firstName: 'Jan',
    lastName: 'Kowalski',
    userType: 'manager',
    company: 'Zarząd Nieruchomości ABC',
    phone: '+48 123 456 789',
    isVerified: true,
    profileCompleted: true,
  },
  {
    id: '2', 
    email: 'wykonawca@test.pl',
    firstName: 'Maria',
    lastName: 'Nowak',
    userType: 'contractor',
    company: 'Firma Budowlana XYZ',
    phone: '+48 987 654 321',
    isVerified: true,
    profileCompleted: true,
  },
  {
    id: '3',
    email: 'nowy.zarzadca@test.pl',
    firstName: 'Anna',
    lastName: 'Nowacka',
    userType: 'manager',
    company: '',
    phone: '',
    isVerified: false,
    profileCompleted: false,
  },
  {
    id: '4', 
    email: 'nowy.wykonawca@test.pl',
    firstName: 'Piotr',
    lastName: 'Wiśniewski',
    userType: 'contractor',
    company: '',
    phone: '',
    isVerified: false,
    profileCompleted: false,
  }
];

// Helper functions for working with user data
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email === email);
};

export const getUsersByType = (userType: User['userType']): User[] => {
  return mockUsers.filter(user => user.userType === userType);
};

export const getVerifiedUsers = (): User[] => {
  return mockUsers.filter(user => user.isVerified);
};

export const getUsersWithCompletedProfiles = (): User[] => {
  return mockUsers.filter(user => user.profileCompleted);
};
