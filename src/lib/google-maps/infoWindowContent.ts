import { Job } from "../../types";

/**
 * Generates rich HTML content for Google Maps info windows
 * Styled with project's color palette and design system
 */
export function generateInfoWindowContent(jobData?: Job, isSmallMap: boolean = false): string {
  if (!jobData) {
    return '<div class="p-3 text-sm text-gray-600">Brak danych</div>';
  }

  const {
    id,
    title,
    company,
    location,
    salary,
    description,
    skills = [],
    applications,
    postedTime,
    urgent,
    verified,
    category,
    companyInfo,
    postType,
  } = jobData;
  
  const companyLogo = companyInfo?.logo_url || undefined;
  
  // Rating is not part of Job type, so we'll skip it
  const rating = undefined;

  const isTender = postType === 'tender';
  const displaySkills = skills.slice(0, 3);
  const hasMoreSkills = skills.length > 3;

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Convert location to string if it's an object
  const locationString = typeof location === 'string' 
    ? location 
    : location && typeof location === 'object' && 'city' in location
      ? location.city + (location.sublocality_level_1 ? `, ${location.sublocality_level_1}` : '')
      : '';
  
  const safeTitle = escapeHtml(title);
  const safeCompany = escapeHtml(company);
  const safeLocation = escapeHtml(locationString);
  const safeDescription = escapeHtml(description);
  const safeCategory = typeof category === 'string' ? escapeHtml(category) : escapeHtml(category?.name || 'Inne');

  // If small map, show compact version
  if (isSmallMap) {
    return generateCompactInfoWindow(jobData, escapeHtml);
  }

  return `
    <div class="info-window-content" data-job-id="${id}" style="cursor: pointer; width: 100%; max-width: 360px;">
      <div style="
        padding: 16px;
        background: white;
        // border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Header Section -->
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
          ${companyLogo ? `
            <div style="flex-shrink: 0;">
              <img 
                src="${companyLogo}" 
                alt="${safeCompany} logo"
                style="
                  width: 40px;
                  height: 40px;
                  border-radius: 8px;
                  object-fit: cover;
                  background: hsl(210 40% 98%);
                "
                onerror="this.style.display='none'"
              />
            </div>
          ` : ''}
          
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;">
              ${isTender ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(32 95% 44%)" stroke-width="2">
                  <path d="M17 10L12 5 7 10M17 19H7a4 4 0 01-4-4V8a4 4 0 014-4h10a4 4 0 014 4v7a4 4 0 01-4 4z"/>
                </svg>
              ` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(221 83% 40%)" stroke-width="2">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
              `}
              ${urgent ? `
                <span style="
                  display: inline-flex;
                  padding: 2px 8px;
                  font-size: 10px;
                  font-weight: 600;
                  border-radius: 6px;
                  background: hsl(0 72% 51%);
                  color: white;
                  text-transform: uppercase;
                  letter-spacing: 0.025em;
                ">Pilne</span>
              ` : ''}
              ${verified ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="hsl(221 83% 40%)" style="flex-shrink: 0;">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              ` : ''}
            </div>
            
            <h3 style="
              font-size: 14px;
              font-weight: 600;
              color: hsl(215 25% 17%);
              margin: 0 0 8px 0;
              line-height: 1.4;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            ">${safeTitle}</h3>
          </div>
        </div>

        <!-- Meta Information -->
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
          font-size: 12px;
          color: hsl(215 16% 47%);
        ">
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>${safeLocation}</span>
          </div>
          
          <span style="
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 500;
            border-radius: 6px;
            background: hsl(210 40% 96%);
            color: hsl(221 83% 40%);
            border: 1px solid hsl(214 32% 91%);
          ">${safeCategory}</span>
        </div>

        <!-- Company -->
        <div style="
          font-size: 12px;
          color: hsl(215 16% 47%);
          margin-bottom: 10px;
          font-weight: 500;
        ">${safeCompany}</div>

        <!-- Description -->
        <p style="
          font-size: 13px;
          color: hsl(215 25% 27%);
          margin: 0 0 12px 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">${safeDescription}</p>

        <!-- Skills -->
        ${displaySkills.length > 0 ? `
          <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
          ">
            ${displaySkills.map(skill => `
              <span style="
                padding: 4px 8px;
                font-size: 11px;
                border-radius: 6px;
                background: white;
                color: hsl(215 25% 27%);
                border: 1px solid hsl(214 32% 91%);
              ">${escapeHtml(skill)}</span>
            `).join('')}
            ${hasMoreSkills ? `
              <span style="
                padding: 4px 8px;
                font-size: 11px;
                border-radius: 6px;
                background: white;
                color: hsl(215 16% 47%);
                border: 1px solid hsl(214 32% 91%);
              ">+${skills.length - 3} więcej</span>
            ` : ''}
          </div>
        ` : ''}

        <!-- Footer Stats -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid hsl(214 32% 91%);
          font-size: 12px;
        ">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="
              font-weight: 600;
              color: hsl(160 84% 39%);
              font-size: 13px;
            ">${salary}</div>
            
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              color: hsl(215 16% 47%);
            ">
              <div style="display: flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <span>${applications}</span>
              </div>
              
              ${rating ? `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="color: hsl(32 95% 44%);">★</span>
                  <span>${rating.toFixed(1)}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div style="
            font-size: 11px;
            color: hsl(215 16% 47%);
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${postedTime}</span>
          </div>
        </div>

        <!-- Click hint -->
        <div style="
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid hsl(214 32% 91%);
          text-align: center;
          font-size: 11px;
          color: hsl(221 83% 40%);
          font-weight: 500;
        ">Kliknij, aby zobaczyć szczegóły</div>
      </div>
    </div>
  `;
}

