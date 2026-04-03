import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface TelemetryPanelProps {
  robotId: Id<"robots"> | null;
}

interface TelemetryData {
  linearVelocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  batteryLevel: number;
  cpuUsage: number;
  memoryUsage: number;
  sensors: {
    lidar: boolean;
    imu: boolean;
    camera: boolean;
    gps: boolean;
  };
}

function SparklineChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const max = Math.max(...data, 0.1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{data[data.length - 1]?.toFixed(2) || "0.00"}</span>
      </div>
      <svg className="w-full h-8" viewBox="0 0 100 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          fill={`url(#gradient-${label})`}
          points={`0,40 ${points} 100,40`}
        />
      </svg>
    </div>
  );
}

function SensorIndicator({ name, active, icon }: { name: string; active: boolean; icon: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
      active ? "bg-green-500/10 border border-green-500/30" : "bg-gray-900/50 border border-gray-800"
    }`}>
      <span className="text-sm">{icon}</span>
      <span className={`text-[10px] font-medium ${active ? "text-green-400" : "text-gray-500"}`}>{name}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-400" : "bg-gray-600"}`} />
    </div>
  );
}

export function TelemetryPanel({ robotId }: TelemetryPanelProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    linearVelocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    batteryLevel: 87,
    cpuUsage: 45,
    memoryUsage: 62,
    sensors: { lidar: true, imu: true, camera: true, gps: false },
  });

  const [velocityHistory, setVelocityHistory] = useState<number[]>(Array(20).fill(0));
  const [angularHistory, setAngularHistory] = useState<number[]>(Array(20).fill(0));

  // Simulate real-time telemetry updates
  useEffect(() => {
    if (!robotId) return;

    const interval = setInterval(() => {
      const newLinearX = Math.sin(Date.now() / 1000) * 0.5 + Math.random() * 0.1;
      const newAngularZ = Math.cos(Date.now() / 1200) * 0.3 + Math.random() * 0.05;

      setTelemetry(prev => ({
        ...prev,
        linearVelocity: { x: newLinearX, y: 0, z: Math.random() * 0.1 },
        angularVelocity: { x: 0, y: 0, z: newAngularZ },
        batteryLevel: Math.max(0, prev.batteryLevel - Math.random() * 0.01),
        cpuUsage: 30 + Math.random() * 40,
        memoryUsage: 55 + Math.random() * 20,
      }));

      setVelocityHistory(prev => [...prev.slice(1), newLinearX]);
      setAngularHistory(prev => [...prev.slice(1), newAngularZ]);
    }, 100);

    return () => clearInterval(interval);
  }, [robotId]);

  if (!robotId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        Select a robot to view telemetry
      </div>
    );
  }

  return (
    <div className="h-full p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-6 overflow-x-auto">
      {/* Velocity Charts */}
      <div className="flex gap-3 sm:gap-4 flex-shrink-0 sm:flex-shrink">
        <div className="w-28 sm:w-32">
          <SparklineChart data={velocityHistory} color="#00d4ff" label="Linear Vel" />
        </div>
        <div className="w-28 sm:w-32">
          <SparklineChart data={angularHistory} color="#ff006e" label="Angular Vel" />
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px bg-gray-800" />

      {/* System Stats */}
      <div className="flex gap-3 sm:gap-4 flex-shrink-0">
        {/* Battery */}
        <div className="w-16 sm:w-20">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Battery</div>
          <div className="flex items-end gap-1">
            <span className={`text-lg sm:text-xl font-bold ${
              telemetry.batteryLevel > 50 ? "text-green-400" :
              telemetry.batteryLevel > 20 ? "text-yellow-400" : "text-red-400"
            }`}>
              {telemetry.batteryLevel.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-500 mb-1">%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                telemetry.batteryLevel > 50 ? "bg-green-500" :
                telemetry.batteryLevel > 20 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${telemetry.batteryLevel}%` }}
            />
          </div>
        </div>

        {/* CPU */}
        <div className="w-16 sm:w-20">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">CPU</div>
          <div className="flex items-end gap-1">
            <span className={`text-lg sm:text-xl font-bold ${
              telemetry.cpuUsage < 60 ? "text-cyan-400" :
              telemetry.cpuUsage < 80 ? "text-yellow-400" : "text-red-400"
            }`}>
              {telemetry.cpuUsage.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-500 mb-1">%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                telemetry.cpuUsage < 60 ? "bg-cyan-500" :
                telemetry.cpuUsage < 80 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${telemetry.cpuUsage}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="w-16 sm:w-20">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Memory</div>
          <div className="flex items-end gap-1">
            <span className={`text-lg sm:text-xl font-bold ${
              telemetry.memoryUsage < 70 ? "text-purple-400" :
              telemetry.memoryUsage < 85 ? "text-yellow-400" : "text-red-400"
            }`}>
              {telemetry.memoryUsage.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-500 mb-1">%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                telemetry.memoryUsage < 70 ? "bg-purple-500" :
                telemetry.memoryUsage < 85 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${telemetry.memoryUsage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px bg-gray-800" />

      {/* Sensor Status */}
      <div className="flex-shrink-0">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Sensors</div>
        <div className="flex flex-wrap gap-2">
          <SensorIndicator name="LIDAR" active={telemetry.sensors.lidar} icon="📡" />
          <SensorIndicator name="IMU" active={telemetry.sensors.imu} icon="🧭" />
          <SensorIndicator name="CAM" active={telemetry.sensors.camera} icon="📷" />
          <SensorIndicator name="GPS" active={telemetry.sensors.gps} icon="🛰️" />
        </div>
      </div>

      {/* Pose Display */}
      <div className="hidden lg:block ml-auto flex-shrink-0">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Current Pose</div>
        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <span className="text-gray-500">x:</span>
            <span className="text-red-400 ml-1">0.00</span>
          </div>
          <div>
            <span className="text-gray-500">y:</span>
            <span className="text-green-400 ml-1">0.25</span>
          </div>
          <div>
            <span className="text-gray-500">z:</span>
            <span className="text-blue-400 ml-1">0.00</span>
          </div>
          <div>
            <span className="text-gray-500">R:</span>
            <span className="text-orange-400 ml-1">0.00°</span>
          </div>
          <div>
            <span className="text-gray-500">P:</span>
            <span className="text-yellow-400 ml-1">0.00°</span>
          </div>
          <div>
            <span className="text-gray-500">Y:</span>
            <span className="text-cyan-400 ml-1">0.00°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
