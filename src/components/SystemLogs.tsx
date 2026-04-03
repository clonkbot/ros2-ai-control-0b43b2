import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface SystemLogsProps {
  robotId: Id<"robots"> | null;
  expanded?: boolean;
  onToggle?: () => void;
}

interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  timestamp: number;
}

export function SystemLogs({ robotId, expanded = true, onToggle }: SystemLogsProps) {
  const logs = useQuery(api.logs.list, robotId ? { robotId, limit: 50 } : { limit: 50 });
  const addLog = useMutation(api.logs.add);
  const clearLogs = useMutation(api.logs.clear);

  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error" | "debug">("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Generate demo logs
  useEffect(() => {
    if (!robotId) return;

    const demoLogs = [
      { level: "info", source: "ros2", message: "[rosout] Node /robot_state_publisher is alive" },
      { level: "info", source: "gazebo", message: "Physics engine initialized: ODE" },
      { level: "debug", source: "ros2", message: "[/cmd_vel] Publishing Twist message" },
      { level: "info", source: "system", message: "Sensor fusion node started" },
      { level: "warn", source: "ros2", message: "[/odom] Frame timestamp drift detected: 5ms" },
      { level: "info", source: "ai", message: "Processing natural language command" },
      { level: "debug", source: "ros2", message: "[/scan] LIDAR data received: 360 points" },
      { level: "info", source: "gazebo", message: "World update rate: 1000 Hz" },
    ];

    const interval = setInterval(() => {
      const randomLog = demoLogs[Math.floor(Math.random() * demoLogs.length)];
      addLog({
        robotId,
        level: randomLog.level,
        source: randomLog.source,
        message: randomLog.message,
      });
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [robotId, addLog]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs?.filter((log: { level: string }) => filter === "all" || log.level === filter) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "info": return "text-cyan-400";
      case "warn": return "text-yellow-400";
      case "error": return "text-red-400";
      case "debug": return "text-gray-500";
      default: return "text-gray-400";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "ros2": return "text-blue-400";
      case "gazebo": return "text-orange-400";
      case "webots": return "text-green-400";
      case "ai": return "text-purple-400";
      case "system": return "text-gray-400";
      default: return "text-gray-500";
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${time}.${ms}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#050508]">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-800 ${onToggle ? "cursor-pointer hover:bg-gray-900/30" : ""}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19h16M4 15h16M4 11h16M4 7h16" />
          </svg>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Logs</span>
          {filteredLogs.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-gray-800 rounded text-gray-500">{filteredLogs.length}</span>
          )}
        </div>

        {onToggle && (
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {expanded && (
        <>
          {/* Filters */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-800/50">
            <div className="flex items-center gap-1">
              {(["all", "info", "warn", "error", "debug"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    filter === level
                      ? "bg-gray-800 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2 py-1 rounded text-[10px] transition-all ${
                  autoScroll ? "text-cyan-400" : "text-gray-500"
                }`}
                title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => robotId && clearLogs({ robotId })}
                className="px-2 py-1 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto font-mono text-[10px] sm:text-xs">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600">
                No logs to display
              </div>
            ) : (
              <div className="p-2">
                {filteredLogs.map((log: { _id: string; timestamp: number; level: string; source: string; message: string }) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-2 py-0.5 hover:bg-gray-900/30 px-1 rounded"
                  >
                    <span className="text-gray-600 whitespace-nowrap">{formatTime(log.timestamp)}</span>
                    <span className={`w-10 sm:w-12 text-center uppercase font-bold ${getLevelColor(log.level)}`}>
                      [{log.level.slice(0, 4)}]
                    </span>
                    <span className={`w-12 sm:w-16 ${getSourceColor(log.source)}`}>
                      {log.source}
                    </span>
                    <span className="text-gray-300 flex-1 break-all">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
