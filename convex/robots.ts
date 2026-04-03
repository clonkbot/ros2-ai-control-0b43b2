import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("robots")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("robots") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const robot = await ctx.db.get(args.id);
    if (!robot || robot.userId !== userId) return null;
    return robot;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    simulator: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("robots", {
      name: args.name,
      type: args.type,
      status: "idle",
      simulator: args.simulator,
      userId,
      createdAt: Date.now(),
      lastActive: Date.now(),
      position: { x: 0, y: 0, z: 0 },
      orientation: { roll: 0, pitch: 0, yaw: 0 },
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("robots"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const robot = await ctx.db.get(args.id);
    if (!robot || robot.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      lastActive: Date.now(),
    });
  },
});

export const updatePosition = mutation({
  args: {
    id: v.id("robots"),
    position: v.object({ x: v.number(), y: v.number(), z: v.number() }),
    orientation: v.object({ roll: v.number(), pitch: v.number(), yaw: v.number() }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const robot = await ctx.db.get(args.id);
    if (!robot || robot.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, {
      position: args.position,
      orientation: args.orientation,
      lastActive: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("robots") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const robot = await ctx.db.get(args.id);
    if (!robot || robot.userId !== userId) throw new Error("Not found");

    await ctx.db.delete(args.id);
  },
});
