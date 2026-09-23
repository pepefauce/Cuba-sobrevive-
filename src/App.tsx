import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WORLD_HALF = 90;
const PLAYER_RADIUS = 1.4;

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef({ moveX: 0, moveY: 0, run: false, lookActive: false, lookId: -1, lookX: 0 });
  const worldRef = useRef({ x: 0, z: 12, yaw: Math.PI });
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(18);
  const [objective, setObjective] = useState('Explora el pueblo');
  const [moveKnob, setMoveKnob] = useState({ x: 0, y: 0 });
  const [run, setRun] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#8eb3b0');
    scene.fog = new THREE.Fog('#8eb3b0', 40, 190);

    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight('#d9f3eb', '#4b3a2d', 2.2);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight('#ffd79d', 2.8);
    sun.position.set(-30, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2),
      new THREE.MeshStandardMaterial({ color: '#6c865e', roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMaterial = new THREE.MeshStandardMaterial({ color: '#a79172', roughness: 1 });
    const roads = [
      { x: 0, z: 0, w: 18, d: WORLD_HALF * 2 },
      { x: 0, z: 0, w: WORLD_HALF * 2, d: 18 },
      { x: -44, z: 0, w: 14, d: WORLD_HALF * 2 },
      { x: 44, z: 0, w: 14, d: WORLD_HALF * 2 },
    ];
    roads.forEach(({ x, z, w, d }) => {
      const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), roadMaterial);
      road.position.set(x, 0.02, z);
      road.receiveShadow = true;
      scene.add(road);
    });

    const obstacles: Array<{ center: THREE.Vector3; size: THREE.Vector3 }> = [];
    const addHouse = (x: number, z: number, w: number, d: number, color: string) => {
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(w, 7, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
      );
      base.position.y = 3.5;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(w, d) * 0.72, 3.5, 4),
        new THREE.MeshStandardMaterial({ color: '#7a4d40', roughness: 1 })
      );
      roof.position.y = 8.4;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);

      group.position.set(x, 0, z);
      scene.add(group);
      obstacles.push({ center: new THREE.Vector3(x, 0, z), size: new THREE.Vector3(w + 2, 7, d + 2) });
    };

    [
      [-30, -34, 18, 14, '#d7a66b'],
      [30, -36, 16, 14, '#b86f58'],
      [-30, 34, 18, 16, '#d0ad59'],
      [30, 34, 18, 15, '#c67d5f'],
      [-70, -10, 15, 18, '#a8674f'],
      [66, 14, 18, 15, '#d7a668'],
      [-67, 54, 18, 14, '#c7875e'],
      [66, -58, 18, 16, '#d6b066'],
    ].forEach((v) => addHouse(v[0], v[1], v[2], v[3], v[4] as string));

    const addTree = (x: number, z: number) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.95, 5, 8),
        new THREE.MeshStandardMaterial({ color: '#6d4d36', roughness: 1 })
      );
      trunk.position.set(x, 2.5, z);
      trunk.castShadow = true;
      scene.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(4.2, 12, 10),
        new THREE.MeshStandardMaterial({ color: '#3a7d4d', roughness: 1 })
      );
      crown.position.set(x, 7, z);
      crown.castShadow = true;
      scene.add(crown);
    };

    [
      [-52, -12], [-52, 10], [52, 12], [54, -10],
      [-8, -48], [8, -48], [-8, 48], [8, 48],
      [-78, -44], [76, 46]
    ].forEach(([x, z]) => addTree(x, z));

    const playerMesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(1.2, 2.6, 6, 12),
      new THREE.MeshStandardMaterial({ color: '#234c5d', roughness: 0.8 })
    );
    body.position.y = 2.2;
    body.castShadow = true;
    playerMesh.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 18, 14),
      new THREE.MeshStandardMaterial({ color: '#d49d74', roughness: 1 })
    );
    head.position.y = 4.8;
    head.castShadow = true;
    playerMesh.add(head);

    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.9, 0.7),
      new THREE.MeshStandardMaterial({ color: '#2a3740', roughness: 1 })
    );
    pack.position.set(0, 2.9, 0.9);
    pack.castShadow = true;
    playerMesh.add(pack);
    scene.add(playerMesh);

    const isBlocked = (x: number, z: number) => {
      for (const obstacle of obstacles) {
        const dx = Math.abs(x - obstacle.center.x);
        const dz = Math.abs(z - obstacle.center.z);
        const halfX = obstacle.size.x / 2 + PLAYER_RADIUS;
        const halfZ = obstacle.size.z / 2 + PLAYER_RADIUS;
        if (dx < halfX && dz < halfZ) return true;
      }
      return false;
    };

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const processCamera = () => {
      const state = worldRef.current;
      const playerPos = new THREE.Vector3(state.x, 0, state.z);
      const offset = new THREE.Vector3(Math.sin(state.yaw) * -11, 6.6, Math.cos(state.yaw) * -11);
      const desiredCamera = playerPos.clone().add(offset);
      camera.position.lerp(desiredCamera, 0.12);
      camera.lookAt(playerPos.clone().add(new THREE.Vector3(0, 2.8, 0)));
      playerMesh.position.set(state.x, 0, state.z);
      playerMesh.rotation.y = -state.yaw + Math.PI / 2;
    };

    let previous = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;

      const state = worldRef.current;
      const moveAxis = controlsRef.current.moveX;
      const moveForward = controlsRef.current.moveY;
      const speed = controlsRef.current.run ? 18 : 11;

      const moveDir = new THREE.Vector3(
        Math.sin(state.yaw) * moveForward + Math.cos(state.yaw) * moveAxis,
        0,
        Math.cos(state.yaw) * moveForward - Math.sin(state.yaw) * moveAxis
      );

      if (moveDir.lengthSq() > 0.001) {
        const normalized = moveDir.normalize();
        const nextX = state.x + normalized.x * speed * dt;
        const nextZ = state.z + normalized.z * speed * dt;
        if (!isBlocked(nextX, state.z)) state.x = THREE.MathUtils.clamp(nextX, -WORLD_HALF + 2, WORLD_HALF - 2);
        if (!isBlocked(state.x, nextZ)) state.z = THREE.MathUtils.clamp(nextZ, -WORLD_HALF + 2, WORLD_HALF - 2);
      }

      processCamera();
      renderer.render(scene, camera);

      if (Math.floor(now / 180) % 2 === 0) {
        setHealth((value) => Math.max(0, value - (controlsRef.current.run ? 0.05 : 0.02)));
      }

      rafId = requestAnimationFrame(tick);
    };

    const handleLookDown = (event: PointerEvent) => {
      controlsRef.current.lookActive = true;
      controlsRef.current.lookId = event.pointerId;
      controlsRef.current.lookX = event.clientX;
    };

    const handleLookMove = (event: PointerEvent) => {
      if (!controlsRef.current.lookActive || controlsRef.current.lookId !== event.pointerId) return;
      const delta = event.clientX - controlsRef.current.lookX;
      worldRef.current.yaw -= delta * 0.006;
      controlsRef.current.lookX = event.clientX;
    };

    const handleLookUp = () => {
      controlsRef.current.lookActive = false;
      controlsRef.current.lookId = -1;
    };

    mount.addEventListener('pointerdown', handleLookDown);
    mount.addEventListener('pointermove', handleLookMove);
    mount.addEventListener('pointerup', handleLookUp);
    mount.addEventListener('pointercancel', handleLookUp);
    window.addEventListener('resize', resize);
    resize();
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      mount.removeEventListener('pointerdown', handleLookDown);
      mount.removeEventListener('pointermove', handleLookMove);
      mount.removeEventListener('pointerup', handleLookUp);
      mount.removeEventListener('pointercancel', handleLookUp);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const updateMovePad = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const max = rect.width * 0.34;
    const dist = Math.min(max, Math.hypot(dx, dy));
    const rad = Math.atan2(dy, dx);
    const x = Math.cos(rad) * (dist / max);
    const y = Math.sin(rad) * (dist / max);

    controlsRef.current.moveX = x;
    controlsRef.current.moveY = -y;
    setMoveKnob({ x: x * 28, y: y * 28 });
  };

  const releaseMovePad = () => {
    controlsRef.current.moveX = 0;
    controlsRef.current.moveY = 0;
    setMoveKnob({ x: 0, y: 0 });
  };

  const fireShot = () => {
    setAmmo((value) => Math.max(0, value - 1));
    setObjective('Disparo hecho');
  };

  const toggleRun = () => {
    const next = !run;
    controlsRef.current.run = next;
    setRun(next);
    setObjective(next ? 'Correr activado' : 'Movimiento normal');
  };

  return (
    <div className="game-shell">
      <div ref={mountRef} className="game-world" />

      <header className="top-hud">
        <div className="hud-pill health-pill">
          <span className="heart">♥</span>
          <div className="stat-block">
            <strong>{Math.round(health)}</strong>
            <i><em style={{ width: `${health}%` }} /></i>
          </div>
        </div>

        <div className="hud-pill compact">
          <span>{ammo}</span>
          <small>AMMO</small>
        </div>
      </header>

      <div className="crosshair">+</div>
      <div className="objective-tag">{objective}</div>

      <div
        className="move-pad"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateMovePad(event);
        }}
        onPointerMove={updateMovePad}
        onPointerUp={releaseMovePad}
        onPointerLeave={releaseMovePad}
        onPointerCancel={releaseMovePad}
      >
        <div className="move-knob" style={{ transform: `translate(${moveKnob.x}px, ${moveKnob.y}px)` }} />
      </div>

      <div className="action-bar">
        <button className={`action ${run ? 'run-on' : ''}`} onPointerDown={toggleRun} onPointerUp={toggleRun}>
          RUN
        </button>
        <button className="action fire" onClick={fireShot}>FIRE</button>
      </div>
    </div>
  );
}
