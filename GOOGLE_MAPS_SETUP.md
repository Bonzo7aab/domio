# Google Maps Integration Setup

This document provides step-by-step instructions for setting up Google Maps integration in your Next.js application.

## 🚀 Quick Setup

**Option 1: Use the setup helper**
```bash
node setup-google-maps.js
```

**Option 2: Manual setup**
1. Create `.env.local` in your project root
2. Add your API key (see steps below)
3. Restart your dev server

## Prerequisites

1. Google Cloud Platform account
2. Google Maps API key with the following APIs enabled:
   - Maps JavaScript API
   - Geocoding API
   - Places API (optional, for enhanced location search)

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the required APIs:
   - Go to "APIs & Services" → "Library"
   - Search for and enable "Maps JavaScript API"
   - Search for and enable "Geocoding API"
   - Search for and enable "Places API" (optional)
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
5. Restrict your API key (recommended for production):
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domains:
     - `localhost:3000/*` (for development)
     - `yourdomain.com/*` (for production)
   - Under "API restrictions", select "Restrict key"
   - Choose the APIs you enabled above

## Step 2: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Google Maps API key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

3. Make sure `.env.local` is in your `.gitignore` file to keep your API key secure

## Step 3: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to a page that uses the map component
3. You should see a real Google Maps interface instead of the mock implementation

## Components Added

### GoogleMap Component (`src/components/GoogleMap.tsx`)
- Reusable Google Maps component
- Supports markers with different states (default, selected, urgent)
- Handles loading and error states
- Responsive design

### EnhancedMapViewGoogleMaps Component (`src/components/EnhancedMapViewGoogleMaps.tsx`)
- Enhanced version of the existing map view with real Google Maps
- Maintains all existing functionality (filtering, clustering, location services)
- Better performance and user experience

### Geocoding Utilities (`src/lib/google-maps/geocoding.ts`)
- Convert addresses to coordinates
- Reverse geocoding (coordinates to addresses)
- Distance calculations
- Browser geolocation integration

### Configuration (`src/lib/google-maps/config.ts`)
- Centralized Google Maps configuration
- Custom map styles
- Marker icon definitions

## Usage Example

```tsx
import { EnhancedMapViewGoogleMaps } from '@/components/EnhancedMapViewGoogleMaps';

function MyPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  return (
    <EnhancedMapViewGoogleMaps
      jobs={jobs}
      selectedJobId={selectedJobId}
      onJobSelect={setSelectedJobId}
      userLocation={userLocation}
      onLocationChange={setUserLocation}
      searchRadius={25}
      onRadiusChange={(radius) => setSearchRadius(radius)}
    />
  );
}
```

## Features

- ✅ Real Google Maps integration with **Advanced Markers API**
- ✅ Dynamic marker colors for different job types (blue, red for urgent)
- ✅ Scalable markers (selected markers are 20% larger)
- ✅ Location-based filtering
- ✅ Geocoding and reverse geocoding
- ✅ Responsive design
- ✅ Loading and error states
- ✅ Polish language support
- ✅ Browser geolocation
- ✅ City selection fallback

**Note:** This project uses the new Google Maps Advanced Markers API (introduced in 2024) instead of the deprecated legacy markers. See [ADVANCED_MARKERS_MIGRATION.md](./ADVANCED_MARKERS_MIGRATION.md) for details.

## Troubleshooting

### Map Not Loading
- Check if your API key is correct
- Verify that the required APIs are enabled
- Check browser console for errors
- Ensure your domain is added to API key restrictions

### "google is not defined" Error
- This error occurs when Google Maps API isn't loaded during server-side rendering
- The configuration has been updated to handle this automatically
- If you see this error, make sure you're using the latest version of the components

### Geocoding Not Working
- Make sure Geocoding API is enabled
- Check API key permissions
- Verify the address format is correct

### Performance Issues
- Consider implementing marker clustering for large datasets
- Use debouncing for search inputs
- Optimize marker rendering with React.memo if needed

## Next Steps

1. Replace the existing `EnhancedMapView` component with `EnhancedMapViewGoogleMaps`
2. Test all map functionality
3. Add any custom styling or features as needed
4. Deploy to production with proper API key restrictions
