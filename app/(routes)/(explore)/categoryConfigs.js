export const CATEGORY_CONFIGS = {
  clubs: {
    // Listing page
    listing: {
      apiEndpoint: (baseUrl) => `${baseUrl}/api/club?limit=30&offset=0`,
      fetchOptions: {
        next: { revalidate: 600, tags: ["clubs"] },
        headers: { "Content-Type": "application/json" },
      },
      extractData: (json) => json?.data || [],
      title: "All Clubs",
      description: "Discover the best clubs around the world.",
    },
    // Single profile page
    profile: {
      apiEndpoint: (baseUrl, id) => `${baseUrl}/api/club/single-club?id=${id}`,
      fetchOptions: { cache: "no-store" },
      extractData: (json) => ({
        data: json.club,
        currentUserId: json.currentUserId ?? null,
      }),
      type: "clubs",
    },
    // SEO metadata
    metadata: {
      list: {
        title: "Soundfolio | Clubs",
        description:
          "Discover and explore various clubs on Soundfolio. Join communities that share your musical interests and connect with like-minded individuals.",
      },
      profile: {
        title: "Soundfolio | Club Profile",
        description:
          "Explore this club on Soundfolio — lineup, events, location, and everything you need to know before you go.",
      },
    },
  },

  events: {
    listing: {
      apiEndpoint: (baseUrl) =>
        `${baseUrl}/api/events/get-upcoming-events?limit=20&offset=0`,
      fetchOptions: {
        next: { revalidate: 300, tags: ["events"] },
        headers: { "Content-Type": "application/json" },
      },
      extractData: (json) => json?.data || [],
      title: "Upcoming events",
      description: "Find the latest events happening near you.",
    },
    profile: {
      apiEndpoint: (baseUrl, id) =>
        `${baseUrl}/api/events/single-event?id=${id}`,
      fetchOptions: (id) => ({
        next: { revalidate: 1200, tags: ["events", `event-${id}`] },
        headers: { "Content-Type": "application/json" },
      }),
      extractData: (json) => {
        if (!json || !json.success) return { data: null, currentUserId: null };
        return { data: json, currentUserId: json.currentUserId ?? null };
      },
      type: "events",
    },
    metadata: {
      list: {
        title: "Soundfolio | Upcoming Events",
        description:
          "Browse upcoming electronic music events on Soundfolio. Find concerts, club nights, and festivals near you.",
      },
      profile: {
        title: "Soundfolio | Event",
        description:
          "View event details on Soundfolio — lineup, venue, date, and tickets.",
      },
    },
  },

  festivals: {
    listing: {
      apiEndpoint: (baseUrl) => `${baseUrl}/api/festivals?limit=20&offset=0`,
      fetchOptions: { next: { revalidate: 600, tags: ["festivals"] } },
      extractData: (json) => {
        if (json.error) throw new Error(json.error);
        return json.data || [];
      },
      title: "All Festivals",
      description: "Discover music festivals from around the world.",
    },
    profile: {
      apiEndpoint: (baseUrl, id) => `${baseUrl}/api/festivals?id=${id}`,
      fetchOptions: {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      },
      extractData: (json) => {
        if (!json.success || !json.festival)
          return { data: null, currentUserId: null };
        return { data: json.festival, currentUserId: json.currentUserId };
      },
      type: "festivals",
    },
    metadata: {
      list: {
        title: "Soundfolio | Festivals",
        description: "Discover music festivals on Soundfolio.",
      },
      profile: {
        title: "Soundfolio | Festival",
        description:
          "Explore this festival on Soundfolio — artists, stages, dates, and everything you need to plan your experience.",
      },
    },
  },
};

export const VALID_CATEGORIES = Object.keys(CATEGORY_CONFIGS);
