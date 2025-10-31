# Google Maps Troubleshooting Guide

## Quick Checklist

If the map is not displaying, check these items in order:

### 1. API Key Configuration ⚠️ MOST COMMON ISSUE
- [ ] `.env.local` file exists in project root
- [ ] File contains: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key`
- [ ] API key is NOT the placeholder text `your_google_maps_api_key_here`
- [ ] Dev server was restarted after adding the key

**To verify:**
```bash
# Check if .env.local exists and has a key
cat .env.local | grep NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### 2. Google Cloud Platform Setup
- [ ] Google Maps JavaScript API is enabled
- [ ] Geocoding API is enabled
- [ ] Places API is enabled (optional)
- [ ] API key has proper restrictions (localhost:3000 for development)
- [ ] Billing is enabled on your Google Cloud project

### 3. Jobs Data
- [ ] Jobs are being loaded from database
- [ ] Jobs have valid `lat` and `lng` coordinates
- [ ] At least one job exists to display

**To verify:** Open browser console and look for:
```
📊 Loaded jobs for map from database: X
```

### 4. Development Environment
- [ ] Dev server is running (`npm run dev`)
- [ ] No console errors in browser
- [ ] Page is loaded at http://localhost:3000

## Debug Information Panel

In development mode, you should see a debug info panel in the bottom-right corner showing:
- API Key status (✅ Valid or ❌ Missing)
- Number of jobs loaded
- Number of markers
- Jobs with coordinates
- Map center and zoom level

If you don't see this panel, the map component may not be rendering at all.

## Common Issues and Solutions

### Issue: "Map disappeared after integration"
**Cause:** Jobs prop was not being passed to the map component
**Solution:** ✅ FIXED - Jobs are now loaded in parent component and passed to map

### Issue: "Can't see map, blank space instead"
**Causes:**
1. Missing or invalid API key
2. No jobs with coordinates
3. Google Maps API not loaded

**Solutions:**
1. Add valid API key to `.env.local`
2. Ensure jobs in database have lat/lng fields
3. Check browser console for loading errors

### Issue: "Map shows but no markers"
**Causes:**
1. Jobs array is empty
2. Jobs don't have lat/lng coordinates
3. Markers are filtered out by location radius

**Solutions:**
1. Check debug panel for "Jobs loaded" count
2. Verify database jobs have location coordinates
3. Disable location filtering or increase radius

### Issue: "Markers not clickable"
**Cause:** z-index or overlay issues
**Solution:** Check that map controls don't overlap markers

### Issue: "API key error in console"
**Causes:**
1. Invalid API key
2. API not enabled in Google Cloud
3. Domain restrictions blocking localhost

**Solutions:**
1. Generate new API key
2. Enable required APIs
3. Add localhost:3000 to allowed domains

## Verification Steps

### Step 1: Check API Key
```bash
node setup-google-maps.js
```
Should show: `✅ Google Maps API key appears to be configured`

### Step 2: Check Jobs Loading
Open browser console, you should see:
```
📊 Loaded jobs for map from database: X
```

### Step 3: Check Map Rendering
In browser dev tools:
- Element inspector should show `<div>` with Google Maps iframe
- Console should not show "google is not defined" errors
- Network tab should show requests to maps.googleapis.com

### Step 4: Check Debug Panel
Look at debug info panel (bottom-right in dev mode):
- API Key: ✅ Valid
- Jobs loaded: > 0
- Markers: > 0
- Jobs with coords: > 0

## Manual Testing

1. **Navigate to home page** → http://localhost:3000
2. **Look for map on right side** → Should see Google Maps interface
3. **Check for markers** → Blue pins for jobs, red for urgent
4. **Click a marker** → Should select the job
5. **Hover over job in list** → Marker should highlight

## Getting Help

If the map still doesn't work after checking all items:

1. **Check browser console** for error messages
2. **Review the debug panel** data
3. **Check Network tab** for failed API requests
4. **Verify API key** works in Google Cloud Console
5. **Clear browser cache** and hard reload (Cmd+Shift+R)

## Files Modified for Map Integration

- `src/app/page.tsx` - Added jobs loading and prop passing
- `src/components/EnhancedMapViewGoogleMaps.tsx` - Map component
- `src/components/GoogleMap.tsx` - Core Google Maps wrapper
- `src/lib/google-maps/config.ts` - Configuration
- `src/lib/google-maps/geocoding.ts` - Location utilities
- `.env.local` - API key storage

## Next Steps After Fixing

Once the map is working:
1. Remove debug panel (or it will auto-hide in production)
2. Add more jobs with location data
3. Test location-based filtering
4. Customize marker styles if needed
5. Add clustering for many markers (optional)

## Support Resources

- [Google Maps Setup Guide](./GOOGLE_MAPS_SETUP.md)
- [Integration Fix Details](./MAP_INTEGRATION_FIX.md)
- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com)
