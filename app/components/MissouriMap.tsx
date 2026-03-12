'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
// LocationList is now embedded in SearchOverlay; the map will broadcast locations via
// a window event so the overlay can render them.
import MapPopup from './layers/MapPopup';
import SearchOverlay from './layers/SearchOverlay';

export interface LocationData {
  id: string;
  organizationName: string;
  yearEstablished?: string;
  builtPlaced?: string;
  address?: string;
  siteTypeCategory?: string;
  tertiaryCategories?: string;
  lat?: number;
  lng?: number;
}

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

interface MissouriMapProps {
  fileName: string;
}

export default function MissouriMap({ fileName }: MissouriMapProps) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [showMuseums, setShowMuseums] = useState(true);
  const [showLibraries, setShowLibraries] = useState(true);
  const [showOthers, setShowOthers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [loadedBounds, setLoadedBounds] = useState<any>(null);
  const [loadingViewport, setLoadingViewport] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const markersRef = useRef<any[]>([]);
  // switch to a Map keyed by location id for incremental updates
  // markersRef.current: Map<string, google.maps.Marker>
  const markerMapRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Location list state
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [showDetailed, setShowDetailed] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_MAP_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      '',
    libraries,
    version: 'weekly',
    preventGoogleFontsLoading: true,
  });

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Rough Missouri bounds
          const isInMissouri =
            lat >= 35.9957 &&
            lat <= 40.6136 &&
            lng >= -95.7731 &&
            lng <= -89.0989;
          if (isInMissouri) setUserLocation({ lat, lng });
          else setUserLocation({ lat: 38.627, lng: -90.1994 });
          setLocationLoading(false);
        },
        () => {
          setUserLocation({ lat: 38.627, lng: -90.1994 });
          setLocationLoading(false);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      setUserLocation({ lat: 38.627, lng: -90.1994 });
      setLocationLoading(false);
    }
  }, []);

  // Clear markers
  const clearMarkers = useCallback((closeInfoWindow = true) => {
    try {
      markerMapRef.current.forEach(
        marker => marker?.setMap && marker.setMap(null)
      );
      markerMapRef.current.clear();
    } catch (e) {
      console.warn('[Map] clearMarkers error', e);
    }
    if (closeInfoWindow) setSelectedLocation(null);
  }, []);

  const getMarkerIcon = (siteType?: string) => {
    const category = (siteType || '').toLowerCase();
    if (category.includes('historic marker'))
      return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    if (
      category.includes('interpretive') ||
      category.includes('interpetive') ||
      category.includes('library') ||
      category.includes('educational')
    )
      return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
  };

  const createMarkers = useCallback(
    (
      map: google.maps.Map,
      list: LocationData[],
      preserveInfoWindow = false
    ) => {
      // Diff-based marker updates: add new, remove missing, update existing
      try {
        // Diagnostic log: list/sample and map presence
        console.debug('[Map] createMarkers called', {
          listLength: list?.length,
          mapExists: !!map,
          mapRefExists: !!mapRef.current,
        });
        if (list && list.length > 0)
          console.debug(
            '[Map] createMarkers sample',
            JSON.stringify(
              list.slice(0, 3).map(l => ({
                id: l.id,
                lat: l.lat,
                lng: l.lng,
                name: l.organizationName,
              }))
            ),
            '...'
          );

        // Use a stable key for each location: prefer explicit id, fall back to lat/lng pair
        const getLocKey = (l: LocationData) =>
          l.id ? String(l.id) : `${l.lat}:${l.lng}`;
        const newIds = new Set(list.map(l => getLocKey(l)));

        // Remove markers that are no longer present
        for (const [id, marker] of markerMapRef.current.entries()) {
          if (!newIds.has(id)) {
            marker.setMap(null);
            markerMapRef.current.delete(id);
          }
        }

        // Add or update markers for current list
        list.forEach(location => {
          if (!location.lat || !location.lng) return;
          const locKey = getLocKey(location);
          const existing = markerMapRef.current.get(locKey);
          if (existing) {
            // Update position/icon/title if changed
            const pos = existing.getPosition();
            if (
              !pos ||
              pos.lat() !== location.lat ||
              pos.lng() !== location.lng
            ) {
              existing.setPosition({ lat: location.lat, lng: location.lng });
            }
            const newIconUrl = getMarkerIcon(location.siteTypeCategory);
            const curIcon = existing.getIcon();
            let curIconUrl: string | undefined;
            if (typeof curIcon === 'string') curIconUrl = curIcon as string;
            else if (curIcon && typeof curIcon === 'object' && 'url' in curIcon)
              curIconUrl = (curIcon as any).url;
            else curIconUrl = undefined;
            if (curIconUrl !== newIconUrl) {
              existing.setIcon({
                url: newIconUrl,
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16),
              });
            }
            if (existing.getTitle() !== location.organizationName)
              existing.setTitle(location.organizationName);
          } else {
            const marker = new google.maps.Marker({
              position: { lat: location.lat, lng: location.lng },
              icon: {
                url: getMarkerIcon(location.siteTypeCategory),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16),
              },
              map,
              title: location.organizationName,
            });
            marker.addListener('click', () => {
              console.debug('[Map] marker clicked', locKey);
              setSelectedLocation(location);
              setSelectedLocationId(location.id ?? locKey);
              setShowDetailed(false);
            });
            markerMapRef.current.set(locKey, marker);
          }
        });

        console.debug(
          '[Map] createMarkers: total markers=',
          markerMapRef.current.size,
          'preserveInfoWindow=',
          preserveInfoWindow
        );
        if (!preserveInfoWindow) setSelectedLocation(null);
      } catch (e) {
        console.error('[Map] createMarkers error', e);
      }
    },
    [getMarkerIcon, setShowDetailed]
  );

  const filteredLocations = locations.filter(location => {
    if (
      !location.lat ||
      !location.lng ||
      location.lat === 0 ||
      location.lng === 0
    )
      return false;
    const category = (location.siteTypeCategory || '').toLowerCase();
    let categoryMatch = false;
    if (category.includes('historic marker')) categoryMatch = showMuseums;
    else if (
      category.includes('interpretive') ||
      category.includes('interpetive') ||
      category.includes('library') ||
      category.includes('educational')
    )
      categoryMatch = showLibraries;
    else categoryMatch = showOthers;
    if (!categoryMatch) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchableText = [
        location.organizationName,
        location.address,
        location.siteTypeCategory,
        location.tertiaryCategories,
        location.yearEstablished,
        location.builtPlaced,
      ]
        .join(' ')
        .toLowerCase();
      return searchableText.includes(query);
    }
    return true;
  });

  const fetchCSVData = useCallback(
    async (centerLat?: number, centerLng?: number) => {
      try {
        setLoading(true);
        let url = `/api/map/csv-data?fileName=${fileName}`;
        if (centerLat && centerLng)
          url += `&centerLat=${centerLat}&centerLng=${centerLng}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText || 'Failed to fetch');
        const data = await res.json();
        if (data.success && Array.isArray(data.locations))
          setLocations(data.locations);
        else throw new Error(data.error || 'Invalid data');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    [fileName]
  );

  const loadViewportLocations = useCallback(
    async (bounds: google.maps.LatLngBounds) => {
      try {
        setLoadingViewport(true);
        const center = bounds.getCenter();
        const centerLat = center.lat();
        const centerLng = center.lng();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latDiff = ne.lat() - sw.lat();
        const lngDiff = ne.lng() - sw.lng();
        const area = latDiff * lngDiff;
        if (loadedBounds) {
          const currentArea =
            (loadedBounds.ne.lat - loadedBounds.sw.lat) *
            (loadedBounds.ne.lng - loadedBounds.sw.lng);
          if (area < currentArea * 1.05) {
            setLoadingViewport(false);
            return;
          }
        }
        let url = `/api/map/csv-data?fileName=${fileName}&centerLat=${centerLat}&centerLng=${centerLng}&viewport=true`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.locations)) {
            setLocations(prev => {
              const existing = new Set(prev.map(p => p.id));
              const newLocs = data.locations.filter(
                (l: LocationData) => !existing.has(l.id)
              );
              return [...prev, ...newLocs];
            });
            setLoadedBounds({
              ne: { lat: ne.lat(), lng: ne.lng() },
              sw: { lat: sw.lat(), lng: sw.lng() },
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingViewport(false);
      }
    },
    [fileName, loadedBounds]
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      console.debug(
        '[Map] onMapLoad - filteredLocations=',
        filteredLocations.length
      );
      if (filteredLocations.length > 0)
        createMarkers(map, filteredLocations, false);
      map.addListener('bounds_changed', () => {
        if (boundsChangeTimeoutRef.current)
          clearTimeout(boundsChangeTimeoutRef.current);
        boundsChangeTimeoutRef.current = setTimeout(() => {
          const bounds = map.getBounds();
          if (bounds) loadViewportLocations(bounds);
        }, 1000);
      });
    },
    [filteredLocations, createMarkers, loadViewportLocations]
  );

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    if (fileName && userLocation && !locationLoading) {
      loadingTimeoutRef.current = setTimeout(
        () => setLoadingTimeout(true),
        10000
      );
      fetchCSVData(userLocation.lat, userLocation.lng).finally(() => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setLoadingTimeout(false);
      });
    }
  }, [fetchCSVData, fileName, userLocation, locationLoading]);

  useEffect(() => {
    console.debug(
      '[Map] useEffect(filteredLocations) run, count=',
      filteredLocations.length
    );
    if (mapRef.current) createMarkers(mapRef.current, filteredLocations, true);
  }, [filteredLocations, createMarkers]);

  // Clean up markers and timeouts when the component unmounts
  useEffect(() => {
    return () => {
      clearMarkers();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (boundsChangeTimeoutRef.current)
        clearTimeout(boundsChangeTimeoutRef.current);
    };
  }, [clearMarkers]);

  // Map center and zoom helpers
  const stLouisDowntown = { lat: 38.627, lng: -90.1994 };
  const mapCenter =
    userLocation ||
    (filteredLocations.length > 0
      ? {
          lat:
            filteredLocations.reduce((s, l) => s + (l.lat || 0), 0) /
            filteredLocations.length,
          lng:
            filteredLocations.reduce((s, l) => s + (l.lng || 0), 0) /
            filteredLocations.length,
        }
      : stLouisDowntown);
  const getZoomLevel = () => {
    if (userLocation) {
      const distanceFromSTL =
        Math.sqrt(
          Math.pow(userLocation.lat - stLouisDowntown.lat, 2) +
            Math.pow(userLocation.lng - stLouisDowntown.lng, 2)
        ) * 69;
      if (distanceFromSTL <= 30) return 10;
    }
    return 7;
  };

  const handleZoomIn = () => {
    if (!mapRef.current) return;
    const currentZoom = mapRef.current.getZoom() ?? getZoomLevel();
    mapRef.current.setZoom(currentZoom + 1);
  };

  const handleZoomOut = () => {
    if (!mapRef.current) return;
    const currentZoom = mapRef.current.getZoom() ?? getZoomLevel();
    mapRef.current.setZoom(currentZoom - 1);
  };

  const handleCenterOnUser = () => {
    if (!mapRef.current || !userLocation) return;
    try {
      mapRef.current.panTo(userLocation);
      const currentZoom = mapRef.current.getZoom() ?? getZoomLevel();
      mapRef.current.setZoom(Math.max(currentZoom, 10));
    } catch (e) {
      console.warn('[Map] center on user failed', e);
    }
  };

  // When a location is selected from the list, center the map and open the popup
  const handleLocationSelect = useCallback((loc: LocationData) => {
    setSelectedLocation(loc);
    setSelectedLocationId(loc.id);
    setShowDetailed(false);
    if (mapRef.current && loc.lat && loc.lng) {
      try {
        mapRef.current.panTo({ lat: loc.lat, lng: loc.lng });
        mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || 8, 12));
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  // Register handler for selections coming from the SearchOverlay's LocationList
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.location) {
        handleLocationSelect(detail.location);
      }
    };
    window.addEventListener('search-overlay-select', handler as EventListener);
    return () =>
      window.removeEventListener(
        'search-overlay-select',
        handler as EventListener
      );
  }, [handleLocationSelect]);

  // Render fallbacks
  if (loadError)
    return (
      <div className="text-red-600">
        Google Maps API Error: {String(loadError)}
      </div>
    );
  if (!isLoaded)
    return <div className="text-center">Loading Google Maps...</div>;
  if (locationLoading || loading || loadingTimeout)
    return <div className="text-center">Loading map data...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Map - fill remaining vertical space provided by parent */}
      <div className="relative flex-1 min-h-0 w-full rounded-none sm:rounded-lg md:rounded-xl overflow-hidden border-0 sm:border-2 md:border-4 border-blue-300 shadow-none sm:shadow-lg md:shadow-2xl">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={getZoomLevel()}
          onLoad={onMapLoad}
          onClick={() => {
            setSelectedLocation(null);
            setSelectedLocationId(null);
            setShowDetailed(false);
          }}
          options={{
            // Minimal UI: disable default controls to remove Pegman and extra boxes
            disableDefaultUI: true,
            // keep map type as roadmap
            mapTypeId: 'roadmap',
            // explicitly disable other controls we don't want
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            panControl: false,
            rotateControl: false,
            mapTypeControl: false,
            scaleControl: false,
            // Better touch interaction on mobile
            gestureHandling: 'greedy',
          }}
        >
          {selectedLocation && (
            <MapPopup
              location={selectedLocation}
              detailed={showDetailed}
              onClose={() => {
                setSelectedLocation(null);
                setShowDetailed(false);
              }}
              onDetails={() => setShowDetailed(true)}
            />
          )}
        </GoogleMap>
        {/* Custom zoom and center controls */}
        <div className="pointer-events-none absolute right-3 top-3 z-50 flex flex-col gap-2 sm:right-4 sm:top-4">
          <button
            type="button"
            onClick={handleZoomIn}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900/90 text-lg font-bold text-white shadow-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#EAAB00]"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900/90 text-lg font-bold text-white shadow-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#EAAB00]"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={handleCenterOnUser}
            className="pointer-events-auto mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/90 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#EAAB00]"
            aria-label="Center map on your location"
            disabled={!userLocation}
          >
            ⦿
          </button>
        </div>
        {/* Inline location list overlay inside the map viewport */}
        {/* LocationList moved into SearchOverlay; we broadcast filteredLocations via a window event. */}

        {/* Search overlay (left side). Filters appear when input is focused */}
        <SearchOverlay
          value={searchQuery}
          onChange={setSearchQuery}
          showMuseums={showMuseums}
          setShowMuseums={setShowMuseums}
          showLibraries={showLibraries}
          setShowLibraries={setShowLibraries}
          showOthers={showOthers}
          setShowOthers={setShowOthers}
          locations={filteredLocations}
          onSelect={handleLocationSelect}
        />
      </div>

      {/* Viewport Loading Indicator */}
      {loadingViewport && (
        <div className="fixed top-16 sm:top-4 right-2 sm:right-4 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg z-10 flex items-center space-x-2 text-xs sm:text-sm">
          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
          <span className="font-medium">Loading nearby locations...</span>
        </div>
      )}

      {/* Stats */}
      <div className="text-center bottom-stats text-zinc-300 p-3 sm:p-4 md:p-6 border-2 shadow-lg mx-2 sm:mx-0">
        {searchQuery ? (
          <div className="text-sm sm:text-base md:text-lg">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <span className="font-bold">🔍 Search Results:</span>
              <span className="font-bold text-lg sm:text-xl">
                {filteredLocations.length}
              </span>
              <span className="font-semibold text-xs sm:text-sm md:text-base">
                results found for
              </span>
              <span className="font-bold text-base sm:text-lg md:text-xl wrap-break-word">
                "{searchQuery}"
              </span>
            </div>
            <div className="text-xs sm:text-sm mt-2">
              out of <span className="font-bold">{locations.length}</span> total
              Missouri locations
            </div>
          </div>
        ) : (
          <div className="text-sm sm:text-base md:text-lg">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <span className="font-bold">📍 Showing</span>
              <span className="font-bold text-lg sm:text-xl">
                {filteredLocations.length}
              </span>
              <span className="font-semibold text-xs sm:text-sm md:text-base">
                location{filteredLocations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs sm:text-sm mt-2">
              out of <span className="font-bold">{locations.length}</span> total
              locations in Missouri
              {loadingViewport && (
                <span className="ml-2">• Loading more...</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
