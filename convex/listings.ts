import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Add a new listing
export const addListing = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Verify the agent exists
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Agent with id ${args.agentId} not found`);
    }

    // Create the listing
    const listingId = await ctx.db.insert("listings", {
      title: args.title,
      type: args.type,
      area: args.area,
      price: args.price,
      distMin: args.distMin,
      distLabel: args.distLabel,
      distMode: args.distMode,
      water: args.water,
      elec: args.elec,
      availability: args.availability,
      daysAgo: args.daysAgo,
      views: args.views,
      roomsLeftConfirmed: args.roomsLeftConfirmed,
      badge: args.badge,
      badgeLabel: args.badgeLabel,
      verified: args.verified,
      agentId: args.agentId,
      img: args.img,
      videoUrl: args.videoUrl,
      inspectionFee: args.inspectionFee,
      breakdown: args.breakdown,
      breakdownConfirmed: args.breakdownConfirmed,
      notes: args.notes,
      size: args.size,
      furnished: args.furnished,
      security: args.security,
      status: args.status
    });

    // Optionally update the agent's listing count
    await ctx.db.patch(args.agentId, {
      listings: (agent.listings || 0) + 1,
    });

    return listingId;
  },
});

// Define the cursor type
type ListingsCursor = {
  id: Id<"listings">;
  sortValue: number; // For price, views, or _creationTime
};

// Get all listings with optional filters and pagination
export const getListings = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(
      v.object({
        id: v.id("listings"),
        sortValue: v.number(),
      })
    ),
    type: v.optional(v.string()),
    area: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    verified: v.optional(v.boolean()),
    hasWater: v.optional(v.boolean()),
    hasElec: v.optional(v.boolean()),
    availability: v.optional(v.string()),
    agentId: v.optional(v.id("agents")),
    sortBy: v.optional(v.union(v.literal("price"), v.literal("views"), v.literal("daysAgo"))),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const sortBy = args.sortBy || "daysAgo";
    const sortOrder = args.sortOrder || "desc";
    const cursor = args.cursor;

    let listingsQuery;
    let listings;

    // Handle different sorting methods
    if (sortBy === "price") {
      // Use price index for sorting by price
      if (cursor) {
        listingsQuery = ctx.db
          .query("listings")
          .withIndex("by_price", (q) => 
            sortOrder === "asc" 
              ? q.gt("price", cursor.sortValue)
              : q.lt("price", cursor.sortValue)
          );
      } else {
        listingsQuery = ctx.db
          .query("listings")
          .withIndex("by_price")
          .order(sortOrder);
      }
      
      listings = await listingsQuery.take(limit + 1);
      
    } else if (sortBy === "views") {
      // Use views index for sorting by views
      if (cursor) {
        listingsQuery = ctx.db
          .query("listings")
          .withIndex("by_views", (q) =>
            sortOrder === "asc"
              ? q.gt("views", cursor.sortValue)
              : q.lt("views", cursor.sortValue)
          );
      } else {
        listingsQuery = ctx.db
          .query("listings")
          .withIndex("by_views")
          .order(sortOrder);
      }
      
      listings = await listingsQuery.take(limit + 1);
      
    } else {
      // Default sorting by _creationTime
      if (cursor) {
        listingsQuery = ctx.db
          .query("listings")
          .filter((q) =>
            sortOrder === "asc"
              ? q.gt(q.field("_creationTime"), cursor.sortValue)
              : q.lt(q.field("_creationTime"), cursor.sortValue)
          )
          .order(sortOrder);
      } else {
        listingsQuery = ctx.db.query("listings").order(sortOrder);
      }
      
      listings = await listingsQuery.take(limit + 1);
    }

    // Apply filters after initial query
    let filteredListings = listings;
    
    if (args.type) {
      filteredListings = filteredListings.filter((l) => l.type === args.type);
    }
    if (args.area) {
      filteredListings = filteredListings.filter((l) => l.area === args.area);
    }
    if (args.verified !== undefined) {
      filteredListings = filteredListings.filter((l) => l.verified === args.verified);
    }
    if (args.hasWater !== undefined) {
      filteredListings = filteredListings.filter((l) => l.water === args.hasWater);
    }
    if (args.hasElec !== undefined) {
      filteredListings = filteredListings.filter((l) => l.elec === args.hasElec);
    }
    if (args.availability) {
      filteredListings = filteredListings.filter((l) => l.availability === args.availability);
    }
    if (args.agentId) {
      filteredListings = filteredListings.filter((l) => l.agentId === args.agentId);
    }
    if (args.minPrice !== undefined) {
      filteredListings = filteredListings.filter((l) => l.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      filteredListings = filteredListings.filter((l) => l.price <= args.maxPrice!);
    }

    // Handle pagination after filters
    const hasMore = filteredListings.length > limit;
    const items = hasMore ? filteredListings.slice(0, limit) : filteredListings;
    
    // Create next cursor
    let nextCursor: ListingsCursor | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      let sortValue: number;
      
      if (sortBy === "price") {
        sortValue = lastItem.price;
      } else if (sortBy === "views") {
        sortValue = lastItem.views;
      } else {
        sortValue = lastItem._creationTime;
      }
      
      nextCursor = {
        id: lastItem._id,
        sortValue: sortValue,
      };
    }

    // Fetch agent details for each listing
    const listingsWithAgents = await Promise.all(
      items.map(async (listing) => {
        const agent = await ctx.db.get(listing.agentId);
        return {
          ...listing,
          agent: agent || null,
        };
      })
    );

    return {
      listings: listingsWithAgents,
      nextCursor,
      hasMore,
    };
  },
});

// Simplified version without complex filters
export const getListingsSimple = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(
      v.object({
        id: v.id("listings"),
        sortValue: v.number(),
      })
    ),
    type: v.optional(v.string()),
    area: v.optional(v.string()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor;
    
    let listingsQuery = ctx.db.query("listings").order("desc");
    
    if (cursor) {
      listingsQuery = listingsQuery.filter((q) => q.lt(q.field("_creationTime"), cursor.sortValue));
    }
    
    let listings = await listingsQuery.take(limit + 1);
    
    // Apply filters
    if (args.type) {
      listings = listings.filter((l) => l.type === args.type);
    }
    if (args.area) {
      listings = listings.filter((l) => l.area === args.area);
    }
    if (args.verified !== undefined) {
      listings = listings.filter((l) => l.verified === args.verified);
    }
    
    const hasMore = listings.length > limit;
    const items = hasMore ? listings.slice(0, limit) : listings;
    
    let nextCursor = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = {
        id: lastItem._id,
        sortValue: lastItem._creationTime,
      };
    }
    
    return {
      listings: items,
      nextCursor,
      hasMore,
    };
  },
});

// Get a single listing by ID
export const getListingById = query({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      return null;
    }

    const agent = await ctx.db.get(listing.agentId);

    return {
      ...listing,
      agent: agent || null,
    };
  },
});

// Update listing views (increment view count)
export const incrementViews = mutation({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    await ctx.db.patch(args.listingId, {
      views: (listing.views || 0) + 1,
    });

    return listing.views + 1;
  },
});