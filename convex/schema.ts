import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    favoriteColor: v.string(),
  }).index("tokenIdentifier", ["tokenIdentifier"]),
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
  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
    author: v.string(),
  }),
});
