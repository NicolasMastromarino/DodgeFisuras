import React from 'react';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
  MapPin,
  Clock,
  Footprints,
  Share2,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { RouteCalculationResult, RoutePoint, SafetyPreset } from '../types';

interface RoutePlannerProps {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  activeRoute: RouteCalculationResult | null;
  selectedRouteType: 'safe' | 'direct';
  onSelectRouteType: (type: 'safe' | 'direct') => void;
  onSetOrigin: (point: RoutePoint | null) => void;
  onSetDestination: (point: RoutePoint | null) => void;
  onSwapPoints: () => void;
  onStartPicking: (type: 'origin' | 'destination') => void;
  onSelectPreset: (preset: SafetyPreset) => void;
  presets: SafetyPreset[];
  isCalculating: boolean;
  onShareWhatsApp: () => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  origin,
  destination,
  activeRoute,
  selectedRouteType,
  onSelectRouteType,
  onSwapPoints,
  onStartPicking,
  onSelectPreset,
  presets,
  isCalculating,
  onShareWhatsApp
}) => {
  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 text-zinc-100 overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Trazar Ruta Anti-Fisuras
            </h2>
          </div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
            Buenos Aires
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Calcula desvíos inteligentes para esquivar ranchadas y puntos peligrosos nocturnos
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Origin & Destination Inputs */}
        <div className="relative rounded-xl bg-zinc-950/70 border border-zinc-800/90 p-3 space-y-2">
          {/* Origin (A) */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-xs font-bold shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Punto de Origen
              </span>
              <p className="text-xs text-zinc-200 truncate font-medium">
                {origin ? origin.name : 'Selecciona en el mapa o elige un trayecto'}
              </p>
            </div>
            <button
              id="btn-pick-origin"
              type="button"
              onClick={() => onStartPicking('origin')}
              className="px-2 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-sky-300 border border-zinc-700 shrink-0 transition"
            >
              Fijar en mapa
            </button>
          </div>

          {/* Swap Button Divider */}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="absolute inset-x-0 h-px bg-zinc-800" />
            <button
              id="btn-swap-points"
              type="button"
              onClick={onSwapPoints}
              title="Invertir origen y destino"
              className="relative z-10 p-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination (B) */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold shrink-0">
              B
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Punto de Destino
              </span>
              <p className="text-xs text-zinc-200 truncate font-medium">
                {destination ? destination.name : 'Selecciona en el mapa o elige un trayecto'}
              </p>
            </div>
            <button
              id="btn-pick-destination"
              type="button"
              onClick={() => onStartPicking('destination')}
              className="px-2 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-zinc-700 shrink-0 transition"
            >
              Fijar en mapa
            </button>
          </div>
        </div>

        {/* Quick Presets for Buenos Aires */}
        <div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Rutas Habituales Nocturnas (CABA)
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                id={`btn-preset-${preset.id}`}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className="w-full text-left p-2.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/90 border border-zinc-700/50 hover:border-zinc-600 transition group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-300 transition">
                    {preset.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Route Evaluation & Toggle (When activeRoute exists) */}
        {activeRoute && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Comparativa de Seguridad
              </span>
              <span className="text-[11px] text-zinc-500">
                {activeRoute.avoidedHotspots.length} focos detectados
              </span>
            </div>

            {/* Selector Options */}
            <div className="grid grid-cols-2 gap-2">
              {/* Safe Route Card */}
              <button
                id="btn-select-safe-route"
                type="button"
                onClick={() => onSelectRouteType('safe')}
                className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${
                  selectedRouteType === 'safe'
                    ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">
                      Ruta Segura
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeRoute.safeRoute.safetyScore}%
                  </span>
                </div>

                <div className="space-y-1 text-xs text-zinc-300">
                  <div className="flex items-center gap-1 text-zinc-300">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>~{activeRoute.safeRoute.durationMinutes} min</span>
                    <span className="text-zinc-500 text-[11px]">({activeRoute.safeRoute.distanceKm} km)</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    ✓ Esquiva {activeRoute.avoidedHotspots.length} fisuras
                  </div>
                </div>
              </button>

              {/* Direct Route Card */}
              <button
                id="btn-select-direct-route"
                type="button"
                onClick={() => onSelectRouteType('direct')}
                className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${
                  selectedRouteType === 'direct'
                    ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-300">
                      Ruta Directa
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {activeRoute.directRoute.safetyScore}%
                  </span>
                </div>

                <div className="space-y-1 text-xs text-zinc-300">
                  <div className="flex items-center gap-1 text-zinc-300">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>~{activeRoute.directRoute.durationMinutes} min</span>
                    <span className="text-zinc-500 text-[11px]">({activeRoute.directRoute.distanceKm} km)</span>
                  </div>
                  <div className="text-[11px] text-rose-400 font-medium">
                    ⚠️ {activeRoute.directRoute.hazardCount} zonas de riesgo
                  </div>
                </div>
              </button>
            </div>

            {/* Avoidance Breakdown & Security Analysis */}
            {selectedRouteType === 'safe' ? (
              <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Protocolo de Protección Aplicado</span>
                </div>
                <ul className="text-xs text-zinc-300 space-y-1.5 pl-1">
                  {activeRoute.safeRoute.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {activeRoute.avoidedHotspots.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-emerald-800/30">
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      Focos esquivados con éxito:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeRoute.avoidedHotspots.map((hs) => (
                        <span
                          key={hs.id}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-emerald-500/30 text-emerald-200"
                        >
                          🛡️ {hs.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Advertencia de Riesgo Nocturno</span>
                </div>
                <p className="text-xs text-zinc-300">
                  Esta trayectoria directa cruza sectores con reportes de individuos bajo efectos de sustancias, arrebatos o nula iluminación.
                </p>
                {activeRoute.directRoute.hazardsEncountered.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {activeRoute.directRoute.hazardsEncountered.map((hs) => (
                      <div
                        key={hs.id}
                        className="text-[11px] p-2 rounded-lg bg-zinc-900/90 border border-rose-500/30 text-rose-200 flex items-start gap-1.5"
                      >
                        <span className="text-rose-400 font-bold">⚠️</span>
                        <div>
                          <strong>{hs.title}:</strong> {hs.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Share Route via WhatsApp */}
            <button
              id="btn-share-whatsapp"
              type="button"
              onClick={onShareWhatsApp}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir trayecto seguro por WhatsApp</span>
            </button>
          </div>
        )}

        {/* Night Walking Practical Recommendations */}
        <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300 text-[11px]">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>Pautas de Seguridad Nocturna en CABA</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400">
            <li>Caminar por la vereda par/impar que cuente con luz LED blanca y comercios abiertos.</li>
            <li>No utilizar auriculares canceladores de ruido de noche.</li>
            <li>Si ves un grupo concentrado, cruzar preventivamente a la acera opuesta sin hacer contacto visual desafiante.</li>
            <li>En caso de alerta inmediata, llamar al 911 de la Policía de la Ciudad.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
