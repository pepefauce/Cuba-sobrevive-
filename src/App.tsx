import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WORLD_SIZE = 180;

type Stick = { active: boolean; x: number; y: number };

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<Stick>({ active: false, x: 0, y: 0 });
  const lookRef = useRef({ active: false, id: -1, x: 0 });
  const playerRef = useRef({ x: 0, z: 18, angle: Math.PI });
  const [health, setHealth] = useState(100);
  const [message, setMessage] = useState('Explora el pueblo');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#8bb9b1');
    scene.fog = new THREE.Fog('#8bb9b1', 55, 170);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#d9f4e7', '#44382c', 2.2));
    const sun = new THREE.DirectionalLight('#ffe0a3', 3.2);
    sun.position.set(-45, 80, 30); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE), new THREE.MeshStandardMaterial({ color: '#71895d', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    const roadMaterial = new THREE.MeshStandardMaterial({ color: '#a89577', roughness: 1 });
    [[0, 0, 18, WORLD_SIZE], [0, 0, WORLD_SIZE, 18], [-48, 0, 14, WORLD_SIZE], [48, 0, 14, WORLD_SIZE]].forEach(([x, y, w, d]) => {
      const road = new THREE.Mesh(new THREE.BoxGeometry(w, .08, d), roadMaterial); road.position.set(x, .03, y); road.receiveShadow = true; scene.add(road);
    });

    const colliders: THREE.Box3[] = [];
    const house = (x: number, z: number, w: number, d: number, color: string) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, 7, d), new THREE.MeshStandardMaterial({ color, roughness: .9 }));
      body.position.y = 3.5; body.castShadow = true; body.receiveShadow = true; group.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * .72, 3.2, 4), new THREE.MeshStandardMaterial({ color: '#75483c', roughness: 1 }));
      roof.rotation.y = Math.PI / 4; roof.position.y = 8.6; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); roof.castShadow = true; group.add(roof);
      group.position.set(x, 0, z); scene.add(group); colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, 3.5, z), new THREE.Vector3(w + 2, 7, d + 2)));
    };
    [[-28, -35, 17, 13, '#d49b63'], [27, -35, 16, 14, '#bd7655'], [-30, 34, 18, 13, '#d9b56d'], [29, 34, 15, 16, '#c57b58'], [-70, -15, 13, 17, '#b7684d'], [70, 16, 15, 13, '#d49a59'], [-69, 55, 18, 14, '#c9875b'], [66, -58, 19, 15, '#d1a262']].forEach((v) => house(...(v as [number, number, number, number, string])));

    const tree = (x: number, z: number) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.7, 1, 5, 8), new THREE.MeshStandardMaterial({ color: '#684735' }));
      trunk.position.set(x, 2.5, z); trunk.castShadow = true; scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8), new THREE.MeshStandardMaterial({ color: '#39704e', roughness: 1 }));
      crown.position.set(x, 7, z); crown.castShadow = true; scene.add(crown);
    };
    [[-52,-12],[-53,9],[52,8],[54,-11],[-9,-47],[10,-47],[-10,47],[12,47],[-76,-45],[76,45]].forEach(([x,z]) => tree(x,z));

    const player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 2.8, 6, 10), new THREE.MeshStandardMaterial({ color: '#286b72' }));
    body.position.y = 2.5; body.castShadow = true; player.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.05, 12, 8), new THREE.MeshStandardMaterial({ color: '#b87450' }));
    head.position.y = 5.1; head.castShadow = true; player.add(head);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2, .7), new THREE.MeshStandardMaterial({ color: '#343f3c' }));
    pack.position.set(0, 2.8, .9); pack.castShadow = true; player.add(pack);
    scene.add(player);

    const resize = () => { const w = mount.clientWidth; const h = mount.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const blocked = (x: number, z: number) => colliders.some((box) => box.distanceToPoint(new THREE.Vector3(x, 1, z)) < 1.4);
    const updateJoystick = (event: React.PointerEvent) => {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2); const dy = event.clientY - (rect.top + rect.height / 2); const length = Math.min(1, Math.hypot(dx, dy) / (rect.width * .42)); const angle = Math.atan2(dy, dx);
      stickRef.current = { active: true, x: Math.cos(angle) * length, y: Math.sin(angle) * length };
    };
    const down = (e: PointerEvent) => { if (e.pointerType === 'touch' && e.clientX > mount.clientWidth * .42) { lookRef.current = { active: true, id: e.pointerId, x: e.clientX }; } };
    const moveLook = (e: PointerEvent) => { if (lookRef.current.active && lookRef.current.id === e.pointerId) { playerRef.current.angle -= (e.clientX - lookRef.current.x) * .006; lookRef.current.x = e.clientX; } };
    const endLook = () => { lookRef.current.active = false; };
    mount.addEventListener('pointerdown', down); mount.addEventListener('pointermove', moveLook); mount.addEventListener('pointerup', endLook); mount.addEventListener('pointercancel', endLook);

    const clock = new THREE.Clock(); let frame = 0; let raf = 0;
    const animate = () => {
      const dt = Math.min(clock.getDelta(), .05); const p = playerRef.current; const stick = stickRef.current; const speed = (running ? 15 : 8) * dt;
      if (stick.active) { const forward = -stick.y; const strafe = stick.x; const nx = p.x + (Math.sin(p.angle) * forward + Math.cos(p.angle) * strafe) * speed; const nz = p.z + (Math.cos(p.angle) * forward - Math.sin(p.angle) * strafe) * speed; if (!blocked(nx, p.z)) p.x = THREE.MathUtils.clamp(nx, -86, 86); if (!blocked(p.x, nz)) p.z = THREE.MathUtils.clamp(nz, -86, 86); if (Math.hypot(stick.x, stick.y) > .15) player.rotation.y = p.angle; }
      player.position.set(p.x, 0, p.z);
      const behind = new THREE.Vector3(Math.sin(p.angle) * 12, 7.5, Math.cos(p.angle) * 12); const target = new THREE.Vector3(p.x, 2.5, p.z); camera.position.lerp(target.clone().add(behind), .12); camera.lookAt(target);
      renderer.render(scene, camera); if (++frame % 20 === 0) setHealth((value) => Math.max(0, value - (stick.active ? .04 : 0))); raf = requestAnimationFrame(animate);
    };
    resize(); window.addEventListener('resize', resize); raf = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); mount.removeEventListener('pointerdown', down); mount.removeEventListener('pointermove', moveLook); mount.removeEventListener('pointerup', endLook); mount.removeEventListener('pointercancel', endLook); renderer.dispose(); mount.removeChild(renderer.domElement); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const joystickDown = (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); setMessage('Moviéndote por el pueblo'); };
  const joystickMove = (event: React.PointerEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); const dx = event.clientX - (rect.left + rect.width / 2); const dy = event.clientY - (rect.top + rect.height / 2); const limit = rect.width * .36; const length = Math.min(1, Math.hypot(dx, dy) / limit); const angle = Math.atan2(dy, dx); stickRef.current = { active: true, x: Math.cos(angle) * length, y: Math.sin(angle) * length }; };
  const joystickUp = () => { stickRef.current = { active: false, x: 0, y: 0 }; };

  return <div className="battle-shell"><div ref={mountRef} className="world" /><header className="battle-hud"><div className="health"><span className="health-icon">♥</span><div><b>{Math.round(health)}</b><i><em style={{ width: `${health}%` }} /></i></div></div><div className="zone">PUEBLO VIEJO<br /><small>ZONA SEGURA</small></div><button className="map-button" onClick={() => setMessage('Mapa del pueblo abierto')}>MAPA</button></header><div className="crosshair">+</div><div className="objective">{message}</div><div className="joystick" onPointerDown={joystickDown} onPointerMove={joystickMove} onPointerUp={joystickUp} onPointerCancel={joystickUp}><div className="knob" style={{ transform: `translate(${stickRef.current.x * 34}px, ${stickRef.current.y * 34}px)` }} /></div><div className="actions"><button className="action run" onPointerDown={() => setRunning(true)} onPointerUp={() => setRunning(false)}>CORRER</button><button className="action fire" onClick={() => setMessage('No hay enemigos cerca')}>FUEGO</button></div><div className="hint">DESLIZA A LA DERECHA PARA GIRAR</div></div>;
}
