import React from 'react';
import { X, ShieldAlert, ThumbsUp, MapPin, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Hotspot } from '../types';

interface HotspotDetailsDrawerProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  onConfirmHotspot: (id: string) => void;
  onSetAvoidTarget: (hotspot: Hotspot) => void;
}

export const HotspotDetailsDrawer: React.FC<HotspotDetailsDrawerProps> = ({
  hotspot,
  onClose,
  onConfirmHotspot,
  onSetAvoidTarget,
}) => {
  if (!hotspot) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm sm:max-w-md bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl p-4 text-zinc-100 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              hotspot.severity === 'high'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : hotspot.severity === 'medium'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
            }`}
          >
            {hotspot.severity === 'high' ? '🔴 Foco Crítico' : hotspot.severity === 'medium' ? '🟠 Precaución' : '🟡 Alerta Leve'}
          </span>
          <span className="text-[11px] text-zinc-400">{hotspot.timeWindow}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-base font-bold text-white mb-1 leading-snug">{hotspot.title}</h3>
      <p className="text-xs text-zinc-400 flex items-center gap-1 mb-3">
        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>{hotspot.crossStreets}</span>
        <span className="text-zinc-500 font-medium">({hotspot.barrio})</span>
      </p>

      {/* Description Box */}
      <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 mb-3 space-y-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
          Diagnóstico de la Zona
        </span>
        <p className="text-xs text-zinc-300 leading-relaxed">{hotspot.description}</p>
      </div>

      {/* Safety Tip Box */}
      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 mb-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Consejo Práctico de Esquiva</span>
        </div>
        <p className="text-xs text-zinc-300">{hotspot.safetyTip}</p>
      </div>

      {/* Meta & Stats */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 mb-3">
        <span className="flex items-center gap-1 text-[11px]">
          <Clock className="w-3 h-3 text-zinc-500" />
          {hotspot.reportedAt}
        </span>
        <span className="text-[11px] text-zinc-300">
          Radio de alerta: <strong className="text-rose-400">{hotspot.dangerRadiusMeters}m</strong>
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => onConfirmHotspot(hotspot.id)}
          className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs transition flex items-center justify-center gap-1.5 border border-zinc-700"
        >
          <ThumbsUp className="w-3.5 h-3.5 text-sky-400" />
          <span>Sigue activo (+{hotspot.confirmedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onSetAvoidTarget(hotspot)}
          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Esquivar en Ruta</span>
        </button>
      </div>
    </div>
  );
};
