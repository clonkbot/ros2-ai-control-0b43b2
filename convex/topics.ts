import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { robotId: v.id("robots") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const robot = await ctx.db.get(args.robotId);
    if (!robot || robot.userId !== userId) return [];

    return await ctx.db
      .query("topics")
      .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
      .collect();
  },
});

export const create = mutation({
  args: {
    robotId: v.id("robots"),
    name: v.string(),
    messageType: v.string(),
    frequency: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const robot = await ctx.db.get(args.robotId);
    if (!robot || robot.userId !== userId) throw new Error("Not found");

    return await ctx.db.insert("topics", {
      robotId: args.robotId,
      name: args.name,
      messageType: args.messageType,
      frequency: args.frequency,
      active: true,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const topic = await ctx.db.get(args.id);
    if (!topic) throw new Error("Not found");

    const robot = await ctx.db.get(topic.robotId);
    if (!robot || robot.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { active: !topic.active });
  },
});

export const updateValue = mutation({
  args: {
    id: v.id("topics"),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const topic = await ctx.db.get(args.id);
    if (!topic) throw new Error("Not found");

    const robot = await ctx.db.get(topic.robotId);
    if (!robot || robot.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { lastValue: args.value });
  },
});
