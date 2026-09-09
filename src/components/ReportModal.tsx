import React, { useState } from 'react';
import { X, AlertOctagon, MapPin, ShieldAlert, CheckCircle } from 'lucide-react';
import { Coordinates, Hotspot, HotspotCategory, SeverityLevel } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReport: (newHotspot: Hotspot) => void;
  initialCoords: Coordinates | null;
  onPickCoordsOnMap: () => void;
}

const BARRIOS_CABA = [
  'Balvanera / Once',
  'Constitución',
  'Retiro',
  'Congreso / San Nicolás',
  'San Telmo',
  'Recoleta',
  'Palermo',
  'Almagro',
  'Chacarita',
  'Flores',
  'Caballito',
  'Barracas',
  'La Boca',
  'Belgrano',
  'Monserrat',
  'Villa Crespo',
  'Otro barrio'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSaveReport,
  initialCoords,
  onPickCoordsOnMap,
}) => {
  const [title, setTitle] = useState('');
  const [barrio, setBarrio] = useState(BARRIOS_CABA[0]);
  const [crossStreets, setCrossStreets] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [category, setCategory] = useState<HotspotCategory>('active_fisura');
  const [description, setDescription] = useState('');
  const [safetyTip, setSafetyTip] = useState('');
  const [timeWindow, setTimeWindow] = useState('Noche cerrada (21:00 - 06:00)');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !crossStreets.trim()) return;

    // Use selected coords or default to central Buenos Aires coords with slight random jitter
    const coords: Coordinates = initialCoords || {
      lat: -34.6037 + (Math.random() - 0.5) * 0.02,
      lng: -58.3816 + (Math.random() - 0.5) * 0.02,
    };

    const newHotspot: Hotspot = {
      id: `community-${Date.now()}`,
      title: title.trim(),
      barrio,
      crossStreets: crossStreets.trim(),
      lat: coords.lat,
      lng: coords.lng,
      severity,
      category,
      description: description.trim() || 'Reportado por vecino de la zona como punto de alerta nocturna.',
      safetyTip: safetyTip.trim() || 'Cruzar a la acera de enfrente y transitar por avenidas iluminadas.',
      dangerRadiusMeters: severity === 'high' ? 160 : severity === 'medium' ? 120 : 90,
      reportedAt: 'Recién ahora',
      confirmedCount: 1,
      timeWindow,
      isCommunityReported: true,
    };

    onSaveReport(newHotspot);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      // Reset form
      setTitle('');
      setCrossStreets('');
      setDescription('');
      setSafetyTip('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reportar Foco / Punto Hostil</h3>
              <p className="text-xs text-zinc-400">Ayuda a la comunidad y a vecinos a volver seguros de noche</p>
            </div>
          </div>
          <button
            id="btn-close-report-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">¡Punto de Alerta Publicado!</h4>
            <p className="text-xs text-zinc-400">
              Gracias por colaborar. Tu reporte ya está visible en el mapa y activo en el cálculo de rutas seguras.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nombre o Identificación del Lugar *
              </label>
              <input
                id="input-hotspot-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Salida Subte H Pueyrredón / Ranchada bajo puente"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Barrio & Cross Streets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Barrio (CABA) *
                </label>
                <select
                  id="select-hotspot-barrio"
                  value={barrio}
                  onChange={(e) => setBarrio(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-rose-500"
                >
                  {BARRIOS_CABA.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Esquinas / Altura aproximada *
                </label>
                <input
                  id="input-hotspot-cross-streets"
                  type="text"
                  required
                  value={crossStreets}
                  onChange={(e) => setCrossStreets(e.target.value)}
                  placeholder="Ej: Av. Rivadavia & Riobamba"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nivel de Riesgo / Severidad *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="btn-severity-high"
                  onClick={() => setSeverity('high')}
                  className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                    severity === 'high'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base">🔴</span>
                  <span>Alto / Hostil</span>
                </button>

                <button
                  type="button"
                  id="btn-severity-medium"
                  onClick={() => setSeverity('medium')}
                  className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                    severity === 'medium'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base">🟠</span>
                  <span>Medio / Cuidado</span>
                </button>

                <button
                  type="button"
                  id="btn-severity-low"
                  onClick={() => setSeverity('low')}
                  className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                    severity === 'low'
                      ? 'bg-yellow-950/60 border-yellow-500 text-yellow-300 ring-1 ring-yellow-500'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base">🟡</span>
                  <span>Leve / Oscuro</span>
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Tipo de Situación *
              </label>
              <select
                id="select-hotspot-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as HotspotCategory)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-rose-500"
              >
                <option value="active_fisura">Fisura Activo / Persona alterada o agresiva</option>
                <option value="narcotics_consumption">Consumo visible de pasta base / paco / sustancias</option>
                <option value="encampment">Ranchada / Acampada fija sobre vereda</option>
                <option value="aggressive_begging">Pique o mangueo hostil / intimidación</option>
                <option value="dark_street">Calle oscura / Sin iluminación de noche</option>
                <option value="robbery_zone">Zona de arrebatos rápidos / celulares</option>
              </select>
            </div>

            {/* Description & Safety Tip */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Descripción de lo que ocurre
              </label>
              <textarea
                id="textarea-hotspot-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Se juntan 3 o 4 personas en la entrada cerrada de la farmacia, fuman paco y gritan a los que pasan..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Consejo Vecinal para Esquivarlo
              </label>
              <input
                id="input-hotspot-safety-tip"
                type="text"
                value={safetyTip}
                onChange={(e) => setSafetyTip(e.target.value)}
                placeholder="Ej: Doblar por calle Mitre o cruzar a la vereda de enfrente iluminada"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Map Coords Status & Pick on Map Button */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span className="text-zinc-300">
                  {initialCoords
                    ? `Coordenadas: [${initialCoords.lat.toFixed(4)}, ${initialCoords.lng.toFixed(4)}]`
                    : 'Ubicación automática aproximada'}
                </span>
              </div>
              <button
                type="button"
                id="btn-pick-coords-map"
                onClick={() => {
                  onClose();
                  onPickCoordsOnMap();
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-300 border border-zinc-700 text-[11px] transition"
              >
                Elegir en mapa
              </button>
            </div>

            {/* Footer buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                id="btn-cancel-report"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-submit-report"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-950 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Publicar Alerta</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
