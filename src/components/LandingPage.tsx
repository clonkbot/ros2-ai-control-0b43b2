import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Environment, Stars, Text3D, Center } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function RobotArm({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const joint1Ref = useRef<THREE.Mesh>(null);
  const joint2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
    if (joint1Ref.current) {
      joint1Ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.4 - 0.5;
    }
    if (joint2Ref.current) {
      joint2Ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.7 + 1) * 0.3 + 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.3, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* First segment */}
      <group position={[0, 0.3, 0]}>
        <mesh ref={joint1Ref}>
          <group position={[0, 0.5, 0]}>
            <mesh>
              <boxGeometry args={[0.15, 1, 0.15]} />
              <meshStandardMaterial color="#16213e" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Joint */}
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#00d4ff" metalness={0.9} roughness={0.1} emissive="#00d4ff" emissiveIntensity={0.5} />
            </mesh>
            {/* Second segment */}
            <group position={[0, 0.5, 0]}>
              <mesh ref={joint2Ref}>
                <group position={[0.4, 0, 0]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[0.12, 0.8, 0.12]} />
                    <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.3} />
                  </mesh>
                  {/* End effector */}
                  <mesh position={[0.45, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <coneGeometry args={[0.1, 0.2, 8]} />
                    <meshStandardMaterial color="#ff006e" metalness={0.9} roughness={0.1} emissive="#ff006e" emissiveIntensity={0.3} />
                  </mesh>
                </group>
              </mesh>
            </group>
          </group>
        </mesh>
      </group>

      {/* Status lights */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.4, 0.1, Math.sin(i * Math.PI / 2) * 0.4]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#00ff88" : "#00d4ff"}
            emissive={i % 2 === 0 ? "#00ff88" : "#00d4ff"}
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function GridFloor() {
  return (
    <group position={[0, -1, 0]}>
      <gridHelper args={[20, 40, "#00d4ff", "#0a1628"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#050510" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function FloatingNodes() {
  const nodes = [
    { pos: [-3, 1, -2] as [number, number, number], color: "#00d4ff", label: "/cmd_vel" },
    { pos: [3, 0.5, -1] as [number, number, number], color: "#ff006e", label: "/sensor/lidar" },
    { pos: [-2, 2, 1] as [number, number, number], color: "#00ff88", label: "/odom" },
    { pos: [2.5, 1.5, 2] as [number, number, number], color: "#ffd700", label: "/tf" },
  ];

  return (
    <>
      {nodes.map((node, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <group position={node.pos}>
            <mesh>
              <octahedronGeometry args={[0.15]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={0.8}
                transparent
                opacity={0.8}
              />
            </mesh>
          </group>
        </Float>
      ))}
    </>
  );
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff006e" />
      <spotLight position={[0, 10, 0]} intensity={1} angle={0.3} penumbra={1} color="#ffffff" />

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <RobotArm position={[0, 0, 0]} />
      </Float>

      <FloatingNodes />
      <GridFloor />

      <Environment preset="night" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}

interface LandingPageProps {
  onLaunch: () => void;
  isAuthenticated: boolean;
}

export function LandingPage({ onLaunch, isAuthenticated }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-900/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-900/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.05),transparent_70%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <span className="font-mono text-base sm:text-lg font-bold tracking-wider">ROS2-AI CONTROL</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#features" className="px-3 py-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors">Features</a>
            <a href="#tech" className="px-3 py-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors hidden sm:block">Tech Stack</a>
            <button
              onClick={onLaunch}
              className="px-3 sm:px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all"
            >
              {isAuthenticated ? "Open Console" : "Sign In"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 sm:mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-mono text-cyan-400">ROS2 HUMBLE COMPATIBLE</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                  Bridge the Gap
                </span>
                <span className="block text-white/90">Between Simulation</span>
                <span className="block text-white/90">and Reality</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Command your robots with natural language. Seamlessly integrate with Gazebo and Webots simulations.
                Deploy AI-powered autonomy in real-time.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <button
                  onClick={onLaunch}
                  className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-base sm:text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Launch Mission Control
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-700 rounded-xl font-medium text-gray-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all">
                  View Documentation
                </button>
              </div>
            </div>

            {/* Right: 3D Scene */}
            <div className="h-[300px] sm:h-[400px] lg:h-[500px] order-1 lg:order-2">
              <Canvas camera={{ position: [5, 3, 5], fov: 45 }}>
                <Suspense fallback={null}>
                  <Scene3D />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Powered By Industry Standards</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">Native integration with the most trusted robotics frameworks</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "ROS2",
                desc: "Robot Operating System",
                color: "from-blue-500 to-cyan-500",
                icon: (
                  <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="24" r="8" fill="currentColor" />
                    <circle cx="24" cy="8" r="4" fill="currentColor" />
                    <circle cx="24" cy="40" r="4" fill="currentColor" />
                    <circle cx="8" cy="24" r="4" fill="currentColor" />
                    <circle cx="40" cy="24" r="4" fill="currentColor" />
                  </svg>
                )
              },
              {
                name: "Gazebo",
                desc: "Physics Simulation",
                color: "from-orange-500 to-red-500",
                icon: (
                  <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 48 48" fill="none">
                    <path d="M24 4L4 14v20l20 10 20-10V14L24 4z" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 14l20 10 20-10M24 24v20" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )
              },
              {
                name: "Webots",
                desc: "Robot Simulator",
                color: "from-green-500 to-emerald-500",
                icon: (
                  <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M24 16v-8M24 40v-8M16 24H8M40 24h-8" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )
              },
            ].map((tech, i) => (
              <div
                key={i}
                className="group p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 hover:border-cyan-500/30 transition-all hover:translate-y-[-4px]"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${tech.color} p-3 sm:p-3.5 mb-4 text-white`}>
                  {tech.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{tech.name}</h3>
                <p className="text-gray-400 text-sm">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                Mission Control Features
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
              Everything you need to command, monitor, and deploy autonomous robots
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: "AI Command Interface",
                desc: "Natural language control with real-time code generation for ROS2 nodes",
                icon: "🧠",
                gradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                title: "Real-Time Telemetry",
                desc: "Live sensor data, velocity graphs, and system diagnostics",
                icon: "📊",
                gradient: "from-cyan-500/20 to-blue-500/20"
              },
              {
                title: "Node Graph Visualization",
                desc: "Interactive ROS2 topic and node relationship mapping",
                icon: "🔗",
                gradient: "from-green-500/20 to-emerald-500/20"
              },
              {
                title: "Simulation Control",
                desc: "Start, pause, and configure Gazebo/Webots simulations",
                icon: "🎮",
                gradient: "from-orange-500/20 to-red-500/20"
              },
              {
                title: "Code Execution",
                desc: "Execute generated YAML configs and Python scripts directly",
                icon: "⚡",
                gradient: "from-yellow-500/20 to-amber-500/20"
              },
              {
                title: "Digital Twin",
                desc: "Mirror real robot state in simulation for testing and validation",
                icon: "👥",
                gradient: "from-indigo-500/20 to-violet-500/20"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group p-5 sm:p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-gray-800 hover:border-gray-600 transition-all duration-300`}
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-6 sm:p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Ready to Take Control?</h2>
            <p className="text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base">
              Join engineers worldwide who are bridging simulation and reality with AI-powered robotics control.
            </p>
            <button
              onClick={onLaunch}
              className="group px-8 sm:px-10 py-3 sm:py-4 bg-white text-gray-900 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                Launch Mission Control
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </div>
            <span className="font-mono text-sm font-bold">ROS2-AI CONTROL</span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm text-center">
            Requested by @web-user · Built by @clonkbot
          </p>
        </div>
      </footer>
    </div>
  );
}
