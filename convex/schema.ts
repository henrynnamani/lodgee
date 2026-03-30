// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  listings: defineTable({
    title: v.string(),
    type: v.string(),
    area: v.string(),
    price: v.number(),
    distMin: v.number(),
    distLabel: v.string(),
    distMode: v.string(),
    water: v.optional(v.boolean()),
    elec: v.optional(v.boolean()),
    availability: v.string(),
    daysAgo: v.number(),
    views: v.number(),
    roomsLeftConfirmed: v.optional(v.number()),
    badge: v.optional(v.string()),
    badgeLabel: v.optional(v.string()),
    verified: v.boolean(),
    agentId: v.id("agents"),
    img: v.string(),
    videoUrl: v.optional(v.string()),
    inspectionFee: v.string(),
    status: v.string(),
    breakdown: v.optional(
      v.object({
        rent: v.number(),
        agency: v.number(),
        legal: v.number(),
        caution: v.number(),
      })
    ),
    breakdownConfirmed: v.boolean(),
    notes: v.optional(v.string()),
    size: v.string(),
    furnished: v.string(),
    security: v.string(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_price", ["price"])
    .index("by_views", ["views"])
    .index("by_type", ["type"])
    .index("by_area", ["area"])
    .index("by_availability", ["availability"])
    .index("by_verified", ["verified"]),

  agents: defineTable({
    name: v.string(),
    phone: v.string(),
    listings: v.number(),
    rating: v.string(),
    verified: v.boolean(),
  })
    .index("by_verified", ["verified"]),
});