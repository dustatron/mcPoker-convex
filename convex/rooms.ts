import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const renameRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if room exists
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Update room name
    await ctx.db.patch(args.roomId, {
      name: args.newName,
    });

    return { success: true };
  },
});

export const createRoom = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("rooms", {
      name: args.name,
      createdAt: now,
      lastActiveAt: now,
    });
  },
});

export const getRoom = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateRoomActivity = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      lastActiveAt: Date.now(),
    });
  },
});

export const cleanupInactiveRooms = mutation({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Find inactive rooms
    const inactiveRooms = await ctx.db
      .query("rooms")
      .filter((q) => q.lt(q.field("lastActiveAt"), twentyFourHoursAgo))
      .collect();

    // Clean up each inactive room
    for (const room of inactiveRooms) {
      // Delete all participants in the room
      const participants = await ctx.db
        .query("participants")
        .filter((q) => q.eq(q.field("roomId"), room._id))
        .collect();

      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }

      // Delete all votes in the room
      const votes = await ctx.db
        .query("votes")
        .filter((q) => q.eq(q.field("roomId"), room._id))
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }

      // Delete all history in the room
      const history = await ctx.db
        .query("history")
        .filter((q) => q.eq(q.field("roomId"), room._id))
        .collect();

      for (const entry of history) {
        await ctx.db.delete(entry._id);
      }

      // Delete the room itself
      await ctx.db.delete(room._id);
    }

    return { cleanedRooms: inactiveRooms.length };
  },
});
