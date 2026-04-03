import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, PerspectiveCamera, Html, Float } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Id } from "../../convex/_generated/dataModel";

interface SimulationViewportProps {
  robotId: Id<"robots"> | null;
  simulator: "gazebo" | "webots";
  isActive?: boolean;
}

function RobotModel({ isActive }: { isActive: boolean }) {
  const bodyRef = useRef<THREE.Group>(null);
  const wheel1Ref = useRef<THREE.Mesh>(null);
  const wheel2Ref = useRef<THREE.Mesh>(null);
  const wheel3Ref = useRef<THREE.Mesh>(null);
  const wheel4Ref = useRef<THREE.Mesh>(null);
  const sensorRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (bodyRef.current && isActive) {
      // Gentle floating motion when active
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02 + 0.25;
    }

    // Rotate wheels when active
    if (isActive) {
      const wheelSpeed = 2;
      [wheel1Ref, wheel2Ref, wheel3Ref, wheel4Ref].forEach(ref => {
        if (ref.current) {
          ref.current.rotation.x += wheelSpeed * 0.016;
        }
      });
    }

    // Rotating LIDAR sensor
    if (sensorRef.current) {
      sensorRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group ref={bodyRef} position={[0, 0.25, 0]}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.2, 0.5]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Top platform */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.4]} />
        <meshStandardMaterial color="#16213e" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* LIDAR mount */}
      <group position={[0, 0.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
          <meshStandardMaterial color="#0f0f1a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh ref={sensorRef} position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
          <meshStandardMaterial
            color={isActive ? "#00d4ff" : "#333"}
            emissive={isActive ? "#00d4ff" : "#000"}
            emissiveIntensity={isActive ? 0.5 : 0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* LIDAR beam visualization */}
        {isActive && (
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.5, 0.02, 32, 1, true]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {/* Wheels */}
      {[
        { pos: [0.35, -0.1, 0.25], ref: wheel1Ref },
        { pos: [-0.35, -0.1, 0.25], ref: wheel2Ref },
        { pos: [0.35, -0.1, -0.25], ref: wheel3Ref },
        { pos: [-0.35, -0.1, -0.25], ref: wheel4Ref },
      ].map((wheel, i) => (
        <mesh
          key={i}
          ref={wheel.ref as React.RefObject<THREE.Mesh>}
          position={wheel.pos as [number, number, number]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.8} />
        </mesh>
      ))}

      {/* Camera sensor */}
      <group position={[0.4, 0.1, 0]}>
        <mesh>
          <boxGeometry args={[0.05, 0.08, 0.12]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial
            color={isActive ? "#ff006e" : "#333"}
            emissive={isActive ? "#ff006e" : "#000"}
            emissiveIntensity={isActive ? 0.3 : 0}
          />
        </mesh>
      </group>

      {/* Status LEDs */}
      <mesh position={[-0.4, 0.05, 0.2]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color={isActive ? "#00ff88" : "#ff3333"}
          emissive={isActive ? "#00ff88" : "#ff3333"}
          emissiveIntensity={1}
        />
      </mesh>
      <mesh position={[-0.4, 0.05, -0.2]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color={isActive ? "#00ff88" : "#ff3333"}
          emissive={isActive ? "#00ff88" : "#ff3333"}
          emissiveIntensity={1}
        />
      </mesh>

      {/* Info label */}
      <Html position={[0, 0.6, 0]} center>
        <div className="px-2 py-1 bg-black/80 rounded text-[10px] font-mono text-cyan-400 whitespace-nowrap border border-cyan-500/30">
          Atlas-01 {isActive ? "● ACTIVE" : "○ IDLE"}
        </div>
      </Html>
    </group>
  );
}

function Obstacles() {
  return (
    <>
      {/* Walls */}
      <mesh position={[2, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.5, 2]} />
        <meshStandardMaterial color="#2a2a4a" />
      </mesh>
      <mesh position={[-2, 0.25, 1]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.5, 1.5]} />
        <meshStandardMaterial color="#2a2a4a" />
      </mesh>

      {/* Cones/markers */}
      {[
        [1.5, 0, 1.5],
        [-1.5, 0, -1],
        [0.5, 0, -1.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#ff6b35" : "#00d4ff"} />
        </mesh>
      ))}

      {/* Target waypoint */}
      <Float speed={2} floatIntensity={0.5}>
        <mesh position={[1, 0.5, -1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.03, 8, 32]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.5} />
        </mesh>
      </Float>
    </>
  );
}

function SimulationScene({ simulator, isActive }: { simulator: string; isActive: boolean }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 3, 3]} fov={50} />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-3, 3, -3]} intensity={0.3} color="#00d4ff" />
      <pointLight position={[3, 3, 3]} intensity={0.2} color="#ff006e" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#0a0a12" />
      </mesh>

      {/* Grid */}
      <Grid
        args={[10, 10]}
        position={[0, 0.01, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a1a30"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#00d4ff"
        fadeDistance={15}
        fadeStrength={1}
        infiniteGrid
      />

      <RobotModel isActive={isActive} />
      <Obstacles />

      <Environment preset={simulator === "gazebo" ? "warehouse" : "night"} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

export function SimulationViewport({ robotId, simulator, isActive = false }: SimulationViewportProps) {
  return (
    <div className="relative w-full h-full bg-[#050508]">
      {/* Viewport overlay info */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 flex flex-col gap-2">
        <div className="px-2 sm:px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-gray-800 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${simulator === "gazebo" ? "bg-orange-500" : "bg-green-500"}`} />
          <span className="text-[10px] sm:text-xs font-mono text-gray-300 uppercase">{simulator} Simulation</span>
        </div>
        {isActive && (
          <div className="px-2 sm:px-3 py-1.5 bg-green-500/10 backdrop-blur-sm rounded-lg border border-green-500/30 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono text-green-400">SIMULATION RUNNING</span>
          </div>
        )}
      </div>

      {/* Viewport controls hint */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-10 px-2 sm:px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg border border-gray-800">
        <span className="text-[10px] sm:text-xs font-mono text-gray-500">
          <span className="hidden sm:inline">Drag to rotate · Scroll to zoom · </span>Touch/click to interact
        </span>
      </div>

      {/* Coordinate display */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 px-2 sm:px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg border border-gray-800">
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono">
          <span className="text-red-400">X: 0.00</span>
          <span className="text-green-400">Y: 0.25</span>
          <span className="text-blue-400">Z: 0.00</span>
        </div>
      </div>

      <Canvas shadows>
        <Suspense fallback={null}>
          <SimulationScene simulator={simulator} isActive={isActive} />
        </Suspense>
      </Canvas>

      {!robotId && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <circle cx="15.5" cy="8.5" r="1.5" />
              <path d="M9 15h6" />
            </svg>
            <p className="text-gray-500 text-sm">Select a robot to view simulation</p>
          </div>
        </div>
      )}
    </div>
  );
}
