/**
 * Test configuration constants
 */

// Test user email prefix - all test users will have emails starting with this
export const TEST_USER_PREFIX = 'test-playwright-';

// Test user credentials
export const TEST_USERS = {
  contractor: {
    email: `${TEST_USER_PREFIX}contractor-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Contractor',
    phone: '+48123456789',
    userType: 'contractor' as const,
  },
  manager: {
    email: `${TEST_USER_PREFIX}manager-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Manager',
    phone: '+48123456789',
    userType: 'manager' as const,
  },
};

// Route paths
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  contractorDashboard: '/contractor-dashboard',
  managerDashboard: '/manager-dashboard',
  managerOrders: '/manager-dashboard/zamowienia',
  contractorOrders: '/contractor-dashboard/zamowienia',
  account: '/account',
  postJob: '/post-job',
  tenderCreation: '/tender-creation',
} as const;

// Test timeouts (in milliseconds)
export const TIMEOUTS = {
  navigation: 10000,
  api: 5000,
  element: 5000,
} as const;



