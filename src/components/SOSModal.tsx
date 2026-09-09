import React, { useState, useEffect } from 'react';
import { X, PhoneCall, AlertTriangle, Share2, Timer, CheckCircle2, Shield, HeartHandshake } from 'lucide-react';
import { Coordinates } from '../types';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: Coordinates | null;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, userCoords }) => {
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Play audio beep / warning
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {
        // audio context fallback
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  if (!isOpen) return null;

  const startCompanionTimer = (mins: number) => {
    setTimerMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsTimerRunning(true);
  };

  const cancelTimer = () => {
    setIsTimerRunning(false);
    setTimerMinutes(null);
    setSecondsRemaining(0);
  };

  const handleSendWhatsAppEmergency = () => {
    const coordsStr = userCoords
      ? `https://maps.google.com/?q=${userCoords.lat},${userCoords.lng}`
      : 'Buenos Aires';
    const msg = encodeURIComponent(
      `🚨 ALERTA DE SEGURIDAD (Buenos Aires): Estoy volviendo sola/o por la calle de noche. Por favor quédate atento/a a mi trayecto. Mi ubicación: ${coordsStr}`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      {/* Full screen flashlight overlay if triggered */}
      {isFlashActive && (
        <div
          onClick={() => setIsFlashActive(false)}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-zinc-900 cursor-pointer text-center"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center mb-4 text-2xl font-black">
            💡
          </div>
          <h2 className="text-2xl font-black mb-2">PANTALLA BRILLANTE DE DISUASIÓN</h2>
          <p className="text-sm font-semibold max-w-sm">
            Toca cualquier parte de la pantalla para desactivar la linterna disuasoria.
          </p>
        </div>
      )}

      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-red-500/40 text-zinc-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-red-950/40 border-b border-red-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Central de Emergencia 911 <span className="text-xs text-red-400 font-semibold">CABA</span>
              </h3>
              <p className="text-xs text-zinc-400">Policía de la Ciudad y Asistencia Inmediata</p>
            </div>
          </div>
          <button
            id="btn-close-sos-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Direct Phone Dial Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              id="link-dial-911"
              href="tel:911"
              className="p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-center font-bold text-sm transition flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-950"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Llamar al 911</span>
              <span className="text-[10px] font-normal text-red-200">Policía de la Ciudad</span>
            </a>

            <a
              id="link-dial-144"
              href="tel:144"
              className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-center font-bold text-sm transition flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-950"
            >
              <HeartHandshake className="w-5 h-5" />
              <span>Línea 144</span>
              <span className="text-[10px] font-normal text-purple-200">Atención Mujeres / Género</span>
            </a>
          </div>

          {/* Quick WhatsApp Panic Alert */}
          <button
            id="btn-sos-whatsapp"
            type="button"
            onClick={handleSendWhatsAppEmergency}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
          >
            <Share2 className="w-4 h-4" />
            <span>Enviar Ubicación de Alerta por WhatsApp</span>
          </button>

          {/* Virtual Safety Companion Timer */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Acompañante Virtual ("Llego en...")
                </span>
              </div>
              {isTimerRunning && (
                <span className="text-xs font-mono font-bold text-amber-400 animate-pulse">
                  {formatTimer(secondsRemaining)}
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-400">
              Activa una cuenta regresiva para tu caminata. Si no confirmas tu llegada antes del límite, el sistema te avisará con alerta sonora.
            </p>

            {isTimerRunning ? (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelTimer}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>¡Ya llegué bien a casa!</span>
                </button>
                <button
                  type="button"
                  onClick={cancelTimer}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCompanionTimer(10)}
                  className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
                >
                  ⏱️ 10 min
                </button>
                <button
                  type="button"
                  onClick={() => startCompanionTimer(15)}
                  className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
                >
                  ⏱️ 15 min
                </button>
                <button
                  type="button"
                  onClick={() => startCompanionTimer(25)}
                  className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
                >
                  ⏱️ 25 min
                </button>
              </div>
            )}
          </div>

          {/* Screen Flashlight Toggle */}
          <button
            id="btn-trigger-flashlight"
            type="button"
            onClick={() => setIsFlashActive(true)}
            className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs transition flex items-center justify-center gap-2 border border-zinc-700"
          >
            <span>💡</span>
            <span>Activar Pantalla Blanca (Disuasión y Luz Nocturna)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
