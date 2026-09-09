import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { RoutePlanner } from './components/RoutePlanner';
import { ReportModal } from './components/ReportModal';
import { SOSModal } from './components/SOSModal';
import { HotspotDetailsDrawer } from './components/HotspotDetailsDrawer';
import { FilterToolbar } from './components/FilterToolbar';
import { UberLocationPicker } from './components/UberLocationPicker';
import { INITIAL_HOTSPOTS, SAFETY_PRESETS } from './data/hotspots';
import { Coordinates, Hotspot, RouteCalculationResult, RoutePoint, SafetyPreset, SeverityLevel } from './types';
import { computeAvoidanceRoutes } from './utils/routingEngine';
import { Map, Navigation, AlertTriangle, ShieldCheck, ListFilter } from 'lucide-react';

const STORAGE_KEY_HOTSPOTS = 'fisura_radar_ba_hotspots';

export default function App() {
  // Hotspots state with localStorage persistence
  const [hotspots, setHotspots] = useState<Hotspot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HOTSPOTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure initial hotspots are present
        const ids = new Set(parsed.map((p: Hotspot) => p.id));
        const combined = [...parsed];
        INITIAL_HOTSPOTS.forEach((ih) => {
          if (!ids.has(ih.id)) {
            combined.push(ih);
          }
        });
        return combined;
      }
    } catch (e) {
      console.warn('Error reading stored hotspots:', e);
    }
    return INITIAL_HOTSPOTS;
  });

  // Active Origin & Destination (No default route loaded)
  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);

  // Selected route option: 'safe' (avoidance bypass) vs 'direct'
  const [selectedRouteType, setSelectedRouteType] = useState<'safe' | 'direct'>('safe');

  // Location picking on map
  const [pickingLocationFor, setPickingLocationFor] = useState<'origin' | 'destination' | 'report' | null>(null);
  const [pendingReportCoords, setPendingReportCoords] = useState<Coordinates | null>(null);

  // Modals & Drawers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [locationPickerTarget, setLocationPickerTarget] = useState<'origin' | 'destination'>('origin');

  // Map settings (Default centered on Buenos Aires)
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [centerCoords, setCenterCoords] = useState<Coordinates>({ lat: -34.6037, lng: -58.3816 });
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | SeverityLevel>('all');
  const [selectedBarrio, setSelectedBarrio] = useState('all');

  // Mobile layout tab
  const [mobileTab, setMobileTab] = useState<'map' | 'planner' | 'list'>('map');

  // Persist hotspots on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HOTSPOTS, JSON.stringify(hotspots));
    } catch (e) {
      console.warn('Failed to persist hotspots to storage:', e);
    }
  }, [hotspots]);

  // Compute avoidance route asynchronously whenever origin, destination or hotspots change
  const [activeRoute, setActiveRoute] = useState<RouteCalculationResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);

  useEffect(() => {
    if (!origin || !destination) {
      setActiveRoute(null);
      setIsCalculatingRoute(false);
      return;
    }

    let isMounted = true;
    setIsCalculatingRoute(true);

    computeAvoidanceRoutes(origin, destination, hotspots)
      .then((result) => {
        if (isMounted) {
          setActiveRoute(result);
          setIsCalculatingRoute(false);
        }
      })
      .catch((err) => {
        console.error('Failed to compute avoidance routes:', err);
        if (isMounted) {
          setIsCalculatingRoute(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [origin, destination, hotspots]);

  // Filtered hotspots based on search & category
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((hs) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = hs.title.toLowerCase().includes(q);
        const matchesBarrio = hs.barrio.toLowerCase().includes(q);
        const matchesCross = hs.crossStreets.toLowerCase().includes(q);
        const matchesDesc = hs.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBarrio && !matchesCross && !matchesDesc) {
          return false;
        }
      }

      // Severity
      if (selectedSeverity !== 'all' && hs.severity !== selectedSeverity) {
        return false;
      }

      // Barrio
      if (selectedBarrio !== 'all' && hs.barrio !== selectedBarrio) {
        return false;
      }

      return true;
    });
  }, [hotspots, searchQuery, selectedSeverity, selectedBarrio]);

  // Available unique barrios for filter
  const availableBarrios = useMemo(() => {
    const set = new Set<string>();
    hotspots.forEach((h) => set.add(h.barrio));
    return Array.from(set).sort();
  }, [hotspots]);

  // Handle map clicks
  const handleMapClickCoordinates = useCallback(
    (coords: Coordinates) => {
      if (pickingLocationFor === 'origin') {
        setOrigin({
          coordinates: coords,
          name: `Punto [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]`,
          address: 'Ubicación seleccionada en el mapa',
        });
        setPickingLocationFor(null);
        setMobileTab('planner');
      } else if (pickingLocationFor === 'destination') {
        setDestination({
          coordinates: coords,
          name: `Punto [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]`,
          address: 'Ubicación seleccionada en el mapa',
        });
        setPickingLocationFor(null);
        setMobileTab('planner');
      } else if (pickingLocationFor === 'report') {
        setPendingReportCoords(coords);
        setPickingLocationFor(null);
        setIsReportModalOpen(true);
      }
    },
    [pickingLocationFor]
  );

  // Swap Origin and Destination
  const handleSwapPoints = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  // Select a preset route
  const handleSelectPreset = (preset: SafetyPreset) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setSelectedRouteType('safe');
    setCenterCoords({
      lat: (preset.origin.coordinates.lat + preset.destination.coordinates.lat) / 2,
      lng: (preset.origin.coordinates.lng + preset.destination.coordinates.lng) / 2,
    });
    setZoomLevel(15);
    setMobileTab('map');
  };

  // Confirm hotspot active status (+1)
  const handleConfirmHotspot = (id: string) => {
    setHotspots((prev) =>
      prev.map((hs) => {
        if (hs.id === id) {
          return { ...hs, confirmedCount: hs.confirmedCount + 1 };
        }
        return hs;
      })
    );
    if (selectedHotspot && selectedHotspot.id === id) {
      setSelectedHotspot((prev) => (prev ? { ...prev, confirmedCount: prev.confirmedCount + 1 } : null));
    }
  };

  // Save new community report
  const handleSaveReport = (newHotspot: Hotspot) => {
    setHotspots((prev) => [newHotspot, ...prev]);
    setCenterCoords({ lat: newHotspot.lat, lng: newHotspot.lng });
    setZoomLevel(16);
    setSelectedHotspot(newHotspot);
    setPendingReportCoords(null);
  };

  // Geolocation request
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setCenterCoords(coords);
          setZoomLevel(16);
        },
        (err) => {
          // Fallback simulation: Obelisco / 9 de Julio Buenos Aires
          const defaultBACoords = { lat: -34.6037, lng: -58.3816 };
          setUserLocation(defaultBACoords);
          setCenterCoords(defaultBACoords);
          setZoomLevel(15);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Select location from Uber picker
  const handleSelectLocationPoint = (field: 'origin' | 'destination', point: RoutePoint) => {
    if (field === 'origin') {
      setOrigin(point);
    } else {
      setDestination(point);
    }
    setCenterCoords(point.coordinates);
    setZoomLevel(15);
  };

  // Reset to Buenos Aires center
  const handleCenterBuenosAires = () => {
    setCenterCoords({ lat: -34.6037, lng: -58.3816 });
    setZoomLevel(13);
  };

  // Share safe route by WhatsApp
  const handleShareWhatsApp = () => {
    if (!activeRoute || !origin || !destination) return;
    const text = encodeURIComponent(
      `🛡️ Ruta Segura DodgeFisura (Buenos Aires):\n` +
      `De: ${origin.name}\nHasta: ${destination.name}\n` +
      `Duración estimada: ~${activeRoute.safeRoute.durationMinutes} min (${activeRoute.safeRoute.distanceKm} km)\n` +
      `Seguridad: 96% (Esquiva ${activeRoute.avoidedHotspots.length} focos críticos).\n` +
      `¡Te aviso en cuanto llegue a casa!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const activeHazardsCount = useMemo(() => {
    return hotspots.filter((h) => h.severity === 'high').length;
  }, [hotspots]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Top Tactical Navigation */}
      <Navbar
        mapTheme={mapTheme}
        onToggleTheme={() => setMapTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenReportModal={() => {
          setPendingReportCoords(null);
          setIsReportModalOpen(true);
        }}
        onOpenSOSModal={() => setIsSOSModalOpen(true)}
        totalHotspots={hotspots.length}
        activeHazardsCount={activeHazardsCount}
        onCenterBuenosAires={handleCenterBuenosAires}
        onLocateMe={handleLocateMe}
      />

      {/* Filter Toolbar */}
      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
        selectedBarrio={selectedBarrio}
        onSelectBarrio={setSelectedBarrio}
        availableBarrios={availableBarrios}
        totalVisible={filteredHotspots.length}
      />

      {/* Main Workspace (Sidebar + Interactive Map) */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Sidebar: Route Planner & Community Feed (Desktop visible, Mobile controlled by tabs) */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] shrink-0 h-full overflow-hidden ${
            mobileTab === 'planner' || mobileTab === 'list' ? 'block' : 'hidden md:block'
          }`}
        >
          {mobileTab === 'list' ? (
            <div className="h-full bg-zinc-900 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-bold text-sm text-white">Lista de Puntos Reportados</h3>
                <span className="text-xs text-zinc-400">{filteredHotspots.length} focos</span>
              </div>
              <div className="space-y-2">
                {filteredHotspots.map((hs) => (
                  <div
                    key={hs.id}
                    onClick={() => {
                      setSelectedHotspot(hs);
                      setCenterCoords({ lat: hs.lat, lng: hs.lng });
                      setZoomLevel(16);
                      setMobileTab('map');
                    }}
                    className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hs.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : hs.severity === 'medium'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {hs.severity === 'high' ? '🔴 Alto' : hs.severity === 'medium' ? '🟠 Medio' : '🟡 Leve'}
                      </span>
                      <span className="text-[10px] text-zinc-500">{hs.reportedAt}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-200">{hs.title}</h4>
                    <p className="text-[11px] text-zinc-400">{hs.crossStreets} ({hs.barrio})</p>
                    <p className="text-[11px] text-zinc-300 line-clamp-2">{hs.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <RoutePlanner
              origin={origin}
              destination={destination}
              activeRoute={activeRoute}
              selectedRouteType={selectedRouteType}
              onSelectRouteType={setSelectedRouteType}
              onSetOrigin={setOrigin}
              onSetDestination={setDestination}
              onSwapPoints={handleSwapPoints}
              onOpenLocationPicker={(field) => {
                setLocationPickerTarget(field);
                setIsLocationPickerOpen(true);
              }}
              onStartPicking={(type) => {
                setPickingLocationFor(type);
                setMobileTab('map');
              }}
              onSelectPreset={handleSelectPreset}
              presets={SAFETY_PRESETS}
              isCalculating={isCalculatingRoute}
              onShareWhatsApp={handleShareWhatsApp}
            />
          )}
        </div>

        {/* Right Area: Interactive Leaflet Map */}
        <div
          className={`flex-1 h-full relative ${
            mobileTab === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <MapComponent
            hotspots={filteredHotspots}
            activeRoute={activeRoute}
            selectedRouteType={selectedRouteType}
            origin={origin}
            destination={destination}
            mapTheme={mapTheme}
            pickingLocationFor={pickingLocationFor}
            onCancelPicking={() => setPickingLocationFor(null)}
            onMapClickCoordinates={handleMapClickCoordinates}
            onSelectHotspot={setSelectedHotspot}
            onConfirmHotspot={handleConfirmHotspot}
            userLocation={userLocation}
            centerCoords={centerCoords}
            zoomLevel={zoomLevel}
          />
        </div>
      </div>

      {/* Mobile Tab Selector (Fixed Bottom) */}
      <div className="md:hidden flex items-center justify-around bg-zinc-900 border-t border-zinc-800 p-2 z-30">
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-4 rounded-lg font-semibold transition ${
            mobileTab === 'map' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Mapa</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('planner')}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-4 rounded-lg font-semibold transition ${
            mobileTab === 'planner' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Ruta Segura</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex flex-col items-center gap-1 text-[11px] py-1 px-4 rounded-lg font-semibold transition ${
            mobileTab === 'list' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Alertas</span>
        </button>
      </div>

      {/* Selected Hotspot Details Drawer */}
      <HotspotDetailsDrawer
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        onConfirmHotspot={handleConfirmHotspot}
        onSetAvoidTarget={(hs) => {
          // Set destination or route nearby to trigger safe bypass
          setSelectedHotspot(null);
        }}
      />

      {/* Community Report Hotspot Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSaveReport={handleSaveReport}
        initialCoords={pendingReportCoords}
        onPickCoordsOnMap={() => setPickingLocationFor('report')}
      />

      {/* Emergency 911 SOS & Companion Modal */}
      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        userCoords={userLocation}
      />

      {/* Uber-style Starting & Ending Point Selector */}
      <UberLocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        targetField={locationPickerTarget}
        currentOrigin={origin}
        currentDestination={destination}
        onSelectPoint={handleSelectLocationPoint}
        onPickOnMap={(field) => {
          setPickingLocationFor(field);
          setMobileTab('map');
        }}
        userCoords={userLocation}
        onRequestGeolocation={handleLocateMe}
      />
    </div>
  );
}
