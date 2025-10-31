export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'manager' | 'contractor';
  company: string;
  phone: string;
  isVerified: boolean;
  profileCompleted: boolean;
}

export type UserType = 'manager' | 'contractor';