/**
 * Mobile drawer content - optimized for mobile with larger text and more spacing
 */
export function generateMobileDrawerContent(jobData: Job): string {
  if (!jobData) {
    return '<div class="p-6 text-base text-gray-600">Brak danych</div>';
  }

  const {
    id,
    title,
    company,
    location,
    salary,
    description,
    skills = [],
    applications,
    postedTime,
    urgent,
    verified,
    category,
    companyInfo,
    postType,
  } = jobData;
  
  const companyLogo = companyInfo?.logo_url || undefined;
  
  const isTender = postType === 'tender';
  const displaySkills = skills.slice(0, 3);
  const hasMoreSkills = skills.length > 3;

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Convert location to string if it's an object
  const locationString = typeof location === 'string' 
    ? location 
    : location && typeof location === 'object' && 'city' in location
      ? location.city + (location.sublocality_level_1 ? `, ${location.sublocality_level_1}` : '')
      : '';
  
  const safeTitle = escapeHtml(title);
  const safeCompany = escapeHtml(company);
  const safeLocation = escapeHtml(locationString);
  const safeDescription = escapeHtml(description);
  const safeCategory = typeof category === 'string' ? escapeHtml(category) : escapeHtml(category?.name || 'Inne');

  return `
    <div class="info-window-content" data-job-id="${id}" style="cursor: pointer; width: 100%;">
      <div style="
        padding: 0;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Header Section -->
        <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
          ${companyLogo ? `
            <div style="flex-shrink: 0;">
              <img 
                src="${companyLogo}" 
                alt="${safeCompany} logo"
                style="
                  width: 56px;
                  height: 56px;
                  border-radius: 12px;
                  object-fit: cover;
                  background: hsl(210 40% 98%);
                "
                onerror="this.style.display='none'"
              />
            </div>
          ` : ''}
          
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
              ${isTender ? `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(32 95% 44%)" stroke-width="2.5">
                  <path d="M17 10L12 5 7 10M17 19H7a4 4 0 01-4-4V8a4 4 0 014-4h10a4 4 0 014 4v7a4 4 0 01-4 4z"/>
                </svg>
              ` : `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(221 83% 40%)" stroke-width="2.5">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
              `}
              ${urgent ? `
                <span style="
                  display: inline-flex;
                  padding: 4px 12px;
                  font-size: 12px;
                  font-weight: 700;
                  border-radius: 8px;
                  background: hsl(0 72% 51%);
                  color: white;
                  text-transform: uppercase;
                  letter-spacing: 0.025em;
                ">Pilne</span>
              ` : ''}
              ${verified ? `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="hsl(221 83% 40%)" style="flex-shrink: 0;">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              ` : ''}
            </div>
            
            <h3 style="
              font-size: 22px;
              font-weight: 700;
              color: hsl(215 25% 17%);
              margin: 0 0 12px 0;
              line-height: 1.4;
            ">${safeTitle}</h3>
          </div>
        </div>

        <!-- Meta Information -->
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          font-size: 15px;
          color: hsl(215 16% 47%);
        ">
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>${safeLocation}</span>
          </div>
          
          <span style="
            padding: 4px 12px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            background: hsl(210 40% 96%);
            color: hsl(221 83% 40%);
            border: 1px solid hsl(214 32% 91%);
          ">${safeCategory}</span>
        </div>

        <!-- Company -->
        <div style="
          font-size: 16px;
          color: hsl(215 16% 47%);
          margin-bottom: 20px;
          font-weight: 600;
        ">${safeCompany}</div>

        <!-- Description -->
        ${description ? `
          <p style="
            font-size: 15px;
            color: hsl(215 25% 27%);
            margin: 0 0 20px 0;
            line-height: 1.6;
          ">${safeDescription}</p>
        ` : ''}

        <!-- Skills -->
        ${displaySkills.length > 0 ? `
          <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
          ">
            ${displaySkills.map(skill => `
              <span style="
                padding: 6px 14px;
                font-size: 13px;
                border-radius: 8px;
                background: white;
                color: hsl(215 25% 27%);
                border: 1px solid hsl(214 32% 91%);
              ">${escapeHtml(skill)}</span>
            `).join('')}
            ${hasMoreSkills ? `
              <span style="
                padding: 6px 14px;
                font-size: 13px;
                border-radius: 8px;
                background: white;
                color: hsl(215 16% 47%);
                border: 1px solid hsl(214 32% 91%);
              ">+${skills.length - 3} więcej</span>
            ` : ''}
          </div>
        ` : ''}

        <!-- Footer Stats -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 20px;
          border-top: 1px solid hsl(214 32% 91%);
          font-size: 15px;
        ">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="
              font-weight: 700;
              color: hsl(160 84% 39%);
              font-size: 18px;
            ">${salary}</div>
            
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              color: hsl(215 16% 47%);
            ">
              <div style="display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <span>Aplikacje: ${applications}</span>
              </div>
            </div>
          </div>
          
          <div style="
            font-size: 14px;
            color: hsl(215 16% 47%);
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${postedTime}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Compact info window for small map - shows only essential information
 */
function generateCompactInfoWindow(jobData: Job, escapeHtml: (text: string) => string): string {
  const {
    id,
    title,
    company,
    location,
    salary,
    urgent,
    verified,
    postType,
  } = jobData;

  // Convert location to string if it's an object
  const locationString = typeof location === 'string' 
    ? location 
    : location && typeof location === 'object' && 'city' in location
      ? location.city + (location.sublocality_level_1 ? `, ${location.sublocality_level_1}` : '')
      : '';

  const isTender = postType === 'tender';
  const safeTitle = escapeHtml(title);
  const safeCompany = escapeHtml(company);
  const safeLocation = escapeHtml(locationString);

  return `
    <div class="info-window-content" data-job-id="${id}" style="cursor: pointer; width: 100%; max-width: 240px;">
      <div style="
        padding: 12px;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Header with badges -->
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
          ${isTender ? `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(32 95% 44%)" stroke-width="2.5">
              <path d="M17 10L12 5 7 10M17 19H7a4 4 0 01-4-4V8a4 4 0 014-4h10a4 4 0 014 4v7a4 4 0 01-4 4z"/>
            </svg>
          ` : `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(221 83% 40%)" stroke-width="2.5">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
          `}
          ${urgent ? `
            <span style="
              display: inline-flex;
              padding: 2px 6px;
              font-size: 9px;
              font-weight: 700;
              border-radius: 4px;
              background: hsl(0 72% 51%);
              color: white;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            ">Pilne</span>
          ` : ''}
          ${verified ? `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="hsl(221 83% 40%)">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          ` : ''}
        </div>

        <!-- Title (truncated) -->
        <h3 style="
          font-size: 13px;
          font-weight: 600;
          color: hsl(215 25% 17%);
          margin: 0 0 6px 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">${safeTitle}</h3>

        <!-- Company (truncated) -->
        <div style="
          font-size: 11px;
          color: hsl(215 16% 47%);
          margin-bottom: 6px;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">${safeCompany}</div>

        <!-- Location -->
        <div style="
          display: flex;
          align-items: center;
          gap: 3px;
          margin-bottom: 8px;
          font-size: 11px;
          color: hsl(215 16% 47%);
        ">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style="
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          ">${safeLocation}</span>
        </div>

        <!-- Salary highlighted -->
        <div style="
          padding: 6px 8px;
          border-radius: 6px;
          background: hsl(160 100% 97%);
          border: 1px solid hsl(160 84% 39% / 0.2);
          margin-bottom: 8px;
        ">
          <div style="
            font-weight: 700;
            color: hsl(160 84% 30%);
            font-size: 13px;
          ">${salary}</div>
        </div>

        <!-- Click hint -->
        <div style="
          text-align: center;
          font-size: 10px;
          color: hsl(221 83% 40%);
          font-weight: 600;
        ">Kliknij aby zobaczyć więcej</div>
      </div>
    </div>
  `;
}

