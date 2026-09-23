import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function FirstPersonGame() {
  const [stats, setStats] = useState(() => {
    // Cargar respaldo local si existe para funcionar offline
    const saved = localStorage.getItem('cuban_survival_stats');
    return saved ? JSON.parse(saved) : {
      energy: 100,
      cashCup: 1500,
      transferCup: 8000,
      oilLiters: 0.0,
      gasolineLiters: 0.0,
    };
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [currentView, setCurrentView] = useState("Estás en la puerta de tu casa. El barrio está polvoriento y hace un sol fuerte.");
  const [interactivePrompt, setInteractivePrompt] = useState("Ves la calle principal frente a ti.");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Detectar estado de la red (Online / Offline)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar en localStorage cada vez que cambien las estadísticas
  useEffect(() => {
    localStorage.setItem('cuban_survival_stats', JSON.stringify(stats));
  }, [stats]);

  const movePlayer = (direction: 'forward' | 'backward' | 'left' | 'right') => {
    setPosition((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      if (direction === 'forward') newY += 1;
      if (direction === 'backward') newY -= 1;
      if (direction === 'left') newX -= 1;
      if (direction === 'right') newX += 1;

      updateEnvironment(newX, newY);
      return { x: newX, y: newY };
    });
  };

  const updateEnvironment = (x: number, y: number) => {
    if (y === 1) {
      setCurrentView("Frente a la Mipyme del barrio.");
      setInteractivePrompt("El cartel dice: 'Se acepta transferencia (Máx. 1,000 CUP)'. El aceite está a más de 3,000 CUP.");
    } else if (y === 2) {
      setCurrentView("La esquina del botello de gasolina.");
      setInteractivePrompt("Hay tremenda cola. Si pagas por transferencia te clavan el 30% de recargo.");
    } else if (x < 0) {
      setCurrentView("Frente al banco central.");
      setInteractivePrompt("La cola da la vuelta a la manzana. El cajero está pelado sin efectivo.");
    } else {
      setCurrentView("Estás en la calle principal del barrio.");
      setInteractivePrompt("El calor es intenso y la corriente sigue tumbada.");
    }
  };

  return (
    <div className="flex flex-col justify-between h-screen w-full max-w-md mx-auto bg-slate-900 text-white select-none font-sans overflow-hidden border border-slate-700 shadow-2xl">
      {/* Barra de Estado y Red */}
      <div className="bg-slate-800 p-2 border-b border-slate-700 flex justify-between items-center text-[10px] px-3">
        <span className={isOnline ? "text-emerald-400" : "text-amber-500 font-bold"}>
          {isOnline ? "🟢 Conectado" : "⚡ Modo Offline (Sin Internet)"}
        </span>
        <span className="text-slate-400">Sobrevivir en Cuba PWA</span>
      </div>

      <div className="bg-slate-800 p-3 border-b border-slate-700 grid grid-cols-2 gap-2 text-xs font-semibold">
        <div className="flex items-center gap-1">
          <span>🔋 Energía:</span> <span className="text-emerald-400">{stats.energy}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span>💵 Cash:</span> <span className="text-amber-400">{stats.cashCup} CUP</span>
        </div>
        <div className="flex items-center gap-1">
          <span>📱 Transf:</span> <span className="text-cyan-400">{stats.transferCup} CUP</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🛢️ Aceite:</span> <span className="text-purple-400">{stats.oilLiters}L</span> | <span>⛽ {stats.gasolineLiters}L</span>
        </div>
      </div>

      <div className="relative flex-1 bg-gradient-to-b from-sky-950 via-slate-800 to-slate-900 p-4 flex flex-col justify-center items-center text-center border-b border-slate-700">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="z-10 bg-slate-900/80 backdrop-blur-md p-5 rounded-xl border border-slate-700 w-11/12 shadow-lg">
          <p className="text-xs text-slate-400 mb-1">Coordenadas: [X: {position.x}, Y: {position.y}]</p>
          <h2 className="text-base font-bold text-amber-300 mb-2">{currentView}</h2>
          <p className="text-xs text-slate-200">{interactivePrompt}</p>
        </div>
        <button 
          onClick={() => alert("¡Progreso guardado de manera local y sincronizado!")}
          className="z-10 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-5 rounded-full shadow-lg transition-transform active:scale-95"
        >
          🔍 Interactuar con el lugar
        </button>
      </div>

      <div className="bg-slate-800 p-4 flex flex-col items-center justify-center gap-2 border-t border-slate-700">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Controles de Movimiento</p>
        <button 
          onClick={() => movePlayer('forward')}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-14 h-12 rounded-lg shadow active:bg-amber-600 transition-colors text-sm"
        >
          ▲
        </button>
        <div className="flex gap-12">
          <button 
            onClick={() => movePlayer('left')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-14 h-12 rounded-lg shadow active:bg-amber-600 transition-colors text-sm"
          >
            ◀
          </button>
          <button 
            onClick={() => movePlayer('right')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-14 h-12 rounded-lg shadow active:bg-amber-600 transition-colors text-sm"
          >
            ▶
          </button>
        </div>
        <button 
          onClick={() => movePlayer('backward')}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-14 h-12 rounded-lg shadow active:bg-amber-600 transition-colors text-sm"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
