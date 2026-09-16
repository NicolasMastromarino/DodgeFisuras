import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { Navigation, Maximize2, Check, X } from 'lucide-react';
import { Coordinates } from '../types';

interface ReportMiniMapProps {
  coordinates: Coordinates | null;
  onChangeCoordinates: (coords: Coordinates) => void;
  mapTheme: 'dark' | 'light';
  selectedBarrio?: string;
  userLocation?: Coordinates | null;
  onOpenFullScreenPicker?: () => void;
}

const BARRIO_CENTERS: Record<string, Coordinates> = {
  'Balvanera / Once': { lat: -34.6105, lng: -58.406 },
  'Constitución': { lat: -34.6278, lng: -58.3817 },
  'Retiro': { lat: -34.5912, lng: -58.3752 },
  'Congreso / San Nicolás': { lat: -34.6095, lng: -58.3926 },
  'San Telmo': { lat: -34.6212, lng: -58.3732 },
  'Recoleta': { lat: -34.5875, lng: -58.3974 },
  'Palermo': { lat: -34.5781, lng: -58.4265 },
  'Almagro': { lat: -34.6104, lng: -58.4237 },
  'Chacarita': { lat: -34.5878, lng: -58.4552 },
  'Flores': { lat: -34.63, lng: -58.4635 },
  'Caballito': { lat: -34.62, lng: -58.44 },
  'Barracas': { lat: -34.6465, lng: -58.3845 },
  'La Boca': { lat: -34.635, lng: -58.3645 },
  'Belgrano': { lat: -34.5615, lng: -58.456 },
  'Monserrat': { lat: -34.613, lng: -58.382 },
  'Villa Crespo': { lat: -34.598, lng: -58.441 },
};

/**
 * Full-screen map overlay rendered via React Portal directly into document.body
 * Guarantees fresh, non-detached Leaflet lifecycle, responsive tiles, and zero clipping.
 */
interface ReportExpandedMapModalProps {
  initialCoords: Coordinates;
  onChangeCoordinates: (coords: Coordinates) => void;
  onClose: () => void;
  mapTheme: 'dark' | 'light';
  selectedBarrio?: string;
  userLocation?: Coordinates | null;
}

