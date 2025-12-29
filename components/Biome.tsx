
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Html, useCursor, Float, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { Position, PlantedTree } from '../types';
import { GROUND_SIZE } from '../constants';

interface BiomeProps {
  positions: Position[];
  plantedTrees: PlantedTree[];
  sustainabilityScore: number;
}

// --- Visual FX Components ---

const Fire = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        // Jitter movement up
        mesh.position.y += 0.05 + Math.random() * 0.05;
        // Reset if too high
        if (mesh.position.y > 1.5) {
          mesh.position.y = 0;
          mesh.position.x = (Math.random() - 0.5) * 0.5;
          mesh.position.z = (Math.random() - 0.5) * 0.5;
        }
        // Scale pulse
        const s = 1 - (mesh.position.y / 1.5);
        mesh.scale.setScalar(s * 0.5);
      });
    }
  });

  return (
    <group ref={ref}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 0.5, Math.random(), (Math.random() - 0.5) * 0.5]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ea580c" emissive="#f97316" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
};

const Rain = ({ intensity }: { intensity: 'light' | 'heavy' }) => {
  const count = intensity === 'heavy' ? 400 : 100;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Initial positions
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = {
        x: (Math.random() - 0.5) * GROUND_SIZE,
        y: 10 + Math.random() * 20,
        z: (Math.random() - 0.5) * GROUND_SIZE,
        speed: 0.2 + Math.random() * 0.3
      };
      temp.push(t);
    }
    return temp;
  }, [count]);

  const dummy = new THREE.Object3D();

  useFrame(() => {
    if (!meshRef.current) return;
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < 0) particle.y = 20;
      
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.set(0.05, 0.5, 0.05);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#a5f3fc" transparent opacity={0.6} />
    </instancedMesh>
  );
};

const Lightning = () => {
  const [flash, setFlash] = useState(false);
  
  useFrame(() => {
    if (Math.random() > 0.98) {
      setFlash(true);
      setTimeout(() => setFlash(false), 100);
    }
  });

  return (
    <>
      {flash && <directionalLight position={[0, 50, 0]} intensity={20} color="white" />}
      {flash && <color attach="background" args={['#e2e8f0']} />}
    </>
  );
};

// --- Asset Components ---

