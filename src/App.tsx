import React, { useState } from 'react';

const locations = [
  {
    name: 'Frente al banco central',
    description: 'La cola da la vuelta a la manzana. El cajero está pelado sin efectivo.',
    accent: 'cyan',
  },
  {
    name: 'Calle Neptuno',
    description: 'El calor pega fuerte y quedan pocos suministros en los comercios.',
    accent: 'amber',
  },
  {
    name: 'Malecón de La Habana',
    description: 'El mar está tranquilo, pero la ciudad comienza a quedarse sin luz.',
    accent: 'blue',
  },
];

export default function App() {
  const [energia, setEnergia] = useState(100);
  const [cash] = useState(1500);
  const [transf] = useState(8000);
  const [aceite] = useState(0);
  const [gasolina] = useState(0);
  const [coords, setCoords] = useState({ x: -3, y: 0 });
  const [locationIndex, setLocationIndex] = useState(0);
  const [message, setMessage] = useState('Explora la ciudad y administra tus recursos.');

  const location = locations[locationIndex];

  const mover = (dir: string) => {
    setCoords((prev) => {
      let x = prev.x;
      let y = prev.y;
      if (dir === 'UP') y += 1;
      if (dir === 'DOWN') y -= 1;
      if (dir === 'LEFT') x -= 1;
      if (dir === 'RIGHT') x += 1;
      return { x, y };
    });
    setEnergia((prev) => Math.max(0, prev - 2));
    setLocationIndex((prev) => (prev + 1) % locations.length);
    setMessage('Te has desplazado. La ciudad cambia a cada paso.');
  };

  const interactuar = () => {
    setMessage('Has registrado el lugar. Busca suministros antes de continuar.');
  };

  return (
    <div className="game-shell">
      <div className="city-light city-light-one" />
      <div className="city-light city-light-two" />
      <div className="game-content">
        <header className="hud-panel top-panel">
          <div className="brand-row">
            <div>
              <p className="eyebrow">CUBA // SOBREVIVE</p>
              <h1>Diario de supervivencia</h1>
            </div>
            <div className="connection-status"><span /> EN LÍNEA</div>
          </div>
          <div className="coordinate-row">
            <span>SECTOR ACTUAL</span>
            <strong>[{coords.x}, {coords.y}]</strong>
          </div>

          <div className="stats-grid">
            <div className="stat-card energy-card">
              <div className="stat-heading"><span>⚡</span> ENERGÍA <b>{energia}%</b></div>
              <div className="meter"><i style={{ width: `${energia}%` }} /></div>
            </div>
            <div className="stat-card"><div className="stat-heading"><span>₿</span> EFECTIVO <b className="green">{cash}</b></div><small>USDT disponibles</small></div>
            <div className="stat-card"><div className="stat-heading"><span>⇄</span> TRANSFERENCIA <b className="blue">{transf}</b></div><small>USDT en cuenta</small></div>
            <div className="stat-card"><div className="stat-heading"><span>▣</span> COMBUSTIBLE <b className="purple">{aceite}L / {gasolina}L</b></div><small>aceite / gasolina</small></div>
          </div>
        </header>

        <main className="scene-panel">
          <div className={`scene-art scene-${location.accent}`}>
            <div className="sun" />
            <div className="skyline skyline-back" />
            <div className="skyline skyline-front" />
            <div className="road-line" />
            <span className="scene-label">ZONA EXPLORADA</span>
          </div>
          <div className="location-copy">
            <p className="eyebrow">UBICACIÓN DETECTADA</p>
            <h2>{location.name}</h2>
            <p className="description">{location.description}</p>
            <div className="notice"><span>!</span>{message}</div>
            <button className="primary-action" onClick={interactuar}>INTERACTUAR CON EL LUGAR <span>→</span></button>
          </div>
        </main>

        <footer className="controls-panel">
          <div className="controls-title"><span>DESPLAZAMIENTO</span><small>Usa los controles para explorar</small></div>
          <div className="d-pad">
            <button aria-label="Mover arriba" onClick={() => mover('UP')}>▲</button>
            <button aria-label="Mover izquierda" onClick={() => mover('LEFT')}>◀</button>
            <div className="d-pad-center">MOVE</div>
            <button aria-label="Mover derecha" onClick={() => mover('RIGHT')}>▶</button>
            <button aria-label="Mover abajo" onClick={() => mover('DOWN')}>▼</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
