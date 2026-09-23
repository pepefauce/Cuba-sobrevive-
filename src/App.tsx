import React, { useEffect, useRef, useState } from 'react';

const MAP = [
  '1111111111111111',
  '1..............1',
  '1..111...22....1',
  '1..1.1...2.....1',
  '1..1.1.........1',
  '1..111....111..1',
  '1...........1..1',
  '1....333....1..1',
  '1....3.3.......1',
  '1....333.......1',
  '1..............1',
  '1..22......11..1',
  '1...2..........1',
  '1..............1',
  '1..............1',
  '1111111111111111',
];

const TILE_COLORS: Record<string, string> = {
  '1': '#ab6045',
  '2': '#d4a04a',
  '3': '#5a6d4d',
};

const blocked = (x: number, y: number) => {
  const row = MAP[Math.floor(y)];
  return row ? row[Math.floor(x)] !== '.' : true;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef({ x: 2.5, y: 12.5, angle: -Math.PI / 2 });
  const controlsRef = useRef<Record<string, boolean>>({});
  const dragRef = useRef<{ id: number; x: number } | null>(null);
  const [energy, setEnergy] = useState(100);
  const [position, setPosition] = useState({ x: 2.5, y: 12.5 });
  const [status, setStatus] = useState('Busca suministros');
  const [ammo, setAmmo] = useState(12);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const p = playerRef.current;
      const horizon = h * 0.48;

      ctx.clearRect(0, 0, w, h);

      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#8dbdb4');
      sky.addColorStop(0.5, '#d7b676');
      sky.addColorStop(1, '#ce7d4f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizon);

      ctx.fillStyle = '#6b503e';
      ctx.fillRect(0, horizon, w, h - horizon);

      ctx.fillStyle = 'rgba(255,211,118,0.9)';
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.18, 28, 0, Math.PI * 2);
      ctx.fill();

      const fov = Math.PI / 3;
      const rays = Math.max(220, Math.min(480, Math.floor(w * 0.7)));
      const strip = w / rays;

      for (let i = 0; i < rays; i++) {
        const rayAngle = p.angle - fov / 2 + (i / rays) * fov;
        let d = 0.02;
        let hit = false;
        let tile = '1';

        while (!hit && d < 18) {
          d += 0.04;
          const x = p.x + Math.cos(rayAngle) * d;
          const y = p.y + Math.sin(rayAngle) * d;
          if (blocked(x, y)) {
            hit = true;
            tile = MAP[Math.floor(y)]?.[Math.floor(x)] || '1';
          }
        }

        const corrected = d * Math.cos(rayAngle - p.angle);
        const wallH = Math.min(h * 1.9, (h * 0.86) / Math.max(corrected, 0.02));
        const top = horizon - wallH / 2;
        const shade = Math.max(0.22, 1 - corrected / 18);
        const color = TILE_COLORS[tile] || '#d0d0d0';
        ctx.fillStyle = shadeColor(color, shade);
        ctx.fillRect(i * strip, top, strip + 1, wallH);
      }

      ctx.fillStyle = 'rgba(6,15,18,0.35)';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,240,180,0.9)';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 7, h / 2);
      ctx.lineTo(w / 2 + 7, h / 2);
      ctx.moveTo(w / 2, h / 2 - 7);
      ctx.lineTo(w / 2, h / 2 + 7);
      ctx.stroke();

      ctx.fillStyle = 'rgba(10,18,22,0.35)';
      ctx.fillRect(0, h - 58, w, 58);
    };

    const update = (dt: number) => {
      const p = playerRef.current;
      const ctrl = controlsRef.current;
      const speed = dt * 2.2;

      let dx = 0;
      let dy = 0;

      if (ctrl.forward) {
        dx += Math.cos(p.angle) * speed;
        dy += Math.sin(p.angle) * speed;
      }
      if (ctrl.back) {
        dx -= Math.cos(p.angle) * speed;
        dy -= Math.sin(p.angle) * speed;
      }
      if (ctrl.left) {
        p.angle -= dt * 2.2;
      }
      if (ctrl.right) {
        p.angle += dt * 2.2;
      }

      if (!blocked(p.x + dx, p.y)) p.x += dx;
      if (!blocked(p.x, p.y + dy)) p.y += dy;
    };

    let previous = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      update(dt);
      render();

      if (Math.floor(now / 100) % 2 === 0) {
        setPosition({ x: playerRef.current.x, y: playerRef.current.y });
        if (Object.values(controlsRef.current).some(Boolean)) {
          setEnergy((v) => Math.max(0, v - 0.08));
        }
      }

      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') controlsRef.current.forward = true;
      if (key === 's' || key === 'arrowdown') controlsRef.current.back = true;
      if (key === 'a' || key === 'arrowleft') controlsRef.current.left = true;
      if (key === 'd' || key === 'arrowright') controlsRef.current.right = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') controlsRef.current.forward = false;
      if (key === 's' || key === 'arrowdown') controlsRef.current.back = false;
      if (key === 'a' || key === 'arrowleft') controlsRef.current.left = false;
      if (key === 'd' || key === 'arrowright') controlsRef.current.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const setControl = (key: string, active: boolean) => {
    controlsRef.current[key] = active;
    if (active) setStatus('Moviendo por el pueblo');
  };

  const startDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'touch') {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { id: event.pointerId, x: event.clientX };
    }
  };

  const moveDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || dragRef.current.id !== event.pointerId) return;
    const diff = event.clientX - dragRef.current.x;
    playerRef.current.angle += diff * 0.008;
    dragRef.current.x = event.clientX;
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const shoot = () => {
    setAmmo((n) => Math.max(0, n - 1));
    setStatus('Disparo efectuado');
  };

  return (
    <div className="game-shell">
      <header className="game-header">
        <div className="left-panel">
          <div className="life-pill">
            <span className="dot" />
            VIVO
          </div>
          <div className="mini-map">
            <span>MAPA</span>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat"><span>HP</span><strong>{Math.round(energy)}%</strong></div>
          <div className="stat"><span>AMMO</span><strong>{ammo}</strong></div>
          <div className="stat"><span>DIN</span><strong>1500</strong></div>
        </div>
      </header>

      <main className="viewport-wrapper">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        />

        <div className="world-status">
          <span>POS {position.x.toFixed(1)}, {position.y.toFixed(1)}</span>
          <span>{status}</span>
        </div>
      </main>

      <footer className="game-controls">
        <div className="left-joystick">
          <button className="stick-btn" onPointerDown={() => setControl('forward', true)} onPointerUp={() => setControl('forward', false)} onPointerLeave={() => setControl('forward', false)}>▲</button>
          <button className="stick-btn" onPointerDown={() => setControl('left', true)} onPointerUp={() => setControl('left', false)} onPointerLeave={() => setControl('left', false)}>◀</button>
          <button className="stick-btn" onPointerDown={() => setControl('right', true)} onPointerUp={() => setControl('right', false)} onPointerLeave={() => setControl('right', false)}>▶</button>
          <button className="stick-btn" onPointerDown={() => setControl('back', true)} onPointerUp={() => setControl('back', false)} onPointerLeave={() => setControl('back', false)}>▼</button>
        </div>

        <div className="action-panel">
          <button className="action-btn run">RUN</button>
          <button className="action-btn fire" onClick={shoot}>FIRE</button>
        </div>
      </footer>
    </div>
  );
}

function shadeColor(hex: string, amount: number) {
  const value = hex.replace('#', '');
  const r = Math.max(0, Math.min(255, Math.floor(parseInt(value.slice(0, 2), 16) * amount)));
  const g = Math.max(0, Math.min(255, Math.floor(parseInt(value.slice(2, 4), 16) * amount)));
  const b = Math.max(0, Math.min(255, Math.floor(parseInt(value.slice(4, 6), 16) * amount)));
  return `rgb(${r}, ${g}, ${b})`;
}
