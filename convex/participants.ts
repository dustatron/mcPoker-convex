import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if participant already exists in room with same name
    const existingParticipant = await ctx.db
      .query("participants")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("name"), args.name),
        ),
      )
      .first();

    if (existingParticipant) {
      // Update existing participant to connected
      await ctx.db.patch(existingParticipant._id, {
        connected: true,
        lastSeen: Date.now(),
      });
      return existingParticipant._id;
    } else {
      // Create new participant
      return await ctx.db.insert("participants", {
        roomId: args.roomId,
        name: args.name,
        connected: true,
        lastSeen: Date.now(),
      });
    }
  },
});

export const renameParticipant = mutation({
  args: {
    participantId: v.id("participants"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participantId, {
      name: args.newName,
      lastSeen: Date.now(),
    });
  },
});

export const setParticipantConnectionStatus = mutation({
  args: {
    participantId: v.id("participants"),
    connected: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participantId, {
      connected: args.connected,
      lastSeen: Date.now(),
    });
  },
});

export const getParticipantsInRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();
  },
});

export const getParticipant = query({
  args: { participantId: v.id("participants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.participantId);
  },
});

export const updateParticipantHeartbeat = mutation({
  args: { participantId: v.id("participants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participantId, {
      lastSeen: Date.now(),
    });
  },
});

export const disconnectInactiveParticipants = mutation({
  args: { timeoutMinutes: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const timeoutMs = (args.timeoutMinutes || 5) * 60 * 1000; // Default 5 minutes
    const cutoffTime = Date.now() - timeoutMs;

    const inactiveParticipants = await ctx.db
      .query("participants")
      .filter((q) =>
        q.and(
          q.eq(q.field("connected"), true),
          q.lt(q.field("lastSeen"), cutoffTime),
        ),
      )
      .collect();

    for (const participant of inactiveParticipants) {
      await ctx.db.patch(participant._id, {
        connected: false,
      });
    }

    return { disconnectedCount: inactiveParticipants.length };
  },
});

export const leaveRoom = mutation({
  args: { participantId: v.id("participants") },
  handler: async (ctx, args) => {
    // Get participant info before deletion
    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    // Delete all votes by this participant
    const participantVotes = await ctx.db
      .query("votes")
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .collect();

    for (const vote of participantVotes) {
      await ctx.db.delete(vote._id);
    }

    // Delete the participant
    await ctx.db.delete(args.participantId);

    return {
      deletedParticipant: participant.name,
      deletedVotes: participantVotes.length,
    };
  },
});
