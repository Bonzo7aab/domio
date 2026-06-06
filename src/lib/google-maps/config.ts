export const googleMapsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry', 'marker'] as const,
  language: 'pl',
  region: 'PL',
};

export const mapOptions = {
  zoom: 11, // District-level view
  center: { lat: 52.1394, lng: 21.0458 }, // Ursynów, Warsaw
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Utility function to lighten a hex color by 2 shades
export const lightenColor = (hex: string, percent: number = 30): string => {
  // Remove # if present
  const color = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Lighten by increasing RGB values
  const lighten = (value: number) => Math.min(255, Math.round(value + (255 - value) * (percent / 100)));
  
  const newR = lighten(r);
  const newG = lighten(g);
  const newB = lighten(b);
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Marker colors - Priority determines background, job type determines icon
export const markerColors = {
  // Priority background colors
  priority: {
    low: '#10b981', // emerald-500 - green background
    medium: '#3b82f6', // blue-500 - blue background
    high: '#ef4444', // red-500 - red background
  },
  // Job type icon colors
  job: {
    glyphColor: '#3b82f6', // blue icon color for jobs
  },
  tender: {
    glyphColor: '#f97316', // orange icon color for tenders
  },
  // Selected state
  selected: {
    background: '#3b82f6', // blue-500 - blue for selected state
    borderColor: '#3b82f6', // Same as background (no visible border)
    glyphColor: '#ffffff',
  },
  // Legacy support
  default: {
    background: '#3b82f6', // blue
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
  urgent: {
    background: '#dc2626', // dark red
    borderColor: '#ffffff',
    glyphColor: '#ffffff',
  },
};

// SVG glyph cache - cache SVG elements by postType + backgroundColor combination
const glyphCache = new Map<string, SVGSVGElement>();

// Helper function to clone SVG element (required for reuse)
const cloneSVG = (svg: SVGSVGElement): SVGSVGElement => {
  return svg.cloneNode(true) as SVGSVGElement;
};

function appendMarkerStrokePath(
  svg: SVGSVGElement,
  d: string,
  backgroundColor: string,
  strokeWidth = '2',
): void {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#ffffff');
  path.setAttribute('stroke', backgroundColor);
  path.setAttribute('stroke-width', strokeWidth);
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
}

/** Lucide FileSearch — contest marker glyph (commercially usable). */
function appendFileSearchGlyph(svg: SVGSVGElement, backgroundColor: string): void {
  appendMarkerStrokePath(svg, 'M14 2v4a2 2 0 0 0 2 2h4', backgroundColor);
  appendMarkerStrokePath(
    svg,
    'M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 .268 1Z',
    backgroundColor,
  );
  appendMarkerStrokePath(svg, 'm9 13-2.5 2.5', backgroundColor);
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '11.5');
  circle.setAttribute('cy', '11.5');
  circle.setAttribute('r', '2.5');
  circle.setAttribute('fill', '#ffffff');
  circle.setAttribute('stroke', backgroundColor);
  circle.setAttribute('stroke-width', '2');
  svg.appendChild(circle);
}

export function getContestMarkerIconSvg(strokeColor: string, size = 14): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 .268 1Z"/><path d="m9 13-2.5 2.5"/><circle cx="11.5" cy="11.5" r="2.5"/></svg>`;
}

// Marker glyphs/icons for job types
// Returns SVG element for use in Google Maps PinElement glyph
// Icons are white filled with colored outline, placed directly on marker background
// Uses caching to avoid recreating SVG elements for the same postType + backgroundColor combination
export const createMarkerGlyph = (postType: 'job' | 'tender', backgroundColor: string): SVGSVGElement => {
  // Create cache key
  const cacheKey = `${postType}-${backgroundColor}`;
  
  // Check cache first
  const cached = glyphCache.get(cacheKey);
  if (cached) {
    // Clone the cached SVG to avoid DOM node reuse issues
    return cloneSVG(cached);
  }

  // Create new SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.style.width = '28px';
  svg.style.height = '28px';
  svg.style.display = 'block';

  // OPD-68: FileSearch icon for contests (replaces wrench/gavel on map)
  appendFileSearchGlyph(svg, backgroundColor);

  // Cache the SVG element
  glyphCache.set(cacheKey, svg);
  
  // Return a clone to avoid DOM node reuse issues
  return cloneSVG(svg);
};
