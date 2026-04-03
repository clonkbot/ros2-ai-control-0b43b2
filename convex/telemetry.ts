import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getLatest = query({
  args: { robotId: v.id("robots") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const robot = await ctx.db.get(args.robotId);
    if (!robot || robot.userId !== userId) return null;

    const telemetry = await ctx.db
      .query("telemetry")
      .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
      .order("desc")
      .first();

    return telemetry;
  },
});

export const getHistory = query({
  args: {
    robotId: v.id("robots"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const robot = await ctx.db.get(args.robotId);
    if (!robot || robot.userId !== userId) return [];

    const telemetry = await ctx.db
      .query("telemetry")
      .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
      .order("desc")
      .take(args.limit ?? 50);

    return telemetry.reverse();
  },
});

export const record = mutation({
  args: {
    robotId: v.id("robots"),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const robot = await ctx.db.get(args.robotId);
    if (!robot || robot.userId !== userId) throw new Error("Not found");

    return await ctx.db.insert("telemetry", {
      robotId: args.robotId,
      timestamp: Date.now(),
      linearVelocity: args.linearVelocity,
      angularVelocity: args.angularVelocity,
      batteryLevel: args.batteryLevel,
      cpuUsage: args.cpuUsage,
      memoryUsage: args.memoryUsage,
      sensors: args.sensors,
    });
  },
});
