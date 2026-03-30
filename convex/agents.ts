import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const addAgent = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    listings: v.optional(v.number()),
    rating: v.optional(v.string()),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      phone: args.phone,
      listings: args.listings || 0,
      rating: args.rating || "New ⭐",
      verified: args.verified,
    });
    return agentId;
  },
});

export const updateAgent = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    rating: v.optional(v.string()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const existingAgent = await ctx.db.get(id);
    if (!existingAgent) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    await ctx.db.patch(id, updates);
    
    return id;
  },
});

export const getAgents = query({
  args: {
    limit: v.optional(v.number()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    let agentsQuery = ctx.db.query("agents");

    console.log(agentsQuery)

    if (args.verified !== undefined) {
      agentsQuery = agentsQuery.filter((q) => q.eq(q.field("verified"), args.verified));
    }

    const agents = await agentsQuery.take(limit);
    return agents;
  },
});

export const getAgentById = query({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return null;
    }

    const listings = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("agentId"), args.agentId))
      .collect();

    return {
      ...agent,
      listings: listings,
    };
  },
});