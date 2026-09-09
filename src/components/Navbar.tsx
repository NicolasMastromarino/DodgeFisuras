import React from 'react';
import { ShieldAlert, PlusCircle, PhoneCall, Moon, Sun, MapPin, Eye, BellRing } from 'lucide-react';

interface NavbarProps {
  mapTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenReportModal: () => void;
  onOpenSOSModal: () => void;
  totalHotspots: number;
  activeHazardsCount: number;
  onCenterBuenosAires: () => void;
  onLocateMe: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mapTheme,
  onToggleTheme,
  onOpenReportModal,
  onOpenSOSModal,
  totalHotspots,
  activeHazardsCount,
  onCenterBuenosAires,
  onLocateMe
}) => {
  return (
    <header className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 z-30 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 shadow-lg">
      {/* Brand & City Identification */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              DodgeFisura <span className="text-rose-400 font-extrabold text-xs sm:text-sm px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">BA</span>
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Radar Nocturno CABA
            </span>
          </div>
          <p className="text-xs text-zinc-400 hidden sm:block">
            Mapa colaborativo vecinal para esquivar zonas hostiles y volver seguro
          </p>
        </div>
      </div>

      {/* Quick Status Stats (Hidden on small mobile) */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-zinc-400 border-x border-zinc-800/80 px-4 py-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span><strong className="text-zinc-200">{activeHazardsCount}</strong> focos activos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span><strong className="text-zinc-200">{totalHotspots}</strong> puntos seguros verificados</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Geolocation Button */}
        <button
          id="btn-locate-me"
          type="button"
          onClick={onLocateMe}
          title="Mi ubicación actual"
          className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 transition flex items-center gap-1 text-xs"
        >
          <MapPin className="w-4 h-4 text-sky-400" />
          <span className="hidden md:inline">Mi ubicación</span>
        </button>

        {/* Center Buenos Aires */}
        <button
          id="btn-center-ba"
          type="button"
          onClick={onCenterBuenosAires}
          title="Centrar en Buenos Aires"
          className="hidden sm:flex items-center gap-1 p-2 sm:px-2.5 sm:py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 transition text-xs"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="hidden lg:inline">Ver CABA</span>
        </button>

        {/* Map Theme Toggle */}
        <button
          id="btn-toggle-theme"
          type="button"
          onClick={onToggleTheme}
          title={mapTheme === 'dark' ? 'Cambiar a mapa claro' : 'Cambiar a mapa nocturno'}
          className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 transition"
        >
          {mapTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
        </button>

        {/* Emergency SOS Button */}
        <button
          id="btn-sos-emergency"
          type="button"
          onClick={onOpenSOSModal}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm shadow-red-900/40 animate-pulse"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SOS 911</span>
          <span className="sm:hidden">911</span>
        </button>

        {/* Report New Hotspot */}
        <button
          id="btn-report-hotspot"
          type="button"
          onClick={onOpenReportModal}
          className="px-3 py-1.5 sm:py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-950"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Reportar Fisura</span>
          <span className="sm:hidden">Reportar</span>
        </button>
      </div>
    </header>
  );
};
