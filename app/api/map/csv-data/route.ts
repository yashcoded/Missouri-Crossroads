import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';

// IMPORTANT: AWS credentials are server-side only and should NEVER use NEXT_PUBLIC_ prefix
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AMPLIFY_AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY || '';

// Log credential status (without exposing actual values)
console.log('AWS Credentials Check:', {
  hasAccessKeyId: !!accessKeyId,
  accessKeyIdLength: accessKeyId.length,
  hasSecretKey: !!secretAccessKey,
  secretKeyLength: secretAccessKey.length,
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2'
});

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const BUCKET_NAME = 'mr-crossroads-bucket';

// Simple in-memory cache for CSV data
const cache = new Map<string, { data: any[], timestamp: number, locationCount: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Geocoding cache - persistent file-based cache to avoid redundant API calls
const GEOCODING_CACHE_FILE = path.join(process.cwd(), '.geocoding-cache.json');
const geocodingCache = new Map<string, { lat: number; lng: number; timestamp: number }>();

// Load geocoding cache from file on startup
async function loadGeocodingCache(): Promise<void> {
  try {
    const fileContent = await fs.readFile(GEOCODING_CACHE_FILE, 'utf-8');
    const cacheData = JSON.parse(fileContent);
    Object.entries(cacheData).forEach(([address, data]: [string, any]) => {
      geocodingCache.set(address, data);
    });
    console.log(`📦 Loaded ${geocodingCache.size} geocoded addresses from cache`);
  } catch (error) {
    // File doesn't exist yet, that's okay
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.log(`⚠️ Could not load geocoding cache: ${error}`);
    }
  }
}

// Save geocoding cache to file
async function saveGeocodingCache(): Promise<void> {
  try {
    const cacheData: Record<string, { lat: number; lng: number; timestamp: number }> = {};
    geocodingCache.forEach((value, key) => {
      cacheData[key] = value;
    });
    await fs.writeFile(GEOCODING_CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
  } catch (error) {
    console.log(`⚠️ Could not save geocoding cache: ${error}`);
  }
}

// Initialize cache on module load
loadGeocodingCache().catch(console.error);

// Simple geocoding function using Google Maps Geocoding API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Clean up address - remove invalid placeholders and malformed addresses
    let cleanAddress = address.trim();
    
    // Skip addresses that are clearly invalid
    if (!cleanAddress || 
        cleanAddress === 'N/A' || 
        cleanAddress === 'Unknown' || 
        cleanAddress === 'FILL' ||
        cleanAddress.includes('FILL, FILL') ||
        cleanAddress.includes('N/A, N/A, N/A') ||
        cleanAddress.includes('Unknown, Unknown') ||
        cleanAddress.length < 5) {
      return null;
    }
    
    // Clean up common issues
    cleanAddress = cleanAddress
      .replace(/,,+/g, ',') // Remove multiple commas
      .replace(/,\s*,/g, ',') // Remove empty fields
      .replace(/^\s*,\s*|\s*,\s*$/g, '') // Remove leading/trailing commas
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Ensure it includes Missouri if not already present
    if (!cleanAddress.toUpperCase().includes('MO') && !cleanAddress.toUpperCase().includes('MISSOURI')) {
      cleanAddress = `${cleanAddress}, MO`;
    }
    
    // Normalize address for cache lookup (lowercase, remove extra spaces)
    const normalizedAddress = cleanAddress.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check cache first
    const cached = geocodingCache.get(normalizedAddress);
    if (cached) {
      // Cache hit - return cached coordinates
      console.log(`💾 Cache hit for: ${cleanAddress.substring(0, 50)}... → ${cached.lat}, ${cached.lng}`);
      return {
        lat: cached.lat,
        lng: cached.lng
      };
    }
    
    // Cache miss - make API call
    const apiKey = process.env.NEXT_PUBLIC_MAP_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY;
    if (!apiKey) {
      console.log('⚠️ No Google Maps API key available for geocoding');
      return null;
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanAddress)}&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      
      // Validate coordinates are in Missouri (rough bounds)
      if (location.lat >= 35 && location.lat <= 41 && location.lng >= -96 && location.lng <= -89) {
        const coords = {
          lat: location.lat,
          lng: location.lng
        };
        
        // Save to cache
        geocodingCache.set(normalizedAddress, {
          ...coords,
          timestamp: Date.now()
        });
        
        // Save cache to file asynchronously (don't wait)
        saveGeocodingCache().catch(console.error);
        
        console.log(`✅ Geocoded (API): ${cleanAddress.substring(0, 60)}... → ${coords.lat}, ${coords.lng}`);
        return coords;
      } else {
        console.log(`⚠️ Geocoded coordinates outside Missouri bounds for: ${cleanAddress.substring(0, 60)}...`);
        return null;
      }
    } else if (data.status === 'ZERO_RESULTS') {
      // Try without MO suffix if first attempt failed
      if (cleanAddress.endsWith(', MO')) {
        const addressWithoutMO = cleanAddress.replace(/,\s*MO\s*$/i, '').trim();
        if (addressWithoutMO.length > 5) {
          const retryAddress = addressWithoutMO + ', Missouri, USA';
          const normalizedRetryAddress = retryAddress.toLowerCase().replace(/\s+/g, ' ').trim();
          
          // Check cache for retry address
          const retryCached = geocodingCache.get(normalizedRetryAddress);
          if (retryCached) {
            console.log(`💾 Cache hit (retry): ${addressWithoutMO.substring(0, 50)}... → ${retryCached.lat}, ${retryCached.lng}`);
            return {
              lat: retryCached.lat,
              lng: retryCached.lng
            };
          }
          
          const retryUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(retryAddress)}&key=${apiKey}`;
          const retryResponse = await fetch(retryUrl);
          const retryData = await retryResponse.json();
          
          if (retryData.status === 'OK' && retryData.results && retryData.results.length > 0) {
            const location = retryData.results[0].geometry.location;
            if (location.lat >= 35 && location.lat <= 41 && location.lng >= -96 && location.lng <= -89) {
              const coords = {
                lat: location.lat,
                lng: location.lng
              };
              
              // Save retry result to cache
              geocodingCache.set(normalizedRetryAddress, {
                ...coords,
                timestamp: Date.now()
              });
              saveGeocodingCache().catch(console.error);
              
              console.log(`✅ Geocoded (retry API): ${addressWithoutMO.substring(0, 60)}... → ${coords.lat}, ${coords.lng}`);
              return coords;
            }
          }
        }
      }
      console.log(`❌ No results for: ${cleanAddress.substring(0, 60)}...`);
      return null;
    } else {
      console.log(`❌ Geocoding failed for: ${cleanAddress.substring(0, 60)}... - Status: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.log(`⚠️ Geocoding error for ${address.substring(0, 60)}...:`, error instanceof Error ? error.message : error);
    return null;
  }
}

