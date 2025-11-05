'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

// Note: Using google.maps.Marker with enhanced styling instead of AdvancedMarkerElement
// Advanced Markers require Map ID configuration in Google Cloud Console
// This approach avoids the Map ID requirement while maintaining good UX

interface LocationData {
  id: string;
  organizationName: string;
  yearEstablished: string;
  builtPlaced: string;
  address: string;
  siteTypeCategory: string;
  tertiaryCategories: string;
  lat?: number;
  lng?: number;
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface MissouriMapProps {
  fileName: string;
}

export default function MissouriMap({ fileName }: MissouriMapProps) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [showMuseums, setShowMuseums] = useState(true);
  const [showLibraries, setShowLibraries] = useState(true);
  const [showOthers, setShowOthers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [loadedBounds, setLoadedBounds] = useState<any>(null);
  const [loadingViewport, setLoadingViewport] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const markersRef = useRef<any[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAP_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: 'weekly',
    preventGoogleFontsLoading: true // Prevent font loading delays
  });

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Check if user is in Missouri (rough bounds)
          const isInMissouri = lat >= 35.9957 && lat <= 40.6136 && lng >= -95.7731 && lng <= -89.0989;
          
          if (isInMissouri) {
            console.log(`📍 User is in Missouri: ${lat}, ${lng}`);
            setUserLocation({ lat, lng });
          } else {
            console.log(`📍 User outside Missouri, defaulting to St. Louis`);
            setUserLocation({ lat: 38.6270, lng: -90.1994 }); // St. Louis coordinates
          }
          setLocationLoading(false);
        },
            () => {
              console.log(`📍 Location access denied, defaulting to St. Louis`);
              setUserLocation({ lat: 38.6270, lng: -90.1994 }); // St. Louis coordinates
              setLocationLoading(false);
            },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      console.log(`📍 Geolocation not supported, defaulting to St. Louis`);
      setUserLocation({ lat: 38.6270, lng: -90.1994 }); // St. Louis coordinates
      setLocationLoading(false);
    }
  }, []);

  // Clear all markers function
  const clearMarkers = useCallback((closeInfoWindow = true) => {
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
    // Only close InfoWindow if explicitly requested
    if (closeInfoWindow) {
      setSelectedLocation(null);
    }
  }, []);

  // Create markers with stable references
  const createMarkers = useCallback((map: google.maps.Map, locations: LocationData[], preserveInfoWindow = false) => {
    // Clear existing markers first, but preserve InfoWindow if requested
    clearMarkers(!preserveInfoWindow);

    const newMarkers: any[] = [];

    locations.forEach((location) => {
      if (!location.lat || !location.lng) return;

      // Use regular Marker with enhanced styling
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        icon: {
          url: getMarkerIcon(location.siteTypeCategory),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        },
        map: map,
        title: location.organizationName,
        // Add animation for better UX
        animation: google.maps.Animation.DROP
      });

          // Add click listener with stable reference
          marker.addListener('click', () => {
            console.log(`📍 Marker clicked: ${location.organizationName}`);
            
            // Simply show the InfoWindow without zooming or panning
            setSelectedLocation(location);
          });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;
    console.log(`🗺️ Created ${newMarkers.length} markers`);
  }, [clearMarkers]);

  // Filter locations based on visibility settings and search query
  const filteredLocations = locations.filter(location => {
    // Only show locations with valid coordinates (this is why only 91 pins show)
    if (!location.lat || !location.lng || location.lat === 0 || location.lng === 0) return false;
    
    // Category-based filtering (works independently of search)
    const category = location.siteTypeCategory.toLowerCase();
    let categoryMatch = false;
    
    // Red = Historic Markers only
    if (category.includes('historic marker')) {
      categoryMatch = showMuseums;
    } 
    // Blue = Interpretive/Educational content
    else if (category.includes('interpretive') || category.includes('interpetive') || 
             category.includes('library') || category.includes('educational')) {
      categoryMatch = showLibraries;
    } 
    // Green = Monuments and everything else
    else {
      categoryMatch = showOthers;
    }
    
    // If category doesn't match, don't show this location
    if (!categoryMatch) return false;
    
    // Search-based filtering (only applies if there's a search query)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchableText = [
        location.organizationName,
        location.address,
        location.siteTypeCategory,
        location.tertiaryCategories,
        location.yearEstablished,
        location.builtPlaced
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query);
    }
    
    // If no search query, show all locations that match the category filters
    return true;
  });

  // Debug logging for filtering - only log once when locations change
  useEffect(() => {
    if (locations.length === 0) return;
    
    console.log(`🔍 Filtering results: ${filteredLocations.length} locations`);
    console.log(`📊 Filters: Museums=${showMuseums}, Libraries=${showLibraries}, Others=${showOthers}`);
    
    // Log all unique categories to help debug (only once)
    const uniqueCategories = new Set(locations.map(loc => loc.siteTypeCategory));
    console.log(`📋 Unique categories in data:`, Array.from(uniqueCategories));
    
    // Count by category filter type
    const museumCount = locations.filter(loc => {
      const cat = loc.siteTypeCategory.toLowerCase();
      return cat.includes('historic marker');
    }).length;
    const libraryCount = locations.filter(loc => {
      const cat = loc.siteTypeCategory.toLowerCase();
      return cat.includes('interpretive') || cat.includes('interpetive') || 
             cat.includes('library') || cat.includes('educational');
    }).length;
    const otherCount = locations.filter(loc => {
      const cat = loc.siteTypeCategory.toLowerCase();
      return !cat.includes('historic marker') &&
             !cat.includes('interpretive') && !cat.includes('interpetive') &&
             !cat.includes('library') && !cat.includes('educational');
    }).length;
    
    console.log(`📊 Category counts: Museums=${museumCount}, Libraries=${libraryCount}, Others=${otherCount}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.length]); // Only re-run when locations count changes

  const fetchCSVData = useCallback(async (centerLat?: number, centerLng?: number) => {
    try {
      setLoading(true);
        let url = `/api/map/csv-data?fileName=${fileName}`;
      
      // Add location parameters if provided
      if (centerLat && centerLng) {
        url += `&centerLat=${centerLat}&centerLng=${centerLng}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.locations)) {
        setLocations(data.locations);
        setGeocodingProgress(100);
      } else {
        throw new Error(data.error || 'Invalid data format received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  }, [fileName]);

  // Load locations for current viewport bounds
  const loadViewportLocations = useCallback(async (bounds: google.maps.LatLngBounds) => {
    try {
      setLoadingViewport(true);
      
      // Calculate center of bounds
      const center = bounds.getCenter();
      const centerLat = center.lat();
      const centerLng = center.lng();
      
      // Calculate bounds area (rough estimate)
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = ne.lat() - sw.lat();
      const lngDiff = ne.lng() - sw.lng();
      const area = latDiff * lngDiff;
      
      // Only load if bounds are significantly different and larger than current
      if (loadedBounds) {
        const currentArea = (loadedBounds.ne.lat - loadedBounds.sw.lat) * (loadedBounds.ne.lng - loadedBounds.sw.lng);
        // Load if area is 5% larger (was 20% before - too conservative)
        if (area < currentArea * 1.05) {
          // New bounds are not significantly larger, skip loading
          setLoadingViewport(false);
          return;
        }
      }
      
      console.log(`🗺️ Loading viewport data for bounds: ${sw.lat()}, ${sw.lng()} to ${ne.lat()}, ${ne.lng()}`);
      
      let url = `/api/map/csv-data?fileName=${fileName}&centerLat=${centerLat}&centerLng=${centerLng}&viewport=true`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.locations)) {
          // Merge with existing locations (lazy loading - don't reload existing)
          setLocations(prevLocations => {
            const existingIds = new Set(prevLocations.map(loc => loc.id));
            const newLocations = data.locations.filter((loc: LocationData) => !existingIds.has(loc.id));
            
            console.log(`🔄 Lazy loading: ${newLocations.length} new locations (${prevLocations.length} existing)`);
            
            return [...prevLocations, ...newLocations];
          });
          
          // Update loaded bounds
          setLoadedBounds({
            ne: { lat: ne.lat(), lng: ne.lng() },
            sw: { lat: sw.lat(), lng: sw.lng() }
          });
        }
      }
    } catch (err) {
      console.error('Error loading viewport data:', err);
    } finally {
      setLoadingViewport(false);
    }
  }, [fileName, loadedBounds]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (filteredLocations.length > 0) {
      createMarkers(map, filteredLocations, false);
    }
    
        // Add bounds change listener for lazy loading
        map.addListener('bounds_changed', () => {
      // Debounce bounds changes to avoid too many API calls
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
      
      boundsChangeTimeoutRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        if (bounds) {
          loadViewportLocations(bounds);
        }
      }, 1000); // 1 second debounce
    });
    
    // Store listener reference for cleanup
    mapRef.current = map;
  }, [filteredLocations, createMarkers, loadViewportLocations]);

  // Get user location on component mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Load CSV data once we have user location
  useEffect(() => {
    if (fileName && userLocation && !locationLoading) {
      console.log(`🗺️ Loading data centered on: ${userLocation.lat}, ${userLocation.lng}`);
      
      // Set a timeout for loading
      loadingTimeoutRef.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout
      
      fetchCSVData(userLocation.lat, userLocation.lng).finally(() => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setLoadingTimeout(false);
      });
    }
  }, [fetchCSVData, fileName, userLocation, locationLoading]);

  // Update markers when filtered locations change
  useEffect(() => {
    if (mapRef.current) {
      // Preserve InfoWindow when filtering (don't close it)
      createMarkers(mapRef.current, filteredLocations, true);
    }
  }, [filteredLocations, createMarkers]);

  // Cleanup markers and timeouts on component unmount
  useEffect(() => {
    return () => {
      clearMarkers();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
    };
  }, [clearMarkers]);

  const getMarkerIcon = (siteType: string) => {
    const category = siteType.toLowerCase();
    // Red = Historic Markers
    if (category.includes('historic marker')) {
      return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    } 
    // Blue = Interpretive/Educational
    else if (category.includes('interpretive') || category.includes('interpetive') || 
             category.includes('library') || category.includes('educational')) {
      return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    } 
    // Green = Monuments and others
    else {
      return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    }
  };


  // Default to St. Louis downtown with closer zoom for better STL area view
  const stLouisDowntown = { lat: 38.6270, lng: -90.1994 };
  
  const mapCenter = userLocation || (filteredLocations.length > 0 
    ? {
        lat: filteredLocations.reduce((sum, loc) => sum + (loc.lat || 0), 0) / filteredLocations.length,
        lng: filteredLocations.reduce((sum, loc) => sum + (loc.lng || 0), 0) / filteredLocations.length
      }
    : stLouisDowntown); // Default to St. Louis downtown

  // Determine zoom level based on location type
  const getZoomLevel = () => {
    if (userLocation) {
      // Check if user is in St. Louis area (within 30 miles)
      const distanceFromSTL = Math.sqrt(
        Math.pow(userLocation.lat - stLouisDowntown.lat, 2) + 
        Math.pow(userLocation.lng - stLouisDowntown.lng, 2)
      ) * 69; // Rough conversion to miles
      
      if (distanceFromSTL <= 30) {
        return 10; // Closer zoom for St. Louis area
      }
    }
    return 7; // Default zoom for Missouri
  };

      if (loadError) {
        return (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl border-2 border-red-300">
            <div className="text-center text-red-800">
              <h3 className="text-xl font-bold mb-3">🗺️ Google Maps API Error</h3>
              <p className="text-base mb-4 font-medium">Failed to load Google Maps. This might be due to:</p>
              <div className="text-sm text-red-700 bg-white p-4 rounded-lg border border-red-200 shadow-md mb-4">
                <ul className="text-left space-y-2">
                  <li>• <strong>Ad blocker</strong> blocking Google Maps requests</li>
                  <li>• <strong>API key</strong> not configured or invalid</li>
                  <li>• <strong>Network issues</strong> preventing API access</li>
                </ul>
              </div>
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                <strong>Error:</strong> {loadError.toString()}
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <p>💡 <strong>Try:</strong> Disable ad blocker, check internet connection, or verify API key</p>
              </div>
            </div>
          </div>
        );
      }

      if (!isLoaded) {
        return (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl border-2 border-blue-300">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 mx-auto mb-6"></div>
              <p className="text-xl font-bold text-blue-800 mb-2">🗺️ Loading Google Maps...</p>
              <p className="text-base text-blue-700 font-medium mb-2">Please ensure your Google Maps API key is configured correctly.</p>
              <div className="text-sm bg-white px-4 py-2 rounded-lg border border-blue-200 shadow-md">
                API Key Status: {process.env.NEXT_PUBLIC_MAP_KEY ? '✅ Configured' : '❌ Missing'}
              </div>
            </div>
          </div>
        );
      }

      if (locationLoading || loading || loadingTimeout) {
        return (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl border-2 border-green-300">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 mx-auto mb-6"></div>
              {loadingTimeout ? (
                <>
                  <p className="text-xl font-bold text-orange-800 mb-2">⏱️ Loading is taking longer than expected...</p>
                  <div className="bg-white px-4 py-2 rounded-lg border border-orange-200 shadow-md mb-4">
                    <p className="text-base text-orange-700 font-medium">This might be due to:</p>
                    <ul className="text-sm text-orange-600 text-left mt-2 space-y-1">
                      <li>• Ad blocker blocking Google Maps</li>
                      <li>• Network connectivity issues</li>
                      <li>• Large dataset processing</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => {
                      setLoadingTimeout(false);
                      setLoading(false);
                      setLocationLoading(false);
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Continue Anyway
                  </button>
                </>
              ) : locationLoading ? (
                <>
                  <p className="text-xl font-bold text-green-800 mb-2">📍 Detecting your location...</p>
                  <div className="bg-white px-4 py-2 rounded-lg border border-green-200 shadow-md">
                    <p className="text-base text-green-700 font-medium">Finding nearby Missouri locations</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-green-800 mb-2">🗺️ Loading map data...</p>
                  <div className="bg-white px-4 py-2 rounded-lg border border-green-200 shadow-md">
                    <p className="text-base text-green-700 font-medium">Progress: {geocodingProgress}%</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="bg-gradient-to-br from-orange-100 to-red-100 border-2 border-orange-300 rounded-xl p-8 text-center shadow-lg">
            <h3 className="text-2xl font-bold text-orange-800 mb-4">⚠️ Map Error</h3>
            <p className="text-lg text-orange-700 font-medium mb-6">{error}</p>
            <button 
              onClick={() => fetchCSVData()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 shadow-md transition-all duration-200 transform hover:scale-105"
            >
              🔄 Retry Loading
            </button>
          </div>
        );
      }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="w-full">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search by organization name, address, tags, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 pl-12 pr-12 text-base text-gray-800 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-200 shadow-lg bg-white placeholder-gray-500"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-3 text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <span className="font-semibold text-blue-800">Searching for:</span> 
            <span className="font-bold text-blue-600 ml-2">"{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200 shadow-lg">
            <label className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg border border-red-200 shadow-md hover:shadow-lg transition-shadow">
              <input
                type="checkbox"
                checked={showMuseums}
                onChange={(e) => setShowMuseums(e.target.checked)}
                className="w-5 h-5 rounded text-red-500 focus:ring-red-300"
              />
              <span className="text-base font-semibold text-red-700">🏛️ Museums, Monuments & Historic Markers</span>
            </label>
            <label className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <input
                type="checkbox"
                checked={showLibraries}
                onChange={(e) => setShowLibraries(e.target.checked)}
                className="w-5 h-5 rounded text-blue-500 focus:ring-blue-300"
              />
              <span className="text-base font-semibold text-blue-700">📚 Libraries & Educational Institutions</span>
            </label>
            <label className="flex items-center space-x-3 bg-white px-4 py-3 rounded-lg border border-green-200 shadow-md hover:shadow-lg transition-shadow">
              <input
                type="checkbox"
                checked={showOthers}
                onChange={(e) => setShowOthers(e.target.checked)}
                className="w-5 h-5 rounded text-green-500 focus:ring-green-300"
              />
              <span className="text-base font-semibold text-green-700">🏢 Other Locations</span>
            </label>
      </div>

      {/* Map */}
      <div className="h-[600px] w-full rounded-xl overflow-hidden border-4 border-blue-300 shadow-2xl">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={getZoomLevel()}
          onLoad={onMapLoad}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        >
                  {selectedLocation && (
                    <InfoWindow
                      position={{ lat: selectedLocation.lat!, lng: selectedLocation.lng! }}
                      onCloseClick={() => setSelectedLocation(null)}
                      options={{
                        pixelOffset: new google.maps.Size(0, -200), // Large offset to ensure InfoWindow stays well above map bottom
                        disableAutoPan: true, // Disable auto-pan to keep InfoWindow static
                        maxWidth: 350,
                        zIndex: 1000
                      }}
                    >
                  <div className="p-4 max-w-sm bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg shadow-lg">
                    <h3 className="font-bold text-xl mb-3 text-blue-800">{selectedLocation.organizationName}</h3>
                    <div className="space-y-2 text-sm">
                      {selectedLocation.yearEstablished && (
                        <p className="bg-white px-3 py-1 rounded border border-blue-200">
                          <span className="font-bold text-green-700">Established:</span> 
                          <span className="text-gray-800 ml-2">{selectedLocation.yearEstablished}</span>
                        </p>
                      )}
                      {selectedLocation.builtPlaced && (
                        <p className="bg-white px-3 py-1 rounded border border-blue-200">
                          <span className="font-bold text-green-700">Built/Placed:</span> 
                          <span className="text-gray-800 ml-2">{selectedLocation.builtPlaced}</span>
                        </p>
                      )}
                      <p className="bg-white px-3 py-1 rounded border border-blue-200">
                        <span className="font-bold text-green-700">Address:</span> 
                        <span className="text-gray-800 ml-2">{selectedLocation.address}</span>
                      </p>
                      <p className="bg-white px-3 py-1 rounded border border-blue-200">
                        <span className="font-bold text-green-700">Category:</span> 
                        <span className="text-gray-800 ml-2">{selectedLocation.siteTypeCategory}</span>
                      </p>
                      {selectedLocation.tertiaryCategories && (
                        <p className="bg-white px-3 py-1 rounded border border-blue-200">
                          <span className="font-bold text-green-700">Tags:</span> 
                          <span className="text-gray-800 ml-2">{selectedLocation.tertiaryCategories}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
        </GoogleMap>
      </div>

      {/* Viewport Loading Indicator */}
      {loadingViewport && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span className="text-sm font-medium">Loading nearby locations...</span>
        </div>
      )}

      {/* Stats */}
      <div className="text-center bg-gradient-to-r from-blue-100 to-green-100 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
        {searchQuery ? (
          <div className="text-lg">
            <span className="font-bold text-blue-800">🔍 Search Results:</span>
            <span className="font-bold text-blue-600 text-xl mx-2">{filteredLocations.length}</span>
            <span className="text-blue-700 font-semibold">results found for</span>
            <span className="font-bold text-blue-600 text-xl mx-2">"{searchQuery}"</span>
            <div className="text-sm text-blue-600 mt-2">
              out of <span className="font-bold">{locations.length}</span> total Missouri locations
            </div>
          </div>
        ) : (
          <div className="text-lg">
            <span className="font-bold text-green-800">📍 Showing</span>
            <span className="font-bold text-green-600 text-xl mx-2">{filteredLocations.length}</span>
            <span className="text-green-700 font-semibold">location{filteredLocations.length !== 1 ? 's' : ''}</span>
            <div className="text-sm text-blue-600 mt-2">
              out of <span className="font-bold">{locations.length}</span> total locations in Missouri
              {loadingViewport && <span className="ml-2 text-green-600">• Loading more...</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