const Tooltip: React.FC<{ position: Position, pnl: number, symbol: string, type: string }> = ({ position, pnl, symbol, type }) => {
  return (
    <Html distanceFactor={15} position={[0, 3.5, 0]} style={{ pointerEvents: 'none' }}>
      <div className="bg-slate-900/90 text-white p-2 rounded border border-slate-700 text-xs whitespace-nowrap shadow-xl backdrop-blur-sm transform -translate-x-1/2 -translate-y-full">
        <div className="font-bold flex items-center gap-1">
          <span className={type === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>{type}</span>
          <span>{symbol}</span>
        </div>
        <div className={`font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
        </div>
      </div>
    </Html>
  );
};

const House: React.FC<{ x: number, z: number, rotation?: number }> = ({ x, z, rotation = 0 }) => {
    return (
        <group position={[x, 0.75, z]} rotation={[0, rotation, 0]}>
            {/* Base */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshStandardMaterial color="#fcd34d" /> 
            </mesh>
            {/* Roof */}
            <mesh position={[0, 1.25, 0]} castShadow>
                <coneGeometry args={[1.2, 1.2, 4]} rotation={[0, Math.PI / 4, 0]} />
                <meshStandardMaterial color="#991b1b" />
            </mesh>
            {/* Door */}
            <mesh position={[0, -0.25, 0.76]}>
                <planeGeometry args={[0.5, 1]} />
                <meshStandardMaterial color="#451a03" />
            </mesh>
        </group>
    )
}

interface TreeProps {
    x: number;
    z: number;
    scale?: number;
    isBurning?: boolean;
    positionData?: Position; // Optional, only for active positions
}

const Tree: React.FC<TreeProps> = ({ x, z, scale = 1, isBurning = false, positionData }) => {
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  // If active, dynamic scale based on PnL
  const currentScale = positionData 
     ? Math.min(Math.max(1 + (positionData.pnlPercent / 100), 0.5), 2.5) 
     : scale;

  const pnl = positionData?.pnlPercent || 0;
  const isHealthy = pnl >= 0;
  const foliageColor = isBurning ? '#1f2937' : (!positionData || isHealthy) ? '#34d399' : '#d97706'; 

  return (
    <group position={[x, 0, z]} scale={[currentScale, currentScale, currentScale]} 
           onPointerOver={() => positionData && setHover(true)} 
           onPointerOut={() => setHover(false)}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={foliageColor} roughness={0.8} />
      </mesh>
      
      {isBurning && <group position={[0, 1, 0]}><Fire /></group>}
      {hovered && positionData && <Tooltip position={positionData} pnl={pnl} symbol={positionData.symbol} type={positionData.type} />}
    </group>
  );
};

interface MountainProps {
    x: number;
    z: number;
    positionData: Position;
    isBurning: boolean;
}

const Mountain: React.FC<MountainProps> = ({ x, z, positionData, isBurning }) => {
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  const pnl = positionData.pnlPercent;
  const isHealthy = pnl >= 0;
  const scale = Math.min(Math.max(1 + (pnl / 100), 0.5), 3);
  const color = isBurning ? '#475569' : isHealthy ? '#94a3b8' : '#7f1d1d';

  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}
           onPointerOver={() => setHover(true)} 
           onPointerOut={() => setHover(false)}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <coneGeometry args={[1, 2, 4]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {isHealthy && !isBurning && (
        <mesh position={[0, 1.6, 0]}>
           <coneGeometry args={[0.35, 0.8, 4]} />
           <meshStandardMaterial color="#ffffff" flatShading />
        </mesh>
      )}
      {isBurning && <group position={[0, 0.5, 0]} scale={0.5}><Fire /></group>}
      {hovered && <Tooltip position={positionData} pnl={pnl} symbol={positionData.symbol} type={positionData.type} />}
    </group>
  );
};

// Static decorative mountain
const BackgroundMountain = () => {
    return (
        <group position={[-12, 0, -12]}>
             <mesh position={[0, 3, 0]} castShadow receiveShadow>
                <coneGeometry args={[6, 8, 5]} />
                <meshStandardMaterial color="#64748b" flatShading />
             </mesh>
             <mesh position={[0, 5, 0]}>
                <coneGeometry args={[2, 3, 5]} />
                <meshStandardMaterial color="#e2e8f0" flatShading />
             </mesh>
        </group>
    )
}

const NPC: React.FC<{ type: 'human' | 'animal', bounds: number }> = ({ type, bounds }) => {
  const ref = useRef<THREE.Group>(null);
  const position = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * bounds, 
    0, 
    (Math.random() - 0.5) * bounds
  ));
  
  const target = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * bounds, 
    0, 
    (Math.random() - 0.5) * bounds
  ));

  const speed = type === 'human' ? 0.02 : 0.04;

  useFrame(() => {
    if (ref.current) {
      const dir = new THREE.Vector3().subVectors(target.current, ref.current.position);
      if (dir.length() < 0.5) {
        target.current.set((Math.random() - 0.5) * bounds, 0, (Math.random() - 0.5) * bounds);
      } else {
        dir.normalize().multiplyScalar(speed);
        ref.current.position.add(dir);
        ref.current.lookAt(target.current);
      }
    }
  });

  return (
    <group ref={ref} position={position.current}>
      {type === 'human' ? (
        <group>
            <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[0.3, 0.6, 0.2]} />
                <meshStandardMaterial color="#3b82f6" />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial color="#fca5a5" />
            </mesh>
        </group>
      ) : (
        <group>
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.3, 0.3, 0.5]} />
                <meshStandardMaterial color="#d97706" />
            </mesh>
             <mesh position={[0, 0.5, 0.2]}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#92400e" />
            </mesh>
        </group>
      )}
    </group>
  );
};

const Floor: React.FC<{ sustainabilityScore: number }> = ({ sustainabilityScore }) => {
  const color = sustainabilityScore > 80 ? '#10b981' : sustainabilityScore > 40 ? '#84cc16' : '#78350f';
  return (
    <group position={[0, -0.5, 0]}>
        <mesh receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[GROUND_SIZE, 1, GROUND_SIZE]} />
            <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -2, 0]}>
             <boxGeometry args={[GROUND_SIZE, 3, GROUND_SIZE]} />
             <meshStandardMaterial color="#451a03" />
        </mesh>
        <gridHelper args={[GROUND_SIZE * 2, 20, 0x1e293b, 0x0f172a]} position={[0, -0.4, 0]} />
    </group>
  );
};

export const Biome: React.FC<BiomeProps> = ({ positions, plantedTrees, sustainabilityScore }) => {
  const npcCount = 6;
  const npcs = useMemo(() => Array.from({ length: npcCount }).map((_, i) => ({
      id: i,
      type: Math.random() > 0.5 ? 'human' : 'animal' as const
  })), [npcCount]);

  // Calculate Weather State based on total unrealized PnL
  const totalPnLPercent = positions.reduce((acc, p) => acc + p.pnlPercent, 0);
  
  let weather: 'clear' | 'rain' | 'storm' = 'clear';
  if (positions.length > 0) {
      if (totalPnLPercent < -20) weather = 'storm';
      else if (totalPnLPercent < -5) weather = 'rain';
  }

  // Lighting logic
  const isStorm = weather === 'storm';
  const bgColors = {
      clear: sustainabilityScore > 60 ? '#0f172a' : '#1a0505',
      rain: '#334155',
      storm: '#0f172a'
  };
  
  const ambientColors = {
      clear: sustainabilityScore > 50 ? '#ffffff' : '#451a03',
      rain: '#94a3b8',
      storm: '#1e293b'
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900">
      <Canvas shadows>
        <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={20} near={-50} far={200} />
        <OrbitControls 
            enableZoom={true} zoomSpeed={0.5} enablePan={true} 
            maxPolarAngle={Math.PI / 2.5} minPolarAngle={Math.PI / 6}
        />
        
        {/* Environment */}
        <color attach="background" args={[bgColors[weather]]} />
        <ambientLight intensity={isStorm ? 0.2 : 0.5} color={ambientColors[weather]} />
        <directionalLight 
            position={[10, 20, 10]} 
            intensity={isStorm ? 0.1 : 1.5} 
            castShadow 
            shadow-mapSize={[1024, 1024]} 
        />
        
        {weather !== 'clear' && <Cloud position={[-10, 10, -10]} opacity={0.5} />}
        {weather !== 'clear' && <Cloud position={[10, 12, 5]} opacity={0.5} />}
        {weather !== 'clear' && <Rain intensity={weather === 'storm' ? 'heavy' : 'light'} />}
        {weather === 'storm' && <Lightning />}

        {/* Scene Content */}
        <group position={[0, -2, 0]}>
            <Floor sustainabilityScore={sustainabilityScore} />
            <BackgroundMountain />
            
            {/* Village Cluster */}
            <House x={5} z={5} rotation={0.4} />
            <House x={8} z={4} rotation={-0.2} />
            <House x={6} z={8} rotation={2.5} />
            
            {/* Legacy Trees (Harvested/Completed Longs) */}
            {plantedTrees.map((tree) => (
                <Tree key={`legacy-${tree.id}`} x={tree.x} z={tree.z} scale={tree.scale} />
            ))}

            {/* Dynamic Positions */}
            {positions.map((pos) => {
                const isBurning = pos.pnlPercent < -20; 
                return pos.type === 'LONG' 
                ? <Tree 
                     key={pos.id} 
                     x={pos.coordinates.x} 
                     z={pos.coordinates.z} 
                     isBurning={isBurning} 
                     positionData={pos}
                  />
                : <Mountain 
                     key={pos.id} 
                     x={pos.coordinates.x} 
                     z={pos.coordinates.z} 
                     isBurning={isBurning} 
                     positionData={pos}
                  />
            })}

            {npcs.map(npc => (
                <NPC key={npc.id} type={npc.type} bounds={GROUND_SIZE - 2} />
            ))}
        </group>
        
        {weather === 'clear' && (
            <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[5, 8, -5]}>
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color="white" opacity={0.6} transparent />
                </mesh>
            </Float>
        )}
      </Canvas>

      {/* Weather UI Overlay */}
      {weather !== 'clear' && (
          <div className="absolute top-20 left-4 pointer-events-none">
             <div className="bg-red-900/80 backdrop-blur-md p-2 rounded-lg border border-red-500/50 flex items-center gap-2 animate-pulse">
                <span className="text-2xl">⛈</span>
                <div className="text-red-200">
                    <div className="text-xs font-bold uppercase">Disaster Warning</div>
                    <div className="text-xs">High Unrealized Losses Detected</div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};
