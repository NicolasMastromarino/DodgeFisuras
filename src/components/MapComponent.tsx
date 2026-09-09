import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates, Hotspot, RouteCalculationResult, RoutePoint } from '../types';

interface MapComponentProps {
  hotspots: Hotspot[];
  activeRoute: RouteCalculationResult | null;
  selectedRouteType: 'safe' | 'direct';
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  mapTheme: 'dark' | 'light';
  pickingLocationFor: 'origin' | 'destination' | 'report' | null;
  onMapClickCoordinates: (coords: Coordinates) => void;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onConfirmHotspot: (id: string) => void;
  userLocation: Coordinates | null;
  centerCoords: Coordinates;
  zoomLevel: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  hotspots,
  activeRoute,
  selectedRouteType,
  origin,
  destination,
  mapTheme,
  pickingLocationFor,
  onMapClickCoordinates,
  onSelectHotspot,
  onConfirmHotspot,
  userLocation,
  centerCoords,
  zoomLevel
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerCoords.lat, centerCoords.lng],
      zoom: zoomLevel,
      zoomControl: false,
    });

    // Add Zoom Control to bottom right to avoid header conflict
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layers groups
    circlesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    userLocationLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tiles based on theme
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      className: mapTheme === 'dark' ? 'leaflet-tile-night' : '',
      attribution,
    }).addTo(mapInstanceRef.current);
  }, [mapTheme]);

  // Center/Zoom updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([centerCoords.lat, centerCoords.lng], zoomLevel);
  }, [centerCoords, zoomLevel]);

  // Handle Map Clicks for picking coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      onMapClickCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [onMapClickCoordinates]);

  // Render Hotspot Markers and Hazard Danger Circles
  useEffect(() => {
    if (!markersLayerRef.current || !circlesLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();
    circlesLayerRef.current.clearLayers();

    hotspots.forEach((hs) => {
      // Color styling by severity
      let markerColor = '#ef4444'; // Red for high
      let circleColor = '#ef4444';
      let iconSymbol = '⚠️';

      if (hs.severity === 'medium') {
        markerColor = '#f59e0b'; // Amber
        circleColor = '#f59e0b';
        iconSymbol = '⚡';
      } else if (hs.severity === 'low') {
        markerColor = '#eab308'; // Yellow
        circleColor = '#eab308';
        iconSymbol = '👁️';
      }

      // 1. Danger Buffer Circle
      const dangerCircle = L.circle([hs.lat, hs.lng], {
        radius: hs.dangerRadiusMeters,
        color: circleColor,
        weight: 1.5,
        dashArray: hs.severity === 'high' ? '4, 4' : undefined,
        fillColor: circleColor,
        fillOpacity: hs.severity === 'high' ? 0.22 : 0.14,
      });
      dangerCircle.addTo(circlesLayerRef.current!);

      // 2. Custom Pulsating Icon Marker
      const pulseHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 38px; height: 38px;">
          ${
            hs.severity === 'high'
              ? `<div class="absolute inset-0 rounded-full bg-red-500/40 animate-ping" style="animation-duration: 2.5s;"></div>`
              : ''
          }
          <div class="w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center font-bold text-xs text-white"
               style="background-color: ${markerColor}; border-color: #ffffff; box-shadow: 0 0 12px ${markerColor}99;">
            <span>${iconSymbol}</span>
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[10px] text-zinc-200 font-semibold whitespace-nowrap shadow-md pointer-events-none hidden group-hover:block">
            ${hs.title.slice(0, 18)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pulseHtml,
        className: 'custom-hotspot-pin',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([hs.lat, hs.lng], { icon: customIcon });

      // Build popup content
      const popupHtml = `
        <div class="p-3.5 max-w-[280px] text-zinc-100 bg-zinc-900 rounded-xl border border-zinc-800">
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              hs.severity === 'high'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : hs.severity === 'medium'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }">
              ${hs.severity === 'high' ? '🔴 Foco Crítico' : hs.severity === 'medium' ? '🟠 Precaución' : '🟡 Alerta Leve'}
            </span>
            <span class="text-[10px] text-zinc-400">${hs.timeWindow}</span>
          </div>

          <h3 class="font-bold text-sm text-white leading-snug mb-1">${hs.title}</h3>
          <p class="text-xs text-zinc-400 mb-2">📍 ${hs.crossStreets} <span class="text-zinc-500">(${hs.barrio})</span></p>

          <div class="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 mb-2.5">
            <p class="text-xs text-zinc-300 leading-relaxed">${hs.description}</p>
          </div>

          <div class="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 p-2 rounded-lg mb-3">
            <strong class="text-amber-200">🛡️ Consejo:</strong> ${hs.safetyTip}
          </div>

          <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
            <span>Reportes: <strong class="text-zinc-200">${hs.confirmedCount}</strong></span>
            <span class="text-[10px] text-zinc-400">${hs.reportedAt}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectHotspot(hs);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [hotspots, onSelectHotspot]);

  // Render Routes and Waypoint Markers (Origin A & Destination B)
  useEffect(() => {
    if (!routesLayerRef.current || !mapInstanceRef.current) return;
    routesLayerRef.current.clearLayers();

    // 1. Origin (A) Marker
    if (origin) {
      const originIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center" style="width: 32px; height: 32px;">
            <div class="w-8 h-8 rounded-full bg-sky-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-black text-xs">
              A
            </div>
          </div>
        `,
        className: 'origin-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([origin.coordinates.lat, origin.coordinates.lng], { icon: originIcon })
        .bindTooltip(`Origen: ${origin.name}`, { direction: 'top', offset: [0, -16] })
        .addTo(routesLayerRef.current);
    }

    // 2. Destination (B) Marker
    if (destination) {
      const destIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center" style="width: 32px; height: 32px;">
            <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-black text-xs">
              B
            </div>
          </div>
        `,
        className: 'dest-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([destination.coordinates.lat, destination.coordinates.lng], { icon: destIcon })
        .bindTooltip(`Destino: ${destination.name}`, { direction: 'top', offset: [0, -16] })
        .addTo(routesLayerRef.current);
    }

    // 3. Render Routes Lines
    if (activeRoute) {
      const { directRoute, safeRoute } = activeRoute;

      // Draw Direct Route (Red/Orange dashed with hazards indication)
      const directPolyline = L.polyline(directRoute.coordinates, {
        color: '#f43f5e',
        weight: selectedRouteType === 'direct' ? 5 : 3,
        opacity: selectedRouteType === 'direct' ? 0.9 : 0.45,
        dashArray: '7, 8',
      });
      directPolyline.addTo(routesLayerRef.current);

      // Draw Safe Route (Emerald green luminous solid corridor)
      // Background glow line
      const safeGlow = L.polyline(safeRoute.coordinates, {
        color: '#10b981',
        weight: selectedRouteType === 'safe' ? 9 : 5,
        opacity: selectedRouteType === 'safe' ? 0.35 : 0.15,
        lineCap: 'round',
        lineJoin: 'round',
      });
      safeGlow.addTo(routesLayerRef.current);

      // Core safe route line
      const safePolyline = L.polyline(safeRoute.coordinates, {
        color: '#059669',
        weight: selectedRouteType === 'safe' ? 5 : 3.5,
        opacity: selectedRouteType === 'safe' ? 0.95 : 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      });
      safePolyline.addTo(routesLayerRef.current);

      // Fit bounds to show entire route comfortably
      const allRouteCoords = [...directRoute.coordinates, ...safeRoute.coordinates];
      if (allRouteCoords.length > 0) {
        const bounds = L.latLngBounds(allRouteCoords.map((c) => [c[0], c[1]]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }
  }, [activeRoute, selectedRouteType, origin, destination]);

  // User Live Geolocation Marker
  useEffect(() => {
    if (!userLocationLayerRef.current) return;
    userLocationLayerRef.current.clearLayers();

    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
            <div class="absolute inset-0 rounded-full bg-sky-400/40 animate-ping"></div>
            <div class="w-4 h-4 rounded-full bg-sky-400 border-2 border-white shadow-md"></div>
          </div>
        `,
        className: 'user-loc-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindTooltip('Tu ubicación actual', { direction: 'top', offset: [0, -12] })
        .addTo(userLocationLayerRef.current);
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full min-h-[450px] overflow-hidden bg-zinc-950">
      {/* Map Element */}
      <div
        id="leaflet-map"
        ref={mapContainerRef}
        className={`w-full h-full ${pickingLocationFor ? 'cursor-crosshair' : 'cursor-grab'}`}
      />

      {/* Picking Location Overlay Banner */}
      {pickingLocationFor && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl bg-zinc-900/95 border border-sky-500/50 shadow-2xl flex items-center gap-2 text-xs font-semibold text-sky-300 backdrop-blur-md animate-bounce">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          {pickingLocationFor === 'origin'
            ? 'Haz clic en el mapa para marcar el Origen (A)'
            : pickingLocationFor === 'destination'
            ? 'Haz clic en el mapa para marcar el Destino (B)'
            : 'Haz clic en el mapa donde detectaste el foco de fisuras'}
        </div>
      )}

      {/* Legend & Quick Safety Badges in Map Corner */}
      <div className="absolute bottom-6 left-4 z-[990] hidden sm:flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/85 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 shadow-xl max-w-[210px]">
        <span className="font-bold text-zinc-100 uppercase tracking-wider text-[10px] mb-1">
          Referencias en Mapa
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white shrink-0" />
          <span>Fisura activo / Crítico</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shrink-0" />
          <span>Ranchada / Precaución</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-400 border border-white shrink-0" />
          <span>Calle oscura / Baja luz</span>
        </div>
        <div className="h-px bg-zinc-800 my-1" />
        <div className="flex items-center gap-2">
          <span className="w-4 h-1.5 bg-emerald-500 rounded-full shrink-0" />
          <span className="text-emerald-300 font-medium">Ruta Segura Esquiva</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 border-t-2 border-dashed border-rose-500 shrink-0" />
          <span className="text-rose-300 font-medium">Ruta Directa (Peligrosa)</span>
        </div>
      </div>
    </div>
  );
};