const ReportExpandedMapModal: React.FC<ReportExpandedMapModalProps> = ({
  initialCoords,
  onChangeCoordinates,
  onClose,
  mapTheme,
  selectedBarrio,
  userLocation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [activeCoords, setActiveCoords] = useState<Coordinates>(initialCoords);

  useEffect(() => {
    if (!containerRef.current) return;

    // Fresh Leaflet map dedicated to full-screen view
    const map = L.map(containerRef.current, {
      center: [initialCoords.lat, initialCoords.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // 100% Free OpenStreetMap HOT Tiles - zero watermark
    const tileUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abc',
      className: mapTheme === 'dark' ? 'leaflet-tile-dark' : '',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Draggable custom pin icon
    const pinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer" style="width: 44px; height: 44px;">
          <div class="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping"></div>
          <div class="w-10 h-10 rounded-2xl bg-rose-600 border-2 border-white shadow-2xl flex items-center justify-center text-white text-xl font-bold">
            📍
          </div>
        </div>
      `,
      className: 'report-mini-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const marker = L.marker([initialCoords.lat, initialCoords.lng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const latLng = (e.target as L.Marker).getLatLng();
      const updated = { lat: latLng.lat, lng: latLng.lng };
      setActiveCoords(updated);
      onChangeCoordinates(updated);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      const updated = { lat: e.latlng.lat, lng: e.latlng.lng };
      setActiveCoords(updated);
      onChangeCoordinates(updated);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Staggered size invalidation to ensure tiles load fully across all devices
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapTheme]);

  const handleUseGPS = () => {
    if (userLocation && mapRef.current && markerRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16);
      markerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      setActiveCoords(userLocation);
      onChangeCoordinates(userLocation);
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (mapRef.current && markerRef.current) {
            mapRef.current.flyTo([coords.lat, coords.lng], 16);
            markerRef.current.setLatLng([coords.lat, coords.lng]);
          }
          setActiveCoords(coords);
          onChangeCoordinates(coords);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleJumpToBarrio = (barrioName: string) => {
    const center = BARRIO_CENTERS[barrioName];
    if (center && mapRef.current && markerRef.current) {
      mapRef.current.flyTo([center.lat, center.lng], 16);
      markerRef.current.setLatLng([center.lat, center.lng]);
      setActiveCoords(center);
      onChangeCoordinates(center);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-zinc-950 flex flex-col animate-in fade-in duration-200">
      {/* Top Bar Controls */}
      <div className="px-4 py-3 bg-zinc-900/95 border-b border-zinc-800 flex items-center justify-between gap-3 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <span>📍 Modo Mapa Grande</span>
              <span className="text-[11px] font-normal text-zinc-400 hidden sm:inline">
                Haz clic en cualquier esquina o arrastra el pin
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-gps-expanded-map"
            onClick={handleUseGPS}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Mi GPS</span>
          </button>

          <button
            type="button"
            id="btn-close-expanded-map"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Check className="w-4 h-4" />
            <span>Guardar y Volver</span>
          </button>
        </div>
      </div>

      {/* Barrio Quick Selector Carousel */}
      <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-xs z-10 shrink-0">
        <span className="text-zinc-500 text-[11px] font-medium shrink-0">Saltar a barrio:</span>
        {Object.keys(BARRIO_CENTERS).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => handleJumpToBarrio(b)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition ${
              selectedBarrio === b
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Full Screen Map Canvas Wrapper */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-zinc-950">
        <div ref={containerRef} className="w-full h-full cursor-crosshair" />

        {/* Bottom Floating Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] px-5 py-3 rounded-2xl bg-zinc-900/95 border border-zinc-700 shadow-2xl flex items-center justify-between gap-4 text-xs backdrop-blur-md max-w-[94vw] sm:max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shrink-0">
              📍
            </div>
            <div>
              <p className="font-bold text-zinc-100 font-mono text-xs">
                [{activeCoords.lat.toFixed(4)}, {activeCoords.lng.toFixed(4)}]
              </p>
              <p className="text-[11px] text-zinc-400">
                Punto seleccionado para el reporte
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-confirm-coords-expanded"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition flex items-center gap-1 shrink-0"
          >
            <span>✓ Confirmar</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ReportMiniMap: React.FC<ReportMiniMapProps> = ({
  coordinates,
  onChangeCoordinates,
  mapTheme,
  selectedBarrio,
  userLocation,
  onOpenFullScreenPicker,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const initialLat = coordinates?.lat ?? userLocation?.lat ?? -34.6037;
  const initialLng = coordinates?.lng ?? userLocation?.lng ?? -58.3816;

  // Initialize Small Embedded Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean OpenStreetMap HOT tiles - zero watermark, zero API key required
    const tileUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abc',
      className: mapTheme === 'dark' ? 'leaflet-tile-dark' : '',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Small zoom control on bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Draggable custom pin icon
    const pinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer" style="width: 44px; height: 44px;">
          <div class="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping"></div>
          <div class="w-10 h-10 rounded-2xl bg-rose-600 border-2 border-white shadow-2xl flex items-center justify-center text-white text-xl font-bold">
            📍
          </div>
        </div>
      `,
      className: 'report-mini-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const latLng = (e.target as L.Marker).getLatLng();
      onChangeCoordinates({ lat: latLng.lat, lng: latLng.lng });
    });

    // Map click handler to relocate pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Handle container sizing when modal opens
    const t1 = setTimeout(() => map.invalidateSize(), 60);
    const t2 = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update theme on tile layer
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);
    const tileUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abc',
      className: mapTheme === 'dark' ? 'leaflet-tile-dark' : '',
    }).addTo(mapRef.current);
  }, [mapTheme]);

  // Update marker position when coordinates change (including from expanded modal)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current || !coordinates) return;
    const current = markerRef.current.getLatLng();
    if (
      Math.abs(current.lat - coordinates.lat) > 0.00005 ||
      Math.abs(current.lng - coordinates.lng) > 0.00005
    ) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      mapRef.current.panTo([coordinates.lat, coordinates.lng]);
    }
  }, [coordinates]);

  // Pan to barrio center when selectedBarrio changes
  useEffect(() => {
    if (!selectedBarrio || !mapRef.current || !markerRef.current) return;
    const center = BARRIO_CENTERS[selectedBarrio];
    if (center && (!coordinates || coordinates.lat === -34.6037)) {
      mapRef.current.flyTo([center.lat, center.lng], 15);
      markerRef.current.setLatLng([center.lat, center.lng]);
      onChangeCoordinates(center);
    }
  }, [selectedBarrio]);

  const handleUseGPS = () => {
    if (userLocation && mapRef.current && markerRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16);
      markerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      onChangeCoordinates(userLocation);
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          mapRef.current?.flyTo([coords.lat, coords.lng], 16);
          markerRef.current?.setLatLng([coords.lat, coords.lng]);
          onChangeCoordinates(coords);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const displayCoords = coordinates || { lat: initialLat, lng: initialLng };

  return (
    <>
      {/* Expanded Full-Screen Map Modal via Portal */}
      {isExpanded && (
        <ReportExpandedMapModal
          initialCoords={displayCoords}
          onChangeCoordinates={onChangeCoordinates}
          onClose={() => setIsExpanded(false)}
          mapTheme={mapTheme}
          selectedBarrio={selectedBarrio}
          userLocation={userLocation}
        />
      )}

      {/* Standard Form Embedded Mini-Map - always remains mounted in the form */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">📍</span>
            <span>Ubicación en el Mapa *</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-use-gps-mini-map"
              onClick={handleUseGPS}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition"
              title="Usar mi ubicación GPS"
            >
              <Navigation className="w-3 h-3" />
              <span>Mi GPS</span>
            </button>
            <button
              type="button"
              id="btn-open-expanded-map"
              onClick={() => setIsExpanded(true)}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 hover:border-rose-500/40"
              title="Abrir en mapa grande"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Mapa grande</span>
            </button>
          </div>
        </div>

        {/* Interactive Map Canvas */}
        <div className="relative w-full h-48 sm:h-52 rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-950 shadow-inner">
          <div ref={containerRef} className="w-full h-full cursor-crosshair" />

          {/* Bottom coordinate badge */}
          <div className="absolute bottom-2 left-2 z-[400] px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700 text-[10px] text-zinc-200 pointer-events-none backdrop-blur-sm flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-medium">
              [{displayCoords.lat.toFixed(4)}, {displayCoords.lng.toFixed(4)}]
            </span>
          </div>

          {/* Quick expand button overlay in map corner */}
          <button
            type="button"
            id="btn-expand-corner-overlay"
            onClick={() => setIsExpanded(true)}
            className="absolute top-2 left-2 z-[400] px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-200 font-medium flex items-center gap-1 shadow-md transition"
          >
            <Maximize2 className="w-3 h-3 text-rose-400" />
            <span>Expandir mapa</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Toca el mapa o arrastra el marcador 📍 para ubicar la esquina.</span>
          {onOpenFullScreenPicker && (
            <button
              type="button"
              onClick={onOpenFullScreenPicker}
              className="text-zinc-500 hover:text-zinc-300 underline text-[10px] transition shrink-0"
            >
              o en mapa de fondo
            </button>
          )}
        </div>
      </div>
    </>
  );
};

