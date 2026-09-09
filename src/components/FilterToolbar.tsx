import React from 'react';
import { Filter, Search, ShieldAlert, Layers } from 'lucide-react';
import { SeverityLevel } from '../types';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSeverity: 'all' | SeverityLevel;
  onSelectSeverity: (s: 'all' | SeverityLevel) => void;
  selectedBarrio: string;
  onSelectBarrio: (b: string) => void;
  availableBarrios: string[];
  totalVisible: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedSeverity,
  onSelectSeverity,
  selectedBarrio,
  onSelectBarrio,
  availableBarrios,
  totalVisible,
}) => {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 z-20 text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por calle, barrio o estación (ej: Once, Pueyrredón)..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-xs"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span className="text-zinc-500 text-[11px] hidden md:inline font-medium">Filtrar:</span>

        {/* Severity Pills */}
        <button
          type="button"
          onClick={() => onSelectSeverity('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition ${
            selectedSeverity === 'all'
              ? 'bg-zinc-700 text-white shadow-sm'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todos ({totalVisible})
        </button>

        <button
          type="button"
          onClick={() => onSelectSeverity('high')}
          className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
            selectedSeverity === 'high'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-600'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Críticos</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSeverity('medium')}
          className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
            selectedSeverity === 'medium'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-600'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Precaución</span>
        </button>

        {/* Barrio Dropdown */}
        <select
          value={selectedBarrio}
          onChange={(e) => onSelectBarrio(e.target.value)}
          className="px-2 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-rose-500"
        >
          <option value="all">Todos los Barrios</option>
          {availableBarrios.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
