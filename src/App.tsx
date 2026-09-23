import React, { useEffect, useRef, useState } from 'react';

const MAP = [
  '1111111111111111', '1..............1', '1..111...22....1', '1..1.1...2.....1',
  '1..1.1.........1', '1..111....111..1', '1...........1..1', '1....333....1..1',
  '1....3.3.......1', '1....333.......1', '1..............1', '1..22......11..1',
  '1...2..........1', '1..............1', '1..............1', '1111111111111111',
];
const TILE_COLORS: Record<string, string> = { '1': '#bf7651', '2': '#d2a34f', '3': '#6c7d61' };
const isWall = (x: number, y: number) => MAP[Math.floor(y)]?.[Math.floor(x)] !== '.';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ x: 2.5, y: 12.5, angle: -Math.PI / 2 });
  const keysRef = useRef<Record<string, boolean>>({});
  const lookRef = useRef<{ id: number; x: number } | null>(null);
  const [energy, setEnergy] = useState(100);
  const [position, setPosition] = useState({ x: 2.5, y: 12.5 });
  const [notice, setNotice] = useState('Desliza la pantalla para mirar y usa el control para caminar.');

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
      const width = canvas.clientWidth; const height = canvas.clientHeight; const player = playerRef.current;
      const horizon = height * .47; ctx.clearRect(0, 0, width, height);
      const sky = ctx.createLinearGradient(0, 0, 0, horizon); sky.addColorStop(0, '#8bc4c7'); sky.addColorStop(.7, '#e6c88e'); sky.addColorStop(1, '#d58b59'); ctx.fillStyle = sky; ctx.fillRect(0, 0, width, horizon);
      ctx.fillStyle = '#7e654d'; ctx.fillRect(0, horizon, width, height - horizon);
      ctx.fillStyle = 'rgba(255,232,164,.9)'; ctx.beginPath(); ctx.arc(width * .78, height * .2, 32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(37,65,63,.45)'; for (let i = 0; i < 12; i++) { const bx = i * width / 11; ctx.fillRect(bx, horizon - 12 - (i % 4) * 9, width / 14, 12 + (i % 4) * 9); }
      const fov = Math.PI / 3; const rays = Math.max(180, Math.floor(width / 2)); const strip = width / rays;
      for (let ray = 0; ray < rays; ray++) {
        const rayAngle = player.angle - fov / 2 + ray / rays * fov; let distance = 0; let tile = '1';
        while (distance < 22) { distance += .025; const testX = player.x + Math.cos(rayAngle) * distance; const testY = player.y + Math.sin(rayAngle) * distance; if (isWall(testX, testY)) { tile = MAP[Math.floor(testY)]?.[Math.floor(testX)] || '1'; break; } }
        const corrected = distance * Math.cos(rayAngle - player.angle); const wallHeight = Math.min(height * 1.8, height * .78 / Math.max(corrected, .01)); const top = horizon - wallHeight / 2; const shade = Math.max(.22, 1 - corrected / 13);
        ctx.fillStyle = shadeColor(TILE_COLORS[tile] || TILE_COLORS['1'], shade); ctx.fillRect(ray * strip, top, strip + 1, wallHeight);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(width / 2 - 8, height / 2); ctx.lineTo(width / 2 + 8, height / 2); ctx.moveTo(width / 2, height / 2 - 8); ctx.lineTo(width / 2, height / 2 + 8); ctx.stroke();
      ctx.fillStyle = 'rgba(8,20,27,.58)'; ctx.fillRect(16, height - 44, 210, 28); ctx.fillStyle = '#f8dfaa'; ctx.font = '11px system-ui'; ctx.fillText('PUEBLO DE LA HABANA · EXPLORACIÓN', 27, height - 26);
    };
    const move = (delta: number) => {
      const player = playerRef.current; const keys = keysRef.current; const speed = delta * 2.3; let dx = 0; let dy = 0;
      if (keys.w || keys.arrowup) { dx += Math.cos(player.angle) * speed; dy += Math.sin(player.angle) * speed; }
      if (keys.s || keys.arrowdown) { dx -= Math.cos(player.angle) * speed; dy -= Math.sin(player.angle) * speed; }
      if (keys.a) { dx += Math.cos(player.angle - Math.PI / 2) * speed; dy += Math.sin(player.angle - Math.PI / 2) * speed; }
      if (keys.d) { dx += Math.cos(player.angle + Math.PI / 2) * speed; dy += Math.sin(player.angle + Math.PI / 2) * speed; }
      if (keys.arrowleft) player.angle -= delta * 2.2; if (keys.arrowright) player.angle += delta * 2.2;
      if (!isWall(player.x + dx, player.y)) player.x += dx; if (!isWall(player.x, player.y + dy)) player.y += dy;
    };
    let last = performance.now(); let frame = 0; let animation = 0;
    const loop = (now: number) => { const delta = Math.min((now - last) / 1000, .05); last = now; move(delta); render(); if (++frame % 10 === 0) { setPosition({ x: playerRef.current.x, y: playerRef.current.y }); if (Object.values(keysRef.current).some(Boolean)) setEnergy(value => Math.max(0, value - .08)); } animation = requestAnimationFrame(loop); };
    resize(); window.addEventListener('resize', resize); animation = requestAnimationFrame(loop);
    const down = (event: KeyboardEvent) => { keysRef.current[event.key.toLowerCase()] = true; }; const up = (event: KeyboardEvent) => { keysRef.current[event.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { cancelAnimationFrame(animation); window.removeEventListener('resize', resize); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const hold = (key: string, active: boolean) => { keysRef.current[key] = active; if (active) setNotice('Caminando por el pueblo...'); };
  const lookStart = (event: React.PointerEvent<HTMLCanvasElement>) => { if (event.pointerType === 'touch') { event.currentTarget.setPointerCapture(event.pointerId); lookRef.current = { id: event.pointerId, x: event.clientX }; } };
  const lookMove = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!lookRef.current || lookRef.current.id !== event.pointerId) return; const difference = event.clientX - lookRef.current.x; playerRef.current.angle += difference * .009; lookRef.current.x = event.clientX; };
  const lookEnd = () => { lookRef.current = null; };

  return <div className="game-shell first-person">
    <header className="game-hud"><div><p className="eyebrow">CUBA // SOBREVIVE</p><h1>Exploración del pueblo</h1></div><div className="hud-right"><span className="online"><i /> EN LÍNEA</span><span>ENERGÍA <b>{Math.floor(energy)}%</b></span></div></header>
    <main className="viewport-panel"><canvas ref={canvasRef} onPointerDown={lookStart} onPointerMove={lookMove} onPointerUp={lookEnd} onPointerCancel={lookEnd} /><div className="direction">N</div><div className="crosshair-label">DESLIZA PARA MIRAR</div></main>
    <section className="bottom-hud"><div><span className="eyebrow">POSICIÓN</span><strong>{position.x.toFixed(1)}, {position.y.toFixed(1)}</strong><p>{notice}</p></div><div className="mobile-controls"><button aria-label="Girar izquierda" onPointerDown={() => hold('arrowleft', true)} onPointerUp={() => hold('arrowleft', false)} onPointerLeave={() => hold('arrowleft', false)}>↶</button><button aria-label="Avanzar" onPointerDown={() => hold('w', true)} onPointerUp={() => hold('w', false)} onPointerLeave={() => hold('w', false)}>▲</button><button aria-label="Girar derecha" onPointerDown={() => hold('arrowright', true)} onPointerUp={() => hold('arrowright', false)} onPointerLeave={() => hold('arrowright', false)}>↷</button><button aria-label="Retroceder" onPointerDown={() => hold('s', true)} onPointerUp={() => hold('s', false)} onPointerLeave={() => hold('s', false)}>▼</button></div><small>DESLIZA LA VISTA<br />MANTÉN PULSADO PARA CAMINAR</small></section>
  </div>;
}
function shadeColor(hex: string, amount: number) { const value = hex.replace('#', ''); const r = Math.floor(parseInt(value.slice(0, 2), 16) * amount); const g = Math.floor(parseInt(value.slice(2, 4), 16) * amount); const b = Math.floor(parseInt(value.slice(4, 6), 16) * amount); return `rgb(${r}, ${g}, ${b})`; }
