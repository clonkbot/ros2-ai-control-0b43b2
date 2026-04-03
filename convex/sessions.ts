import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrent = query({
  args: { robotId: v.id("robots") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
      .order("desc")
      .first();

    if (!session || session.userId !== userId) return null;
    if (session.status === "stopped") return null;

    return session;
  },
});

export const start = mutation({
  args: {
    robotId: v.id("robots"),
    simulator: v.string(),
    worldFile: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const robot = await ctx.db.get(args.robotId);
    if (!robot || robot.userId !== userId) throw new Error("Not found");

    // End any existing session
    const existingSession = await ctx.db
      .query("sessions")
      .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
      .order("desc")
      .first();

    if (existingSession && existingSession.status !== "stopped") {
      await ctx.db.patch(existingSession._id, {
        status: "stopped",
        endedAt: Date.now(),
      });
    }

    // Update robot status
    await ctx.db.patch(args.robotId, {
      status: "active",
      simulator: args.simulator,
      lastActive: Date.now(),
    });

    return await ctx.db.insert("sessions", {
      userId,
      robotId: args.robotId,
      simulator: args.simulator,
      status: "running",
      startedAt: Date.now(),
      worldFile: args.worldFile,
    });
  },
});

export const pause = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.sessionId, { status: "paused" });
    await ctx.db.patch(session.robotId, { status: "idle" });
  },
});

export const resume = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.sessionId, { status: "running" });
    await ctx.db.patch(session.robotId, { status: "active" });
  },
});

export const stop = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.sessionId, {
      status: "stopped",
      endedAt: Date.now(),
    });
    await ctx.db.patch(session.robotId, { status: "idle" });
  },
});
