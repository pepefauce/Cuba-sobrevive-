import React, { useEffect, useRef, useState } from 'react';

const MAP = [
  '1111111111111111', '1..............1', '1..111...22....1', '1..1.1...2.....1',
  '1..1.1.........1', '1..111....111..1', '1...........1..1', '1....333....1..1',
  '1....3.3.......1', '1....333.......1', '1..............1', '1..22......11..1',
  '1...2..........1', '1..............1', '1..............1', '1111111111111111',
];
const WALLS: Record<string, string> = { '1': '#bd7250', '2': '#c58e45', '3': '#64765d' };
const blocked = (x: number, y: number) => MAP[Math.floor(y)]?.[Math.floor(x)] !== '.';

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef({ x: 2.5, y: 12.5, angle: -Math.PI / 2 });
  const controls = useRef<Record<string, boolean>>({});
  const dragging = useRef<{ id: number; x: number } | null>(null);
  const [energy, setEnergy] = useState(100);
  const [pos, setPos] = useState({ x: 2.5, y: 12.5 });
  const [status, setStatus] = useState('Desliza para mirar alrededor');

  useEffect(() => {
    const view = canvas.current; const ctx = view?.getContext('2d');
    if (!view || !ctx) return;
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); view.width = view.clientWidth * dpr; view.height = view.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const draw = () => {
      const w = view.clientWidth, h = view.clientHeight, p = player.current, horizon = h * .48;
      const sky = ctx.createLinearGradient(0, 0, 0, horizon); sky.addColorStop(0, '#75b2b7'); sky.addColorStop(.72, '#d9b777'); sky.addColorStop(1, '#e18d56'); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, horizon);
      ctx.fillStyle = '#70564a'; ctx.fillRect(0, horizon, w, h - horizon);
      ctx.fillStyle = 'rgba(255,226,157,.9)'; ctx.beginPath(); ctx.arc(w * .78, h * .2, 27, 0, 7); ctx.fill();
      // Silueta de casas lejanas.
      ctx.fillStyle = 'rgba(31,65,65,.42)'; for (let i = 0; i < 13; i++) { const x = i * w / 12; const bh = 12 + (i % 4) * 8; ctx.fillRect(x, horizon - bh, w / 15, bh); }
      const fov = Math.PI / 3.1, rays = Math.min(420, Math.max(220, Math.floor(w * .7))), strip = w / rays;
      for (let r = 0; r < rays; r++) {
        const a = p.angle - fov / 2 + r / rays * fov; let distance = .02; let tile = '1';
        while (distance < 24) { const tx = p.x + Math.cos(a) * distance, ty = p.y + Math.sin(a) * distance; if (blocked(tx, ty)) { tile = MAP[Math.floor(ty)]?.[Math.floor(tx)] || '1'; break; } distance += .035; }
        const corrected = distance * Math.cos(a - p.angle), wall = Math.min(h * 1.8, h * .82 / Math.max(corrected, .02)), top = horizon - wall / 2;
        const light = Math.max(.3, 1 - corrected / 17); ctx.fillStyle = shade(WALLS[tile] || WALLS['1'], light); ctx.fillRect(r * strip, top, strip + 1, wall);
        // Detalles verticales de las fachadas para evitar paredes planas.
        if (corrected < 9 && r % 13 < 3) { ctx.fillStyle = 'rgba(45,31,28,.28)'; ctx.fillRect(r * strip, top + wall * .25, strip + 1, wall * .16); }
        ctx.fillStyle = `rgba(8,18,23,${Math.min(.4, corrected / 30)})`; ctx.fillRect(r * strip, top, strip + 1, 2);
      }
      // Vignette y retícula discreta.
      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * .18, w / 2, h / 2, h * .75); vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, 'rgba(4,12,17,.48)'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,245,211,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w / 2 - 7, h / 2); ctx.lineTo(w / 2 + 7, h / 2); ctx.moveTo(w / 2, h / 2 - 7); ctx.lineTo(w / 2, h / 2 + 7); ctx.stroke();
    };
    const update = (dt: number) => { const p = player.current, k = controls.current, speed = dt * 2.1; let dx = 0, dy = 0; if (k.forward) { dx += Math.cos(p.angle) * speed; dy += Math.sin(p.angle) * speed; } if (k.back) { dx -= Math.cos(p.angle) * speed; dy -= Math.sin(p.angle) * speed; } if (k.left) p.angle -= dt * 2.3; if (k.right) p.angle += dt * 2.3; if (!blocked(p.x + dx, p.y)) p.x += dx; if (!blocked(p.x, p.y + dy)) p.y += dy; };
    let previous = performance.now(), frame = 0, raf = 0; const loop = (now: number) => { const dt = Math.min((now - previous) / 1000, .05); previous = now; update(dt); draw(); if (++frame % 12 === 0) { setPos({ x: player.current.x, y: player.current.y }); if (Object.values(controls.current).some(Boolean)) setEnergy(e => Math.max(0, e - .05)); } raf = requestAnimationFrame(loop); };
    resize(); addEventListener('resize', resize); raf = requestAnimationFrame(loop); const down = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (key === 'w' || key === 'arrowup') controls.current.forward = true; if (key === 's' || key === 'arrowdown') controls.current.back = true; if (key === 'a' || key === 'arrowleft') controls.current.left = true; if (key === 'd' || key === 'arrowright') controls.current.right = true; }; const up = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (key === 'w' || key === 'arrowup') controls.current.forward = false; if (key === 's' || key === 'arrowdown') controls.current.back = false; if (key === 'a' || key === 'arrowleft') controls.current.left = false; if (key === 'd' || key === 'arrowright') controls.current.right = false; }; addEventListener('keydown', down); addEventListener('keyup', up);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('keydown', down); removeEventListener('keyup', up); };
  }, []);

  const hold = (key: string, value: boolean) => { controls.current[key] = value; setStatus(value ? 'Caminando por el pueblo…' : 'Desliza para mirar alrededor'); };
  const lookStart = (e: React.PointerEvent<HTMLCanvasElement>) => { if (e.pointerType === 'touch') { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = { id: e.pointerId, x: e.clientX }; } };
  const lookMove = (e: React.PointerEvent<HTMLCanvasElement>) => { if (dragging.current?.id !== e.pointerId) return; player.current.angle += (e.clientX - dragging.current.x) * .008; dragging.current.x = e.clientX; };
  return <div className="game-shell"><header className="game-hud"><div><p className="eyebrow">CUBA // SOBREVIVE</p><h1>El pueblo</h1></div><div className="hud-right"><span className="online"><i /> EN LÍNEA</span><span>⚡ {Math.floor(energy)}%</span></div></header><main className="viewport"><canvas ref={canvas} onPointerDown={lookStart} onPointerMove={lookMove} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }} /><span className="look-tip">DESLIZA PARA MIRAR</span></main><footer className="bottom-hud"><div><p className="eyebrow">POSICIÓN {pos.x.toFixed(1)}, {pos.y.toFixed(1)}</p><span>{status}</span></div><div className="mobile-controls"><button onPointerDown={() => hold('left', true)} onPointerUp={() => hold('left', false)} onPointerLeave={() => hold('left', false)}>↶</button><button onPointerDown={() => hold('forward', true)} onPointerUp={() => hold('forward', false)} onPointerLeave={() => hold('forward', false)}>▲</button><button onPointerDown={() => hold('right', true)} onPointerUp={() => hold('right', false)} onPointerLeave={() => hold('right', false)}>↷</button><button onPointerDown={() => hold('back', true)} onPointerUp={() => hold('back', false)} onPointerLeave={() => hold('back', false)}>▼</button></div></footer></div>;
}
function shade(hex: string, factor: number) { const n = hex.slice(1); return `rgb(${Math.floor(parseInt(n.slice(0,2),16)*factor)},${Math.floor(parseInt(n.slice(2,4),16)*factor)},${Math.floor(parseInt(n.slice(4,6),16)*factor)})`; }
