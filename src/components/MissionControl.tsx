import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SimulationViewport } from "./SimulationViewport";
import { TelemetryPanel } from "./TelemetryPanel";
import { AICommandSidebar } from "./AICommandSidebar";
import { SystemLogs } from "./SystemLogs";

export function MissionControl() {
  const { signOut } = useAuthActions();
  const robots = useQuery(api.robots.list);
  const createRobot = useMutation(api.robots.create);
  const updateStatus = useMutation(api.robots.updateStatus);

  const [selectedRobotId, setSelectedRobotId] = useState<Id<"robots"> | null>(null);
  const [simulator, setSimulator] = useState<"gazebo" | "webots">("gazebo");
  const [masterStatus, setMasterStatus] = useState<"online" | "offline">("online");
  const [latency, setLatency] = useState(12);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logsExpanded, setLogsExpanded] = useState(true);
  const [mobileView, setMobileView] = useState<"viewport" | "ai" | "logs">("viewport");

  // Simulate latency changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 20) + 8);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Create demo robot if none exist
  useEffect(() => {
    if (robots && robots.length === 0) {
      createRobot({
        name: "Atlas-01",
        type: "arm",
        simulator: "gazebo",
      });
    }
    if (robots && robots.length > 0 && !selectedRobotId) {
      setSelectedRobotId(robots[0]._id);
    }
  }, [robots, createRobot, selectedRobotId]);

  const selectedRobot = robots?.find((r: { _id: Id<"robots"> }) => r._id === selectedRobotId);

  const handleArmRobot = async () => {
    if (!selectedRobotId) return;
    await updateStatus({ id: selectedRobotId, status: selectedRobot?.status === "armed" ? "idle" : "armed" });
  };

  const handleStartSimulation = async () => {
    if (!selectedRobotId) return;
    await updateStatus({ id: selectedRobotId, status: selectedRobot?.status === "active" ? "idle" : "active" });
  };

  return (
    <div className="min-h-screen bg-[#060609] text-white font-mono">
      {/* Top Bar */}
      <header className="h-12 sm:h-14 border-b border-gray-800 bg-[#0a0a10]/90 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-wider hidden sm:block">ROS2-AI CONTROL</span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-700 hidden md:block" />

          {/* Master Status */}
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-800">
            <div className={`w-2 h-2 rounded-full ${masterStatus === "online" ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">ROS2 Master:</span>
            <span className={`text-[10px] sm:text-xs font-bold ${masterStatus === "online" ? "text-green-400" : "text-red-400"}`}>
              {masterStatus.toUpperCase()}
            </span>
          </div>

          {/* Latency */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-800">
            <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span className="text-xs text-gray-400">Latency:</span>
            <span className={`text-xs font-bold ${latency < 15 ? "text-green-400" : latency < 25 ? "text-yellow-400" : "text-red-400"}`}>
              {latency}ms
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Simulator Selector */}
          <div className="flex items-center rounded-lg bg-gray-900/50 border border-gray-800 p-0.5">
            {(["gazebo", "webots"] as const).map((sim) => (
              <button
                key={sim}
                onClick={() => setSimulator(sim)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                  simulator === sim
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {sim.charAt(0).toUpperCase() + sim.slice(1)}
              </button>
            ))}
          </div>

          {/* Mobile view toggle */}
          <div className="flex lg:hidden items-center rounded-lg bg-gray-900/50 border border-gray-800 p-0.5">
            {(["viewport", "ai", "logs"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setMobileView(view)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  mobileView === view
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-gray-400"
                }`}
              >
                {view === "viewport" ? "3D" : view === "ai" ? "AI" : "Log"}
              </button>
            ))}
          </div>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)] flex flex-col lg:flex-row">
        {/* Left Panel - Robot List (Desktop only) */}
        <aside className="hidden lg:block w-56 border-r border-gray-800 bg-[#0a0a10]/50 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Robot Fleet</h2>
            <div className="space-y-2">
              {robots?.map((robot: { _id: Id<"robots">; name: string; type: string; simulator: string; status: string }) => (
                <button
                  key={robot._id}
                  onClick={() => setSelectedRobotId(robot._id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    selectedRobotId === robot._id
                      ? "bg-cyan-500/10 border border-cyan-500/30"
                      : "bg-gray-900/30 border border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      robot.status === "active" ? "bg-green-500/20 text-green-400" :
                      robot.status === "armed" ? "bg-yellow-500/20 text-yellow-400" :
                      robot.status === "error" ? "bg-red-500/20 text-red-400" :
                      "bg-gray-800 text-gray-400"
                    }`}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <circle cx="15.5" cy="8.5" r="1.5" />
                        <path d="M9 15h6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{robot.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{robot.type} · {robot.simulator}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      robot.status === "active" ? "bg-green-400" :
                      robot.status === "armed" ? "bg-yellow-400" :
                      robot.status === "error" ? "bg-red-400" :
                      "bg-gray-600"
                    }`} />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{robot.status}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => createRobot({ name: `Robot-${(robots?.length || 0) + 1}`, type: "mobile", simulator })}
              className="w-full mt-4 p-3 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-xs">Add Robot</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-800">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={handleArmRobot}
                disabled={!selectedRobotId}
                className={`w-full p-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  selectedRobot?.status === "armed"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                {selectedRobot?.status === "armed" ? "Disarm Robot" : "Arm Robot"}
              </button>

              <button
                onClick={handleStartSimulation}
                disabled={!selectedRobotId}
                className={`w-full p-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  selectedRobot?.status === "active"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-green-500/50 hover:text-green-400"
                }`}
              >
                {selectedRobot?.status === "active" ? (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    Stop Simulation
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Viewport Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Viewport - Desktop shows always, mobile shows based on mobileView */}
          <div className={`flex-1 min-h-0 ${mobileView === "viewport" ? "block" : "hidden lg:block"}`}>
            <SimulationViewport
              robotId={selectedRobotId}
              simulator={simulator}
              isActive={selectedRobot?.status === "active"}
            />
          </div>

          {/* Telemetry Bar */}
          <div className={`h-32 sm:h-36 border-t border-gray-800 bg-[#0a0a10]/80 ${mobileView === "viewport" ? "block" : "hidden lg:block"}`}>
            <TelemetryPanel robotId={selectedRobotId} />
          </div>

          {/* Mobile AI View */}
          <div className={`flex-1 ${mobileView === "ai" ? "block" : "hidden"} lg:hidden overflow-hidden`}>
            <AICommandSidebar robotId={selectedRobotId} />
          </div>

          {/* Mobile Logs View */}
          <div className={`flex-1 ${mobileView === "logs" ? "block" : "hidden"} lg:hidden overflow-hidden`}>
            <SystemLogs robotId={selectedRobotId} expanded={true} />
          </div>
        </main>

        {/* AI Sidebar - Desktop only */}
        <aside className={`hidden lg:flex flex-col ${sidebarOpen ? "w-96" : "w-12"} border-l border-gray-800 bg-[#0a0a10]/50 transition-all duration-300`}>
          {sidebarOpen ? (
            <>
              <div className="flex-1 overflow-hidden">
                <AICommandSidebar robotId={selectedRobotId} />
              </div>
              <div className={`${logsExpanded ? "h-64" : "h-10"} border-t border-gray-800 transition-all duration-300`}>
                <SystemLogs
                  robotId={selectedRobotId}
                  expanded={logsExpanded}
                  onToggle={() => setLogsExpanded(!logsExpanded)}
                />
              </div>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full h-full flex items-center justify-center text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
        </aside>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-6 bg-[#060609] border-t border-gray-800/50 flex items-center justify-center z-10">
        <p className="text-gray-600 text-[10px] sm:text-xs">
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}
