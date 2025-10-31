/**
 * Centralized configuration for data source selection (Mock vs Database)
 * 
 * Priority hierarchy:
 * 1. localStorage (urbi-testing-settings.mockData) - UI control via TestingModeManager
 * 2. Cookie (use_mocks) - Runtime override
 * 3. Environment variable (NEXT_PUBLIC_USE_MOCKS) - Default fallback
 */

export interface DataSourceConfig {
  useMockData: boolean;
  source: 'localStorage' | 'cookie' | 'env' | 'default';
}

/**
 * Determines whether to use mock data based on hierarchical configuration
 * @returns boolean indicating if mock data should be used
 */
export function shouldUseMockData(): boolean {
  // Check browser environment
  if (typeof window !== 'undefined') {
    // 1. Check localStorage (TestingModeManager)
    try {
      const settings = localStorage.getItem('urbi-testing-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.mockData !== undefined) {
          return parsed.mockData;
        }
      }
    } catch (e) {
      console.warn('Failed to read localStorage settings:', e);
    }

    // 2. Check cookie
    try {
      const cookies = document.cookie.split('; ');
      const mockCookie = cookies.find(row => row.startsWith('use_mocks='));
      if (mockCookie) {
        const cookieValue = mockCookie.split('=')[1];
        return cookieValue === 'true';
      }
    } catch (e) {
      console.warn('Failed to read cookie:', e);
    }
  }

  // 3. Fallback to environment variable
  const envValue = process.env.NEXT_PUBLIC_USE_MOCKS;
  if (envValue !== undefined) {
    return envValue === 'true';
  }

  // 4. Default to database (false)
  return false;
}

/**
 * Get detailed configuration about current data source
 * @returns DataSourceConfig with useMockData flag and source information
 */
export function getDataSourceConfig(): DataSourceConfig {
  // Check browser environment
  if (typeof window !== 'undefined') {
    // 1. Check localStorage (TestingModeManager)
    try {
      const settings = localStorage.getItem('urbi-testing-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.mockData !== undefined) {
          return {
            useMockData: parsed.mockData,
            source: 'localStorage'
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read localStorage settings:', e);
    }

    // 2. Check cookie
    try {
      const cookies = document.cookie.split('; ');
      const mockCookie = cookies.find(row => row.startsWith('use_mocks='));
      if (mockCookie) {
        const cookieValue = mockCookie.split('=')[1];
        return {
          useMockData: cookieValue === 'true',
          source: 'cookie'
        };
      }
    } catch (e) {
      console.warn('Failed to read cookie:', e);
    }
  }

  // 3. Fallback to environment variable
  const envValue = process.env.NEXT_PUBLIC_USE_MOCKS;
  if (envValue !== undefined) {
    return {
      useMockData: envValue === 'true',
      source: 'env'
    };
  }

  // 4. Default to database (false)
  return {
    useMockData: false,
    source: 'default'
  };
}

/**
 * Set runtime cookie to override data source
 * @param useMockData boolean to enable/disable mock data
 * @param maxAgeInDays number of days for cookie to persist (default: 30)
 */
export function setMockDataCookie(useMockData: boolean, maxAgeInDays: number = 30): void {
  if (typeof window === 'undefined') {
    console.warn('Cannot set cookie in server environment');
    return;
  }
  
  const maxAge = maxAgeInDays * 24 * 60 * 60; // Convert to seconds
  document.cookie = `use_mocks=${useMockData}; max-age=${maxAge}; path=/`;
}

/**
 * Clear the use_mocks cookie to fall back to env var or localStorage
 */
export function clearMockDataCookie(): void {
  if (typeof window === 'undefined') {
    console.warn('Cannot clear cookie in server environment');
    return;
  }
  
  document.cookie = 'use_mocks=; max-age=0; path=/';
}

