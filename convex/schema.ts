import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Robot fleet management
  robots: defineTable({
    name: v.string(),
    type: v.string(), // "arm", "mobile", "drone", "humanoid"
    status: v.string(), // "idle", "active", "armed", "error", "offline"
    simulator: v.string(), // "gazebo", "webots", "real"
    userId: v.id("users"),
    createdAt: v.number(),
    lastActive: v.number(),
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
    orientation: v.object({
      roll: v.number(),
      pitch: v.number(),
      yaw: v.number(),
    }),
  }).index("by_user", ["userId"]),

  // ROS2 topics
  topics: defineTable({
    robotId: v.id("robots"),
    name: v.string(),
    messageType: v.string(),
    frequency: v.number(),
    active: v.boolean(),
    lastValue: v.optional(v.string()),
  }).index("by_robot", ["robotId"]),

  // Telemetry data
  telemetry: defineTable({
    robotId: v.id("robots"),
    timestamp: v.number(),
    linearVelocity: v.object({ x: v.number(), y: v.number(), z: v.number() }),
    angularVelocity: v.object({ x: v.number(), y: v.number(), z: v.number() }),
    batteryLevel: v.number(),
    cpuUsage: v.number(),
    memoryUsage: v.number(),
    sensors: v.object({
      lidar: v.boolean(),
      imu: v.boolean(),
      camera: v.boolean(),
      gps: v.boolean(),
    }),
  }).index("by_robot", ["robotId"]).index("by_timestamp", ["timestamp"]),

  // AI command history
  commands: defineTable({
    userId: v.id("users"),
    robotId: v.optional(v.id("robots")),
    message: v.string(),
    response: v.string(),
    codeSnippet: v.optional(v.string()),
    codeType: v.optional(v.string()), // "yaml", "python", "bash"
    executed: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_robot", ["robotId"]),

  // System logs
  logs: defineTable({
    robotId: v.optional(v.id("robots")),
    userId: v.id("users"),
    level: v.string(), // "info", "warn", "error", "debug"
    source: v.string(), // "ros2", "gazebo", "webots", "ai", "system"
    message: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]).index("by_robot", ["robotId"]).index("by_timestamp", ["timestamp"]),

  // Simulation sessions
  sessions: defineTable({
    userId: v.id("users"),
    robotId: v.id("robots"),
    simulator: v.string(),
    status: v.string(), // "running", "paused", "stopped"
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    worldFile: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_robot", ["robotId"]),
});
