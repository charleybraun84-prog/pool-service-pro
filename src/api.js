import Papa from 'papaparse';

const SHEET_ID = '1277neWeMNuM39J1o7188vWgztj65PzDzGN2g-jLYu4g';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJ28Mi_MLps1pzKYKMnHSGGjAwj2Aw1c2RM9qr42uNH6KQMwk76eg1XUtsp5u58bFs/exec';
const API_TOKEN = '9517534682';

export const SHEET_TABS = [
  'Route Assessments',
  'Service Assessments',
  'New Assessment'
];

export async function fetchSheetData(sheetName) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const csvData = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Filter out rows where all columns might be empty or undefined
          const validData = results.data.filter(row => Object.values(row).some(val => val !== ""));
          resolve(validData);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Failed to fetch data for ${sheetName}:`, error);
    return [];
  }
}

export async function fetchRepairKits() {
  try {
    const url = `${APPS_SCRIPT_URL}?token=${API_TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    if (data && data.error) {
      console.error('Apps Script API Error for Repair Kits:', data.error);
      return [];
    }
    
    // Clean and validate the rows: must have a Kit (Description)
    const validKits = (data || []).filter(kit => {
      const desc = kit['Kit (Description)'];
      return desc && desc.trim() !== '';
    });
    
    return validKits;
  } catch (error) {
    console.error('Failed to fetch Repair Kits:', error);
    return [];
  }
}

export async function fetchRepairParts() {
  try {
    const url = `${APPS_SCRIPT_URL}?token=${API_TOKEN}&sheet=Parts`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    if (data && data.error) {
      console.error('Apps Script API Error for Repair Parts:', data.error);
      return [];
    }
    
    // Clean and validate: must have a Part Number
    const validParts = (data || []).filter(part => {
      const partNo = part['Part Number'];
      return partNo && String(partNo).trim() !== '';
    });
    
    return validParts;
  } catch (error) {
    console.error('Failed to fetch Repair Parts:', error);
    return [];
  }
}

// Track the timestamp of the last Nominatim request to enforce the 1 request/sec rate limit dynamically
let lastGeocodeTime = 0;

// Simple geocoding function with localStorage caching
const STATE_MAP = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

function formatCleanAddress(addressObj, defaultName) {
  if (!addressObj) return defaultName;
  const houseNumber = addressObj.house_number || '';
  const road = addressObj.road || '';
  const city = addressObj.city || addressObj.town || addressObj.village || addressObj.hamlet || addressObj.suburb || addressObj.municipality || '';
  const rawState = addressObj.state || '';
  const postcode = addressObj.postcode || '';

  const stateAbbr = STATE_MAP[rawState.toLowerCase().trim()] || rawState;

  const street = [houseNumber, road].filter(Boolean).join(' ');
  
  if (street && city) {
    let formatted = `${street}, ${city}`;
    if (stateAbbr) {
      formatted += `, ${stateAbbr}`;
    }
    if (postcode) {
      // Clean up zip codes that might have additional suffixes or just display as is
      formatted += ` ${postcode}`;
    }
    return formatted;
  }
  return defaultName;
}

// Simple geocoding function with localStorage caching
export async function geocodeAddress(address) {
  if (!address) return null;
  
  const cacheKey = `geocode_v2_${address}`;
  let cached = null;
  try {
    cached = localStorage.getItem(cacheKey);
  } catch (e) {
    console.warn("localStorage is not accessible:", e);
  }
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Failed to parse cached geocode:", e);
    }
  }

  // Calculate the delay needed to respect Nominatim's 1 request/second usage policy.
  // This calculates time elapsed since the last request started, and waits only the remainder.
  const now = Date.now();
  const timeSinceLast = now - lastGeocodeTime;
  const minInterval = 1100; // 1.1 seconds buffer

  if (timeSinceLast < minInterval) {
    const delay = minInterval - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Record actual request initiation time
  lastGeocodeTime = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      const cleanAddress = formatCleanAddress(data[0].address, data[0].display_name);
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: cleanAddress
      };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }
      return result;
    }
    return null;
  } catch (error) {
    console.error(`Failed to geocode address: ${address}`, error);
    return null;
  }
}

export async function updateCustomerNotes() {
    console.warn("updateCustomerNotes not fully implemented for dynamic sheets yet");
    return { success: true };
}
