import React, { useState } from 'react';

export default function App() {
  const [energia, setEnergia] = useState(100);
  const [cash, setCash] = useState(1500);
  const [transf, setTransf] = useState(8000);
  const [aceite, setAceite] = useState(0);
  const [gasolina, setGasolina] = useState(0);
  const [coords, setCoords] = useState({ x: -3, y: 0 });
  const [lugar, setLugar] = useState("Frente al banco central.");
  const [descripcion, setDescripcion] = useState("La cola da la vuelta a la manzana. El cajero está pelado sin efectivo.");

  const mover = (dir: string) => {
    setCoords(prev => {
      let nx = prev.x;
      let ny = prev.y;
      if (dir === 'UP') ny += 1;
      if (dir === 'DOWN') ny -= 1;
      if (dir === 'LEFT') nx -= 1;
      if (dir === 'RIGHT') nx += 1;
      return { x: nx, y: ny };
    });
    setEnergia(prev => Math.max(0, prev - 2));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 font-sans select-none">
      {/* Header / Barra de Estado */}
      <header className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Conectado • PWA
          </span>
          <span className="text-xs text-slate-400 font-mono">Coord: [{coords.x}, {coords.y}]</span>
        </div>

        {/* Estadísticas de Supervivencia */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">⚡ Energía</span>
            <span className="font-bold text-amber-400">{energia}%</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">💵 Cash</span>
            <span className="font-bold text-emerald-400">{cash} USDT</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">📱 Transf</span>
            <span className="font-bold text-sky-400">{transf} USDT</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">🛢️ Recursos</span>
            <span className="font-bold text-indigo-300">{aceite}L / {gasolina}L</span>
          </div>
        </div>
      </header>

      {/* Pantalla de Escenario Actual */}
      <main className="my-auto py-6">
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-2xl font-black text-white tracking-tight mb-3 flex items-center gap-2">
            📍 {lugar}
          </h2>
          <p className="text-slate-300 text-base leading-relaxed mb-6">
            {descripcion}
          </p>

          <button 
            onClick={() => alert("¡Acción realizada en el lugar!")}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-cyan-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 border border-cyan-400/20"
          >
            🔍 Interactuar con el lugar
          </button>
        </div>
      </main>

      {/* Controles de Movimiento Estilo D-Pad Moderno */}
      <footer className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          🎮 Controles de Movimiento
        </span>

        <div className="grid grid-cols-3 gap-3 w-48 max-w-full">
          <div></div>
          <button 
            onClick={() => mover('UP')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-white font-bold h-14 rounded-2xl flex items-center justify-center text-xl shadow-md border border-slate-700 active:scale-95 transition-all"
          >
            ▲
          </button>
          <div></div>

          <button 
            onClick={() => mover('LEFT')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-white font-bold h-14 rounded-2xl flex items-center justify-center text-xl shadow-md border border-slate-700 active:scale-95 transition-all"
          >
            ◀
          </button>
          <div className="flex items-center justify-center bg-slate-950/40 rounded-2xl border border-slate-800 text-xs text-slate-500 font-mono">
            MOVE
          </div>
          <button 
            onClick={() => mover('RIGHT')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-white font-bold h-14 rounded-2xl flex items-center justify-center text-xl shadow-md border border-slate-700 active:scale-95 transition-all"
          >
            ▶
          </button>

          <div></div>
          <button 
            onClick={() => mover('DOWN')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-white font-bold h-14 rounded-2xl flex items-center justify-center text-xl shadow-md border border-slate-700 active:scale-95 transition-all"
          >
            ▼
          </button>
          <div></div>
        </div>
      </footer>
    </div>
  );
}
