import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    name: v.string(),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }),
  participants: defineTable({
    roomId: v.id("rooms"),
    name: v.string(),
    connected: v.boolean(),
    lastSeen: v.number(),
  }),
  votes: defineTable({
    roomId: v.id("rooms"),
    participantId: v.id("participants"),
    value: v.union(v.number(), v.null()),
    revealed: v.boolean(),
  }),
  history: defineTable({
    roomId: v.id("rooms"),
    roundNumber: v.number(),
    votes: v.array(
      v.object({
        name: v.string(),
        value: v.number(),
      }),
    ),
    createdAt: v.number(),
  }),
});