// Function to parse DMM (Degrees, Minutes) or DMS coordinates to decimal degrees
function parseDMMCoordinates(dmmString: string): { lat: number; lng: number } | null {
  try {
    if (!dmmString || dmmString.trim() === '') return null;
    
    const trimmed = dmmString.trim();
    
    // Skip obvious placeholders
    if (trimmed === 'FILL' || trimmed === 'N/A' || trimmed === 'Unknown' || 
        trimmed.includes("Can't Find") || trimmed.length < 5) {
      return null;
    }
    
    // Check if it's already a decimal coordinate (e.g., "38.62166137212446")
    // If it's just a number with optional decimal and no direction letters
    if (/^-?\d+\.\d+$/.test(trimmed.replace(/\s+/g, ''))) {
      return null; // Let the decimal parser handle it
    }
    
    // Remove all special characters, keep numbers, dots, spaces, and NSEW
    const cleanString = dmmString.replace(/[°′'"'`]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Try to extract lat/lng using patterns
    // Patterns to match: N/S degrees minutes, E/W degrees minutes
    // Can be: "N39 11 23.6 W93 52 33.8" or "39 11 23.6 N 93 52 33.8 W"
    
    // Match latitude and longitude separately (order doesn't matter)
    const latPattern = /([NS])\s*(\d+)[° ]?\s+(\d+(?:\.\d+)?)[' ]?(?:\s+(\d+(?:\.\d+)?)[" ]?)?/i;
    const lngPattern = /([EW])\s*(\d+)[° ]?\s+(\d+(?:\.\d+)?)[' ]?(?:\s+(\d+(?:\.\d+)?)[" ]?)?/i;
    
    // Also try reverse pattern: degrees before direction
    const latPattern2 = /(\d+)[° ]?\s+(\d+(?:\.\d+)?)[' ]?(?:\s+(\d+(?:\.\d+)?)[" ]?)?\s*([NS])/i;
    const lngPattern2 = /(\d+)[° ]?\s+(\d+(?:\.\d+)?)[' ]?(?:\s+(\d+(?:\.\d+)?)[" ]?)?\s*([EW])/i;
    
    const latMatch = cleanString.match(latPattern) || cleanString.match(latPattern2);
    const lngMatch = cleanString.match(lngPattern) || cleanString.match(lngPattern2);
    
    if (!latMatch || !lngMatch) {
      return null;
    }
    
    // Extract latitude components
    let latDirection, latDegrees, latMinutes, latSeconds;
    if (latMatch[1] && /[NS]/i.test(latMatch[1])) {
      // Direction first: N39 11 23.6
      [, latDirection, latDegrees, latMinutes, latSeconds] = latMatch;
    } else {
      // Direction last: 39 11 23.6 N
      [, latDegrees, latMinutes, latSeconds, latDirection] = latMatch;
    }
    
    // Extract longitude components  
    let lngDirection, lngDegrees, lngMinutes, lngSeconds;
    if (lngMatch[1] && /[EW]/i.test(lngMatch[1])) {
      // Direction first: W93 52 33.8
      [, lngDirection, lngDegrees, lngMinutes, lngSeconds] = lngMatch;
    } else {
      // Direction last: 93 52 33.8 W
      [, lngDegrees, lngMinutes, lngSeconds, lngDirection] = lngMatch;
    }
    
    // Convert to decimal
    let latDecimal = parseFloat(latDegrees) + parseFloat(latMinutes) / 60;
    if (latSeconds) latDecimal += parseFloat(latSeconds) / 3600;
    if (latDirection.toUpperCase() === 'S') latDecimal = -latDecimal;
    
    let lngDecimal = parseFloat(lngDegrees) + parseFloat(lngMinutes) / 60;
    if (lngSeconds) lngDecimal += parseFloat(lngSeconds) / 3600;
    if (lngDirection.toUpperCase() === 'W') lngDecimal = -lngDecimal;
    
    // Validate Missouri coordinates (roughly)
    if (latDecimal < 35 || latDecimal > 41 || lngDecimal > -89 || lngDecimal < -96) {
      return null; // Outside Missouri, probably bad parse
    }

    return { lat: latDecimal, lng: lngDecimal };
  } catch (_error) {
    return null;
  }
}

// Better CSV parsing function that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function parseCSV(csvText: string, centerLat?: string, centerLng?: string, isViewport?: boolean, searchParams?: URLSearchParams): Promise<any[]> {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    console.log('CSV has insufficient lines:', lines.length);
    return [];
  }

  // Parse header row properly
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
  console.log('CSV headers:', headers);
  console.log('Total headers:', headers.length);
  
  const locations = [];
  let validLocationCount = 0;
  let invalidLocationCount = 0;
  let processedRows = 0;
  let rowsWithCoordinates = 0;
  let rowsWithoutCoordinates = 0;
  let rowsWithDMMCoords = 0;
  let rowsWithDecimalCoords = 0;

  // Process first 10 rows to understand the data structure
  const sampleRows = Math.min(10, lines.length - 1);
  
  for (let i = 1; i < lines.length; i++) {
    if (processedRows < sampleRows) {
      console.log(`Sample row ${i}:`, parseCSVLine(lines[i]).length, 'columns');
      if (i === 1) {
        console.log('Sample row 1 values:', parseCSVLine(lines[i]));
      }
    }
    
    const values = parseCSVLine(lines[i]);
    
    // Skip rows with too few columns (likely incomplete)
    if (values.length < 5) {
      continue;
    }
    
    // Create location object, mapping available values to headers
    const location: any = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        location[header] = values[index].replace(/"/g, '').trim();
      }
    });

    // Check for various latitude/longitude column names
    const latValue = location.lat || location.latitude || location.Lat || location.Latitude || 
                     location.LAT || location['Latitude'] || location['LAT'];
    const lngValue = location.lng || location.longitude || location.lng || location.Longitude || 
                     location.LNG || location['Longitude'] || location['LNG'] || location.lon || location.Lon;

    // Check for DMM coordinates and convert to decimal degrees
    const dmmCoords = location['GeoCoordinates (DMM)'] || location['GeoCoordinates (DD)'];
    let latDecimal: number | null = null;
    let lngDecimal: number | null = null;

    // First, try to parse decimal coordinates from dedicated lat/lng columns
    if (latValue && latValue.trim() && !isNaN(parseFloat(latValue))) {
      const parsed = parseFloat(latValue);
      if (parsed >= 35 && parsed <= 41) { // Valid Missouri latitude range
        latDecimal = parsed;
        rowsWithDecimalCoords++;
      }
    }
    if (lngValue && lngValue.trim() && !isNaN(parseFloat(lngValue))) {
      const parsed = parseFloat(lngValue);
      if (parsed >= -96 && parsed <= -89) { // Valid Missouri longitude range
        lngDecimal = parsed;
      }
    }
    
    // If no valid decimal coordinates, try parsing the DMM/DMS field
    if ((latDecimal === null || lngDecimal === null) && dmmCoords && dmmCoords.trim()) {
      // Check if dmmCoords is actually a decimal coordinate pair
      const decimalPairMatch = dmmCoords.match(/^(-?\d+\.\d+)\s*[,\s]\s*(-?\d+\.\d+)/);
      if (decimalPairMatch) {
        // It's already decimal coordinates like "38.123, -90.456"
        const lat = parseFloat(decimalPairMatch[1]);
        const lng = parseFloat(decimalPairMatch[2]);
        if (lat >= 35 && lat <= 41 && lng >= -96 && lng <= -89) {
          latDecimal = lat;
          lngDecimal = lng;
          if (process.env.NODE_ENV === 'development' && i <= 3) {
            console.log(`✅ Decimal pair: "${dmmCoords}" → ${lat}, ${lng}`);
          }
        }
      } else {
        // Try DMM/DMS parsing
        rowsWithDMMCoords++;
        const coords = parseDMMCoordinates(dmmCoords);
        if (coords) {
          latDecimal = coords.lat;
          lngDecimal = coords.lng;
          // Debug logging - only in development
          if (process.env.NODE_ENV === 'development' && i <= 3) {
            console.log(`✅ DMM→Decimal: "${dmmCoords}" → ${latDecimal}, ${lngDecimal}`);
          }
        }
      }
    }

    // Final coordinates are whatever we successfully parsed
    const finalLat = latDecimal;
    const finalLng = lngDecimal;

    // Get address components for geocoding
    const address = location['address OR postalAddress (streetAddress OR postOfficeBoxNumber)'] || '';
    const locality = location['addressLocality'] || '';
    const county = location['COUNTY'] || '';
    const postalCode = location['postalCode'] || '';

    // Include locations with coordinates OR valid addresses (for geocoding)
    const hasCoordinates = finalLat !== null && finalLng !== null && !isNaN(finalLat) && !isNaN(finalLng);
    const hasValidAddress = address && locality && address.trim() !== '' && locality.trim() !== '';
    
    if (hasCoordinates || hasValidAddress) {
      if (hasCoordinates) {
        rowsWithCoordinates++;
        location.id = `location-${i}`;
        location.lat = finalLat;
        location.lng = finalLng;
      } else {
        // For entries with addresses but no coordinates, we'll include them for geocoding
        location.id = `location-${i}`;
        location.needsGeocoding = true;
        location.fullAddress = `${address}, ${locality}, ${county}, MO ${postalCode}`.replace(/,,/g, ',').replace(/,$/, '').replace(/\s+/g, ' ').trim();
        
        // Set temporary coordinates (will be updated after geocoding)
        location.lat = 0;
        location.lng = 0;
      }
      
      // Map CSV field names to our expected structure
      location.organizationName = location['Organization OR Place > Civic Structure > Museum OR Place > LocalBusiness > Library'] || 
                                 location.organizationName || location.name || location.Name || 
                                 location.NAME || location['Organization Name'] || location['ORGANIZATION_NAME'] ||
                                 location.title || location.Title || `Location ${i}`;
      
      location.address = location['address OR postalAddress (streetAddress OR postOfficeBoxNumber)'] ||
                        location.address || location.Address || location.ADDRESS || 
                        location['Address'] || location['ADDRESS'] || location.location || location.Location || '';
      
      location.siteTypeCategory = location['SITE TYPE CATEGORY'] || location.siteTypeCategory || 
                                 location.category || location.Category || location.CATEGORY || 
                                 location['Site Type Category'] || location['SITE_TYPE_CATEGORY'] ||
                                 location.type || location.Type || 'Unknown';
      
      location.tertiaryCategories = location['TERTIARY CATS'] || location.tertiaryCategories || 
                                   location.tags || location.Tags || location.TAGS || 
                                   location['Tertiary Categories'] || location['TERTIARY_CATEGORIES'] ||
                                   location.subcategories || location.Subcategories || '';
      
      location.yearEstablished = location['YEAR ESTABLISHED, BUILT OR PLACED?'] || 
                                location.yearEstablished || location.YearEstablished || location.YEAR_ESTABLISHED ||
                                location['Year Established'] || location['YEAR_ESTABLISHED'] || location.established || 
                                location.Established || '';
      
      location.builtPlaced = location['YEAR ESTABLISHED, BUILT OR PLACED?'] || 
                            location.builtPlaced || location.BuiltPlaced || location.BUILT_PLACED ||
                            location['Built/Placed'] || location['BUILT_PLACED'] || location.built || location.Built || '';
      
      locations.push(location);
      validLocationCount++;
      
      // Log first few valid locations for debugging
      if (validLocationCount <= 3) {
        console.log(`Valid location ${validLocationCount}:`, {
          name: location.organizationName,
          lat: location.lat,
          lng: location.lng,
          category: location.siteTypeCategory
        });
      }
    } else {
      invalidLocationCount++;
      // Log first few invalid entries for debugging
      if (invalidLocationCount <= 3) {
        console.log(`Invalid location at row ${i}:`, { 
          latValue, 
          lngValue, 
          availableFields: Object.keys(location),
          sampleData: {
            first5Headers: headers.slice(0, 5),
            first5Values: values.slice(0, 5)
          }
        });
      }
    }
    
    processedRows++;
    
    // Process all rows (removed 1000 row limit)
    // The CSV has 1500+ entries, so we need to process them all
  }

  // Calculate rows without coordinates (for potential future logging)
  const _rowsWithoutCoordinates = processedRows - rowsWithCoordinates;
  
  // Automatically geocode addresses that need coordinates
  // IMPORTANT: Only geocode on initial load, NOT on viewport requests (to avoid repeated API calls)
  const shouldGeocode = searchParams?.get('geocode') !== 'false' && !isViewport;
  
  let geocodedCount = 0;
  let failedGeocodingCount = 0;
  
  // First, check cache for any addresses that need geocoding (even if geocoding is disabled)
  // This ensures we use cached results even on viewport requests
  let cacheHits = 0;
  locations.forEach(location => {
    if (location.needsGeocoding && location.fullAddress) {
      const normalizedAddress = location.fullAddress.toLowerCase().replace(/\s+/g, ' ').trim();
      const cached = geocodingCache.get(normalizedAddress);
      if (cached) {
        location.lat = cached.lat;
        location.lng = cached.lng;
        location.needsGeocoding = false;
        cacheHits++;
      }
    }
  });
  
  if (cacheHits > 0) {
    console.log(`💾 Found ${cacheHits} addresses in geocoding cache`);
  }
  
  if (shouldGeocode) {
    // Geocode addresses that still need coordinates (after cache check)
    const locationsToGeocode = locations.filter(loc => 
      loc.needsGeocoding && 
      loc.fullAddress && 
      loc.fullAddress.trim().length > 5 &&
      loc.fullAddress !== 'N/A' &&
      !loc.fullAddress.includes('FILL, FILL')
    );
    
    const cacheSizeBefore = geocodingCache.size;
    console.log(`🗺️ Geocoding ${locationsToGeocode.length} addresses without coordinates... (${cacheSizeBefore} addresses in cache)`);
    
    if (locationsToGeocode.length > 0) {
      // Process in batches to avoid rate limiting (Google allows 50 requests per second)
      const batchSize = 10;
      const delayBetweenBatches = 200; // 200ms between batches = ~50 requests per second max
      let apiCalls = 0;
      
      for (let i = 0; i < locationsToGeocode.length; i += batchSize) {
        const batch = locationsToGeocode.slice(i, i + batchSize);
        
        // Process batch in parallel
        await Promise.all(batch.map(async (location) => {
          try {
            // Track if this was a cache hit or API call
            const wasInCache = geocodingCache.has(location.fullAddress.toLowerCase().replace(/\s+/g, ' ').trim());
            
            const coords = await geocodeAddress(location.fullAddress);
            if (coords) {
              location.lat = coords.lat;
              location.lng = coords.lng;
              location.needsGeocoding = false;
              geocodedCount++;
              
              // Track cache vs API usage
              if (!wasInCache) {
                apiCalls++;
              }
            } else {
              failedGeocodingCount++;
              if (!wasInCache) {
                apiCalls++; // Still counted as an API call even if it failed
              }
            }
          } catch (error) {
            console.log(`⚠️ Error geocoding ${location.fullAddress?.substring(0, 50)}...:`, error instanceof Error ? error.message : error);
            failedGeocodingCount++;
            apiCalls++;
          }
        }));
        
        // Save cache periodically (every 100 addresses) to avoid losing data
        if (i > 0 && i % 100 === 0) {
          await saveGeocodingCache();
        }
        
        // Add delay between batches (except for the last batch)
        if (i + batchSize < locationsToGeocode.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
        
        // Log progress every 50 locations
        if (i > 0 && i % 50 === 0) {
          console.log(`📍 Geocoding progress: ${i}/${locationsToGeocode.length} processed (${geocodedCount} succeeded, ${failedGeocodingCount} failed, ${apiCalls} API calls)`);
        }
      }
      
      // Final cache save
      await saveGeocodingCache();
      
      const cacheSizeAfter = geocodingCache.size;
      const newCacheEntries = cacheSizeAfter - cacheSizeBefore;
      
      console.log(`✅ Geocoding complete: ${geocodedCount} succeeded, ${failedGeocodingCount} failed out of ${locationsToGeocode.length} addresses`);
      console.log(`💰 Cost savings: ${cacheHits} from cache, ${apiCalls} API calls, ${newCacheEntries} new entries cached`);
      console.log(`   Estimated API cost saved: ~$${(cacheHits * 0.005).toFixed(4)} (at $0.005 per request)`);
    }
  } else {
    if (isViewport) {
      console.log(`⚡ Geocoding skipped for viewport request (using cached results: ${cacheHits} locations)`);
    } else {
      console.log(`⚡ Geocoding disabled - use ?geocode=false to disable (enabled by default)`);
      if (cacheHits > 0) {
        console.log(`   Using ${cacheHits} cached geocoding results`);
      }
    }
  }
  
  // Include ALL locations - those with coordinates AND those without (for sidebar display)
  // The frontend will filter: map markers need coordinates, sidebar shows all locations
  let finalLocations = locations;
  
  // Count locations with and without coordinates for logging
  const locationsWithCoords = locations.filter(loc => 
    loc.lat !== undefined && loc.lat !== null && loc.lat !== 0 && 
    loc.lng !== undefined && loc.lng !== null && loc.lng !== 0 &&
    !loc.needsGeocoding
  );
  const locationsWithoutCoords = locations.filter(loc => 
    loc.needsGeocoding || 
    !loc.lat || loc.lat === 0 || 
    !loc.lng || loc.lng === 0
  );
  
  console.log(`📊 Location breakdown: ${locationsWithCoords.length} with coordinates, ${locationsWithoutCoords.length} without coordinates (will show in sidebar)`);

  // Function to calculate distance between two points in miles
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // If center coordinates are provided, filter by distance and prioritize nearby locations
  if (centerLat && centerLng) {
    console.log(`🗺️ Total locations: ${finalLocations.length} (${locationsWithCoords.length} with coordinates, ${locationsWithoutCoords.length} without coordinates)`);
    const userLat = parseFloat(centerLat);
    const userLng = parseFloat(centerLng);
    
    // Check if this is St. Louis area request (within 50 miles of downtown STL)
    const downtownSTL = { lat: 38.6270, lng: -90.1994 };
    const distanceFromDowntown = calculateDistance(userLat, userLng, downtownSTL.lat, downtownSTL.lng);
    const isSTLArea = distanceFromDowntown <= 50;
    
    if (isViewport === true) {
      console.log(`🗺️ Viewport request - loading locations around ${centerLat}, ${centerLng}`);
      
      // For viewport requests, prioritize by distance but include all locations
      finalLocations = finalLocations.map(loc => {
        // Calculate distance only for locations with valid coordinates
        const hasValidCoords = loc.lat !== undefined && loc.lat !== null && loc.lat !== 0 && 
                               loc.lng !== undefined && loc.lng !== null && loc.lng !== 0 &&
                               !loc.needsGeocoding;
        const distance = hasValidCoords
          ? calculateDistance(loc.lat!, loc.lng!, userLat, userLng)
          : Infinity;
        return { ...loc, distance };
      }).sort((a, b) => {
        // Sort by distance (locations without coordinates go to end)
        return a.distance - b.distance;
      });
      
      const withCoords = finalLocations.filter(loc => loc.distance !== Infinity).length;
      const withoutCoords = finalLocations.filter(loc => loc.distance === Infinity).length;
      console.log(`🎯 Viewport loading: ${finalLocations.length} locations (${withCoords} with coordinates, ${withoutCoords} without - sorted by distance)`);
    } else if (isSTLArea) {
      console.log(`🏙️ St. Louis area detected (${distanceFromDowntown.toFixed(1)} miles from downtown)`);
      
      // Filter to only locations within 100 miles of downtown St. Louis (only those with coordinates)
      // But include all locations without coordinates at the end
      const locationsWithValidCoords = finalLocations.filter(loc => {
        const hasValidCoords = loc.lat !== undefined && loc.lat !== null && loc.lat !== 0 && 
                               loc.lng !== undefined && loc.lng !== null && loc.lng !== 0 &&
                               !loc.needsGeocoding;
        if (!hasValidCoords) return false;
        const distance = calculateDistance(loc.lat!, loc.lng!, downtownSTL.lat, downtownSTL.lng);
        return distance <= 100; // 100 miles from downtown St. Louis
      }).map(loc => {
        const distance = calculateDistance(loc.lat!, loc.lng!, downtownSTL.lat, downtownSTL.lng);
        return { ...loc, distance };
      }).sort((a, b) => a.distance - b.distance);
      
      // Add locations without coordinates at the end
      const locationsWithoutValidCoords = finalLocations.filter(loc => {
        const hasValidCoords = loc.lat !== undefined && loc.lat !== null && loc.lat !== 0 && 
                               loc.lng !== undefined && loc.lng !== null && loc.lng !== 0 &&
                               !loc.needsGeocoding;
        return !hasValidCoords;
      }).map(loc => ({ ...loc, distance: Infinity }));
      
      finalLocations = [...locationsWithValidCoords, ...locationsWithoutValidCoords];
      
      console.log(`🎯 Showing ${finalLocations.length} locations (${locationsWithValidCoords.length} within 100 miles of downtown St. Louis, ${locationsWithoutValidCoords.length} without coordinates)`);
    } else {
      console.log(`🌎 Outside St. Louis area, showing general Missouri locations`);
      
      // For other areas, calculate distance from user location and sort by proximity
      // Include all locations, but prioritize those with coordinates
      finalLocations = finalLocations.map(loc => {
        const hasValidCoords = loc.lat !== undefined && loc.lat !== null && loc.lat !== 0 && 
                               loc.lng !== undefined && loc.lng !== null && loc.lng !== 0 &&
                               !loc.needsGeocoding;
        const distance = hasValidCoords
          ? calculateDistance(loc.lat!, loc.lng!, userLat, userLng)
          : Infinity;
        return { ...loc, distance };
      }).sort((a, b) => a.distance - b.distance);
      
      // Don't limit - show all locations (frontend will handle display)
      console.log(`🎯 Showing all ${finalLocations.length} locations (sorted by distance, locations without coordinates at end)`);
    }
  }
  
  // Log summary only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎉 CSV Parsing & Geocoding Summary:`);
    console.log(`- Total rows processed: ${processedRows}`);
    console.log(`- Locations with existing coordinates: ${rowsWithCoordinates}`);
    console.log(`- Locations successfully geocoded: ${geocodedCount}`);
    console.log(`- Locations failed to geocode: ${failedGeocodingCount}`);
    console.log(`- Total locations: ${finalLocations.length} (${locationsWithCoords.length} with coordinates for map, ${locationsWithoutCoords.length} without coordinates for sidebar)`);
    console.log(`- Rows with DMM coordinates: ${rowsWithDMMCoords}`);
    console.log(`- Rows with decimal coordinates: ${rowsWithDecimalCoords}`);
    console.log(`- Rows without coordinates: ${processedRows - rowsWithDMMCoords - rowsWithDecimalCoords}`);
  }
  
  return finalLocations;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName') || 'metadata-1759267238657.csv';
    const centerLat = searchParams.get('centerLat');
    const centerLng = searchParams.get('centerLng');
    const isViewport = searchParams.get('viewport') === 'true';
    
    // Create cache key based on parameters
    const cacheKey = `${fileName}_${centerLat || 'all'}_${centerLng || 'all'}_${isViewport ? 'viewport' : 'normal'}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`🚀 Cache hit for ${cacheKey} (${cached.locationCount} locations)`);
      return NextResponse.json({
        success: true,
        fileName,
        locations: cached.data,
        totalLocations: cached.locationCount,
        source: 'cache',
        timestamp: new Date().toISOString()
      });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗺️ Request for ${fileName}${centerLat && centerLng ? ` centered on ${centerLat}, ${centerLng}` : ''}`);
    }
    
    // Try to fetch from S3 first
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `metadata/${fileName}`,
      });

      const response = await s3Client.send(command);
      const csvText = await response.Body?.transformToString() || '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log('CSV text length:', csvText.length);
        console.log('First 500 characters:', csvText.substring(0, 500));
        console.log('Last 200 characters:', csvText.substring(csvText.length - 200));
      }
      
          let locations;
          try {
            locations = await parseCSV(csvText, centerLat || undefined, centerLng || undefined, isViewport, searchParams);
          } catch (error) {
            console.error('Error parsing CSV:', error);
            throw error;
          }

      // If S3 returns no locations, fall back to sample data
      if (locations.length === 0) {
        console.log('S3 returned empty locations, using sample data');
        throw new Error('No valid locations found in CSV');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`Successfully parsed ${locations.length} locations from CSV`);
      }

      // Cache the results
      cache.set(cacheKey, {
        data: locations,
        timestamp: Date.now(),
        locationCount: locations.length
      });

      return NextResponse.json({
        success: true,
        fileName,
        locations,
        totalLocations: locations.length,
        source: 's3',
        timestamp: new Date().toISOString()
      });

    } catch (s3Error) {
      console.error('S3 fetch failed, using sample data:', {
        error: s3Error,
        errorMessage: s3Error instanceof Error ? s3Error.message : String(s3Error),
        bucket: BUCKET_NAME,
        hasCredentials: !!(accessKeyId && secretAccessKey)
      });
      
      // Enhanced sample data with more Missouri locations
      const sampleLocations = [
        {
          id: '1',
          organizationName: 'Missouri State Capitol',
          yearEstablished: '1917',
          builtPlaced: '1917',
          address: '201 W Capitol Ave, Jefferson City, MO 65101',
          siteTypeCategory: 'Civic Structure',
          tertiaryCategories: 'Government, Historic',
          lat: 38.5791,
          lng: -92.1729
        },
        {
          id: '2',
          organizationName: 'Gateway Arch',
          yearEstablished: '1965',
          builtPlaced: '1965',
          address: 'St Louis, MO 63102',
          siteTypeCategory: 'Monument',
          tertiaryCategories: 'Historic, Landmark',
          lat: 38.6247,
          lng: -90.1848
        },
        {
          id: '3',
          organizationName: 'Kansas City Public Library',
          yearEstablished: '1873',
          builtPlaced: '2004',
          address: '14 W 10th St, Kansas City, MO 64105',
          siteTypeCategory: 'Library',
          tertiaryCategories: 'Education, Public',
          lat: 39.0997,
          lng: -94.5786
        },
        {
          id: '4',
          organizationName: 'University of Missouri',
          yearEstablished: '1839',
          builtPlaced: '1839',
          address: 'Columbia, MO 65211',
          siteTypeCategory: 'Educational Institution',
          tertiaryCategories: 'University, Education',
          lat: 38.9404,
          lng: -92.3277
        },
        {
          id: '5',
          organizationName: 'Harry S. Truman Presidential Library',
          yearEstablished: '1957',
          builtPlaced: '1957',
          address: '500 W US Hwy 24, Independence, MO 64050',
          siteTypeCategory: 'Museum',
          tertiaryCategories: 'Presidential, Historic',
          lat: 39.0923,
          lng: -94.4216
        },
        {
          id: '6',
          organizationName: 'Nelson-Atkins Museum of Art',
          yearEstablished: '1933',
          builtPlaced: '1933',
          address: '4525 Oak St, Kansas City, MO 64111',
          siteTypeCategory: 'Museum',
          tertiaryCategories: 'Art, Culture',
          lat: 39.0444,
          lng: -94.5812
        },
        {
          id: '7',
          organizationName: 'Mark Twain Boyhood Home & Museum',
          yearEstablished: '1937',
          builtPlaced: '1844',
          address: '120 N Main St, Hannibal, MO 63401',
          siteTypeCategory: 'Museum',
          tertiaryCategories: 'Literature, Historic',
          lat: 39.7089,
          lng: -91.3592
        },
        {
          id: '8',
          organizationName: 'Branson Landing',
          yearEstablished: '2006',
          builtPlaced: '2006',
          address: '100 Branson Landing Blvd, Branson, MO 65616',
          siteTypeCategory: 'Business District',
          tertiaryCategories: 'Entertainment, Shopping',
          lat: 36.6431,
          lng: -93.2185
        },
        {
          id: '9',
          organizationName: 'Springfield Art Museum',
          yearEstablished: '1926',
          builtPlaced: '1926',
          address: '1111 E Brookside Dr, Springfield, MO 65807',
          siteTypeCategory: 'Museum',
          tertiaryCategories: 'Art, Culture',
          lat: 37.2067,
          lng: -93.2933
        },
        {
          id: '10',
          organizationName: 'Saint Louis Art Museum',
          yearEstablished: '1879',
          builtPlaced: '1904',
          address: '1 Fine Arts Dr, St. Louis, MO 63110',
          siteTypeCategory: 'Museum',
          tertiaryCategories: 'Art, Culture, Historic',
          lat: 38.6389,
          lng: -90.2942
        },
        {
          id: '11',
          organizationName: 'Missouri Botanical Garden',
          yearEstablished: '1859',
          builtPlaced: '1859',
          address: '4344 Shaw Blvd, St. Louis, MO 63110',
          siteTypeCategory: 'Garden',
          tertiaryCategories: 'Nature, Education',
          lat: 38.6142,
          lng: -90.2594
        },
        {
          id: '12',
          organizationName: 'Silver Dollar City',
          yearEstablished: '1960',
          builtPlaced: '1960',
          address: '399 Silver Dollar City Pkwy, Branson, MO 65616',
          siteTypeCategory: 'Theme Park',
          tertiaryCategories: 'Entertainment, Family',
          lat: 36.6689,
          lng: -93.3386
        },
        {
          id: '13',
          organizationName: 'Missouri State University',
          yearEstablished: '1905',
          builtPlaced: '1905',
          address: '901 S National Ave, Springfield, MO 65897',
          siteTypeCategory: 'Educational Institution',
          tertiaryCategories: 'University, Education',
          lat: 37.1967,
          lng: -93.2819
        },
        {
          id: '14',
          organizationName: 'Lake of the Ozarks State Park',
          yearEstablished: '1931',
          builtPlaced: '1931',
          address: '403 MO-134, Kaiser, MO 65047',
          siteTypeCategory: 'State Park',
          tertiaryCategories: 'Nature, Recreation',
          lat: 38.1567,
          lng: -92.6389
        },
        {
          id: '15',
          organizationName: 'Pony Express National Museum',
          yearEstablished: '1958',
          builtPlaced: '1859',
          address: '914 Penn St, St Joseph, MO 64503',
          siteTypeCategory: 'Museum',
          tertiaryCategories: 'Historic, Transportation',
          lat: 39.7667,
          lng: -94.8500
        }
      ];

      // Cache the sample data too
      cache.set(cacheKey, {
        data: sampleLocations,
        timestamp: Date.now(),
        locationCount: sampleLocations.length
      });

      return NextResponse.json({
        success: true,
        fileName,
        locations: sampleLocations,
        totalLocations: sampleLocations.length,
        source: 'sample',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch CSV data', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
