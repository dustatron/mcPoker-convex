import { query } from "./_generated/server";
import { v } from "convex/values";

export const getHistory = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("history")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .order("desc")
      .take(99);
  },
});

export const getLatestRound = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("history")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .order("desc")
      .first();
  },
});

export const getRoundCount = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("history")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    return history.length;
  },
});
