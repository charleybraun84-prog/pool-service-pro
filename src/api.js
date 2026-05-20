import Papa from 'papaparse';

const SHEET_ID = '1277neWeMNuM39J1o7188vWgztj65PzDzGN2g-jLYu4g';

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

// Track the timestamp of the last Nominatim request to enforce the 1 request/sec rate limit dynamically
let lastGeocodeTime = 0;

// Simple geocoding function with localStorage caching
export async function geocodeAddress(address) {
  if (!address) return null;
  
  const cacheKey = `geocode_${address}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
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
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      localStorage.setItem(cacheKey, JSON.stringify(result));
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
