# Advanced Markers Migration

## Overview

As of February 21st, 2024, Google Maps deprecated the legacy `google.maps.Marker` class in favor of the new `google.maps.marker.AdvancedMarkerElement` class. This project has been updated to use the new Advanced Markers API.

**Reference:** [Google Maps Advanced Markers Migration Guide](https://developers.google.com/maps/documentation/javascript/advanced-markers/migration?utm_source=devtools&utm_campaign=stable)

## What Changed

### 1. Marker Library Added
The marker library is now explicitly loaded:
```typescript
libraries: ['places', 'geometry', 'marker'] as const
```

### 2. Map ID Requirement
Advanced markers require a map ID during initialization:
```typescript
const newMap = new google.maps.Map(mapRef.current, {
  ...mapOptions,
  center,
  zoom,
  mapId: 'DOMIO_MAP_ID', // Required for advanced markers
});
```

### 3. Marker Creation Updated
**Before (Legacy Markers):**
```typescript
const marker = new google.maps.Marker({
  position: markerData.position,
  map,
  title: markerData.title,
  icon: {
    url: '/marker-icon.svg',
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 32),
  },
  zIndex: markerData.isSelected ? 1000 : 1,
});
```

**After (Advanced Markers):**
```typescript
const pinElement = new google.maps.marker.PinElement({
  background: '#3b82f6',
  borderColor: '#ffffff',
  glyphColor: '#ffffff',
  scale: 1,
});

const marker = new google.maps.marker.AdvancedMarkerElement({
  position: markerData.position,
  map,
  title: markerData.title,
  content: pinElement.element,
  zIndex: markerData.isSelected ? 1000 : 1,
});
```

### 4. Marker State Management
**Before:**
```typescript
const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([]);
mapMarkers.forEach(marker => marker.setMap(null));
```

**After:**
```typescript
const [mapMarkers, setMapMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
mapMarkers.forEach(marker => marker.map = null);
```

## Benefits of Advanced Markers

### 1. **Better Performance**
- Improved rendering performance
- More efficient memory usage
- Better handling of large numbers of markers

### 2. **Enhanced Customization**
- **Dynamic colors:** Change background, border, and glyph colors
- **Scalable pins:** Adjust marker size with the `scale` property
- **Custom content:** Use HTML and CSS for fully custom markers
- **Better accessibility:** Improved screen reader support

### 3. **Modern Features**
- Collision behavior control
- Altitude and 3D positioning
- Better z-index management
- Native support for marker clustering

## Current Implementation

### Marker Colors
We use three distinct marker styles:

```typescript
export const markerColors = {
  default: {
    background: '#3b82f6', // Blue for standard jobs
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
  selected: {
    background: '#ef4444', // Light red for selected jobs
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
  urgent: {
    background: '#dc2626', // Dark red for urgent jobs
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
};
```

### Dynamic Marker Scaling
Selected markers are scaled up by 20% for better visibility:
```typescript
scale: markerData.isSelected ? 1.2 : 1
```

### Event Handling
Event listeners work the same way:
```typescript
marker.addListener('click', () => {
  onMarkerClick(markerData.id);
});
```

## Future Enhancements

With Advanced Markers, we can now easily implement:

### 1. **HTML/CSS Markers**
Create fully custom markers with HTML:
```typescript
const markerContent = document.createElement('div');
markerContent.innerHTML = `
  <div class="custom-marker">
    <img src="/job-icon.png" />
    <span>${job.title}</span>
  </div>
`;

const marker = new google.maps.marker.AdvancedMarkerElement({
  position,
  map,
  content: markerContent,
});
```

### 2. **Marker Clustering**
Group nearby markers automatically:
```typescript
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const clusterer = new MarkerClusterer({
  map,
  markers: advancedMarkers,
});
```

### 3. **Collision Behavior**
Control how markers behave when they overlap:
```typescript
const marker = new google.maps.marker.AdvancedMarkerElement({
  position,
  map,
  collisionBehavior: google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
});
```

### 4. **3D Altitude**
Position markers at specific altitudes:
```typescript
const marker = new google.maps.marker.AdvancedMarkerElement({
  position: { lat, lng, altitude: 100 },
  map,
});
```

## Files Modified

- `src/components/GoogleMap.tsx` - Updated to use AdvancedMarkerElement
- `src/lib/google-maps/config.ts` - Added marker library and color configuration
- `package.json` - No changes needed (wrapper already supports advanced markers)

## Testing

The implementation has been tested and verified:
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Markers display correctly
- ✅ Click events work
- ✅ Color coding works (blue, red for urgent, lighter red for selected)
- ✅ Scale effect works for selected markers

## Backwards Compatibility

The old marker icons (`/marker-icon.svg`, `/marker-selected.svg`, `/marker-urgent.svg`) are no longer used but have been kept in the repository for reference. Advanced markers use the PinElement API for consistent, scalable pins.

## Resources

- [Advanced Markers Overview](https://developers.google.com/maps/documentation/javascript/markers)
- [Migration Guide](https://developers.google.com/maps/documentation/javascript/advanced-markers/migration)
- [PinElement API](https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#PinElement)
- [AdvancedMarkerElement API](https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#AdvancedMarkerElement)
- [Basic Marker Customization](https://developers.google.com/maps/documentation/javascript/advanced-markers/basic-customization)

## Support

If you encounter any issues with the new markers:
1. Ensure your Google Maps API key is valid
2. Verify the marker library is loaded
3. Check that your map has a valid map ID
4. Review browser console for any errors
5. Consult the [troubleshooting guide](./MAP_TROUBLESHOOTING.md)
