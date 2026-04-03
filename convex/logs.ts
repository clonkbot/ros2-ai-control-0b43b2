import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    robotId: v.optional(v.id("robots")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.robotId) {
      return await ctx.db
        .query("logs")
        .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
        .order("desc")
        .take(args.limit ?? 100);
    }

    return await ctx.db
      .query("logs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const add = mutation({
  args: {
    robotId: v.optional(v.id("robots")),
    level: v.string(),
    source: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("logs", {
      robotId: args.robotId,
      userId,
      level: args.level,
      source: args.source,
      message: args.message,
      timestamp: Date.now(),
    });
  },
});

export const clear = mutation({
  args: { robotId: v.optional(v.id("robots")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const logs = args.robotId
      ? await ctx.db
          .query("logs")
          .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
          .collect()
      : await ctx.db
          .query("logs")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();

    for (const log of logs) {
      if (log.userId === userId) {
        await ctx.db.delete(log._id);
      }
    }
  },
});
