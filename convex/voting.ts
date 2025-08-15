import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const castVote = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.id("participants"),
    value: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    // Check if vote already exists for this participant in this room
    const existingVote = await ctx.db
      .query("votes")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("participantId"), args.participantId),
        ),
      )
      .first();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        value: args.value,
      });
      return existingVote._id;
    } else {
      // Create new vote
      return await ctx.db.insert("votes", {
        roomId: args.roomId,
        participantId: args.participantId,
        value: args.value,
        revealed: false,
      });
    }
  },
});

export const toggleReveal = mutation({
  args: {
    roomId: v.id("rooms"),
    revealed: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Update all votes in the room to revealed/hidden
    const votes = await ctx.db
      .query("votes")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    for (const vote of votes) {
      await ctx.db.patch(vote._id, {
        revealed: args.revealed,
      });
    }

    return { updatedVotes: votes.length };
  },
});

export const resetVotes = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    // Get current votes that are revealed
    const currentVotes = await ctx.db
      .query("votes")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("revealed"), true),
        ),
      )
      .collect();

    // Save to history if there are revealed votes
    if (currentVotes.length > 0) {
      // Get participant names for the votes
      const votesWithNames = [];
      for (const vote of currentVotes) {
        if (vote.value !== null) {
          const participant = await ctx.db.get(vote.participantId);
          if (participant) {
            votesWithNames.push({
              name: participant.name,
              value: vote.value,
            });
          }
        }
      }

      if (votesWithNames.length > 0) {
        // Get the next round number
        const lastHistoryEntry = await ctx.db
          .query("history")
          .filter((q) => q.eq(q.field("roomId"), args.roomId))
          .order("desc")
          .first();

        const roundNumber = lastHistoryEntry
          ? lastHistoryEntry.roundNumber + 1
          : 1;

        // Save to history
        await ctx.db.insert("history", {
          roomId: args.roomId,
          roundNumber,
          votes: votesWithNames,
          createdAt: Date.now(),
        });

        // Keep only last 99 entries
        const allHistory = await ctx.db
          .query("history")
          .filter((q) => q.eq(q.field("roomId"), args.roomId))
          .order("desc")
          .collect();

        if (allHistory.length > 99) {
          const entriesToDelete = allHistory.slice(99);
          for (const entry of entriesToDelete) {
            await ctx.db.delete(entry._id);
          }
        }
      }
    }

    // Delete all current votes
    const allVotes = await ctx.db
      .query("votes")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    for (const vote of allVotes) {
      await ctx.db.delete(vote._id);
    }

    return { clearedVotes: allVotes.length };
  },
});

export const getVotesInRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();
  },
});

export const getVoteStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    const participants = await ctx.db
      .query("participants")
      .filter((q) =>
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("connected"), true),
        ),
      )
      .collect();

    const totalParticipants = participants.length;
    const votedCount = votes.filter((v) => v.value !== null).length;
    const revealed = votes.length > 0 ? votes[0].revealed : false;

    return {
      totalParticipants,
      votedCount,
      revealed,
      allVoted: votedCount === totalParticipants && totalParticipants > 0,
    };
  },
});
