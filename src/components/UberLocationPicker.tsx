import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Train,
  Navigation,
  Compass,
  Building2,
  Sparkles,
  ArrowUpDown,
  X,
  Map,
  Check,
  Loader2
} from 'lucide-react';
import { Coordinates, RoutePoint } from '../types';
import { BUENOS_AIRES_PLACES, PopularPlace } from '../data/popularPlaces';

interface UberLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  targetField: 'origin' | 'destination';
  currentOrigin: RoutePoint | null;
  currentDestination: RoutePoint | null;
  onSelectPoint: (field: 'origin' | 'destination', point: RoutePoint) => void;
  onPickOnMap: (field: 'origin' | 'destination') => void;
  userCoords: Coordinates | null;
  onRequestGeolocation: () => void;
}

export const UberLocationPicker: React.FC<UberLocationPickerProps> = ({
  isOpen,
  onClose,
  targetField: initialTargetField,
  currentOrigin,
  currentDestination,
  onSelectPoint,
  onPickOnMap,
  userCoords,
  onRequestGeolocation,
}) => {
  const [activeField, setActiveField] = useState<'origin' | 'destination'>(initialTargetField);
  const [searchQuery, setSearchQuery] = useState('');
  const [nominatimResults, setNominatimResults] = useState<PopularPlace[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveField(initialTargetField);
    setSearchQuery('');
    setNominatimResults([]);
  }, [initialTargetField, isOpen]);

  // Focus input and listen for ESC key when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, activeField, onClose]);

  // Live Debounced Online Search via OpenStreetMap Nominatim for Buenos Aires addresses
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setNominatimResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const queryWithBA = `${searchQuery.trim()}, Ciudad Autónoma de Buenos Aires, Argentina`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            queryWithBA
          )}&viewbox=-58.53,-34.53,-58.35,-34.70&bounded=1&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          const mapped: PopularPlace[] = data.map((item: any) => ({
            id: `osm-${item.place_id}`,
            name: item.name || item.display_name.split(',')[0],
            address: item.display_name.split(',').slice(0, 3).join(', '),
            barrio: 'Buenos Aires',
            category: 'landmark',
            coordinates: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            },
          }));
          setNominatimResults(mapped);
        }
      } catch (e) {
        // Fallback silently if offline or network blocked
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Filter curated places
  const filteredLocalPlaces = BUENOS_AIRES_PLACES.filter((place) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      place.name.toLowerCase().includes(q) ||
      place.address.toLowerCase().includes(q) ||
      place.barrio.toLowerCase().includes(q)
    );
  });

  // Combined places (local high quality + any online geocoded results)
  const allResults = [...filteredLocalPlaces, ...nominatimResults];

  const handleSelectPlace = (place: PopularPlace) => {
    const newPoint: RoutePoint = {
      name: place.name,
      address: place.address,
      coordinates: place.coordinates,
    };
    onSelectPoint(activeField, newPoint);

    // If setting origin and destination is empty, switch to destination
    if (activeField === 'origin' && !currentDestination) {
      setActiveField('destination');
      setSearchQuery('');
    } else {
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    if (userCoords) {
      const myPoint: RoutePoint = {
        name: 'Mi ubicación actual',
        address: 'Coordenadas GPS de tu teléfono',
        coordinates: userCoords,
      };
      onSelectPoint('origin', myPoint);
      if (!currentDestination) {
        setActiveField('destination');
        setSearchQuery('');
      } else {
        onClose();
      }
    } else {
      onRequestGeolocation();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[85vh] bg-zinc-900 sm:rounded-2xl border-0 sm:border border-zinc-800 text-zinc-100 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top App Header like Uber */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/95 sticky top-0 z-20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              ¿Hacia dónde vas? (Buenos Aires)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connected A & B Inputs (Uber Pattern) */}
          <div className="relative flex items-center gap-3 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
            {/* Visual connector line */}
            <div className="flex flex-col items-center justify-between h-14 py-1 shrink-0">
              <div className="w-3 h-3 rounded-full bg-sky-400 ring-4 ring-sky-500/20" />
              <div className="w-0.5 flex-1 bg-zinc-700 my-0.5" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 ring-4 ring-emerald-500/20" />
            </div>

            {/* Inputs Container */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {/* Origin Row */}
              <div
                onClick={() => {
                  setActiveField('origin');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition ${
                  activeField === 'origin'
                    ? 'bg-zinc-800/90 ring-1 ring-sky-500 text-white'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block leading-tight">
                    Punto de Partida
                  </span>
                  <p className="text-xs font-semibold truncate text-zinc-200">
                    {currentOrigin ? currentOrigin.name : 'Elige origen o tu ubicación'}
                  </p>
                </div>
                {activeField === 'origin' && <Check className="w-4 h-4 text-sky-400 shrink-0 ml-1" />}
              </div>

              {/* Destination Row */}
              <div
                onClick={() => {
                  setActiveField('destination');
                  setSearchQuery('');
                }}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition ${
                  activeField === 'destination'
                    ? 'bg-zinc-800/90 ring-1 ring-emerald-500 text-white'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block leading-tight">
                    Destino (A dónde vas)
                  </span>
                  <p className="text-xs font-semibold truncate text-zinc-200">
                    {currentDestination ? currentDestination.name : 'Escribe o toca un destino'}
                  </p>
                </div>
                {activeField === 'destination' && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
              </div>
            </div>
          </div>

          {/* Active Search Field Input */}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeField === 'origin'
                  ? 'Buscar punto de partida (ej: Estación Once, Corrientes, etc.)...'
                  : 'Buscar destino (ej: Palermo Soho, Av. Santa Fe, Medrano)...'
              }
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results / Suggestions Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-zinc-800/60">
          {/* Quick 1-Tap: Current Location GPS */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="w-full p-2.5 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white group-hover:text-sky-300 transition block">
                Usar mi ubicación actual
              </span>
              <p className="text-[11px] text-zinc-400">
                {userCoords ? 'GPS activo en Buenos Aires' : 'Toca para activar GPS'}
              </p>
            </div>
          </button>

          {/* Quick 1-Tap: Pick on Map option */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onPickOnMap(activeField);
            }}
            className="w-full p-2.5 rounded-xl hover:bg-zinc-800/80 transition flex items-center gap-3 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Map className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition block">
                Fijar directamente en el mapa
              </span>
              <p className="text-[11px] text-zinc-400">
                Toca cualquier esquina o vereda en el mapa de CABA
              </p>
            </div>
          </button>

          {/* Searching Online Indicator */}
          {isSearchingOnline && (
            <div className="py-2 px-3 flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Buscando calles en Buenos Aires...</span>
            </div>
          )}

          {/* Places List */}
          <div className="pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 block mb-1">
              Lugares y Estaciones en Buenos Aires
            </span>

            {allResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">
                No encontramos coincidencias para "{searchQuery}". Prueba con el nombre de la avenida o estación.
              </div>
            ) : (
              allResults.map((place) => {
                const isSubway = place.category === 'subway';
                const isStation = place.category === 'station';
                const isShopping = place.category === 'shopping';

                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full p-2.5 rounded-xl hover:bg-zinc-800/80 transition flex items-start gap-3 text-left group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition ${
                        isStation
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : isSubway
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : isShopping
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isStation || isSubway ? (
                        <Train className="w-4 h-4" />
                      ) : isShopping ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition truncate">
                          {place.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                          {place.barrio}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {place.address}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
