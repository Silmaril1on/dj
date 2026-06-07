// Profile type configurations
export const PROFILE_TYPE_CONFIG = {
  clubs: {
    imageKey: "image_url",
    nameKey: "name",
    hasLineup: true,
    lineupKey: "residents",
    lineupTitle: "Venue Residents",
    hasCapacity: true,
    hasEmail: true,
    emailKey: "venue_email",
    hasActions: true,
    actionType: "club",
    hasOwnerControls: true,
    hasSchedule: true,
    scheduleTitle: "Upcoming Events",
    scheduleDescription: "See all upcoming events at this club",
  },
  events: {
    imageKey: "image_url",
    nameKey: "event_name",
    hasLineup: true,
    lineupKey: "artists",
    lineupTitle: "Lineup",
    hasCapacity: false,
    hasEmail: false,
    hasActions: true,
    actionType: "event",
    hasOwnerControls: true,
    hasSchedule: false,
    hasEventDetails: true,
  },
  festivals: {
    imageKey: "image_url",
    nameKey: "name",
    hasLineup: true,
    lineupKey: "lineup",
    lineupTitle: "Lineup",
    hasCapacity: true,
    hasEmail: false,
    hasActions: true,
    actionType: "festival",
    hasOwnerControls: true,
    hasSchedule: false,
    hasFestivalDetails: true,
  },
};

// Extract common profile data
export const extractProfileData = (data, type) => {
  const config = PROFILE_TYPE_CONFIG[type];
  const edition =
    type === "festivals" ? data.currentEdition || data.edition || null : null;
  const hasFestivalEdition = Boolean(edition?.id);
  const festivalStartDate = hasFestivalEdition
    ? edition.start_date || null
    : data.start_date || null;
  const festivalEndDate = hasFestivalEdition
    ? edition.end_date || null
    : data.end_date || null;
  const festivalEditionId = hasFestivalEdition
    ? edition.id
    : data.edition_id || null;
  const festivalEditionYear =
    edition?.edition_year ?? data.edition_year ?? null;
  const festivalEditionStatus = edition?.status ?? data.edition_status ?? null;

  return {
    id: data.id,
    slug:
      type === "clubs"
        ? data.club_slug
        : type === "festivals"
          ? data.festival_slug
          : null,
    name: data[config.nameKey],
    image: data[config.imageKey],
    description: data.description,
    country: data.country,
    city: data.city,
    address: data.address,
    location_url: data.location_url,
    social_links: data.social_links,
    capacity: config.hasCapacity ? data.capacity : null,
    email: config.hasEmail ? data[config.emailKey] : null,
    lineup: config.hasLineup ? data[config.lineupKey] : null,
    likesCount: data.likesCount || 0,
    userLiked: data.userLiked || false,
    userReminderSet: data.userReminderSet || false,
    userReminderOffsetDays: data.userReminderOffsetDays || null,
    ratingStats: data.ratingStats || data.rating_stats || null,
    userRating: data.userRating || null,
    user_id: data.user_id,
    // Event-specific
    date: type === "events" ? data.date : null,
    doors_open: type === "events" ? data.doors_open : null,
    links: type === "events" ? data.links : null,
    promoter: type === "events" ? data.promoter : null,
    minimum_age: type === "events" ? (data.minimum_age ?? null) : null,
    venue_name: type === "events" ? data.venue_name || null : null,
    event_type: type === "events" ? data.event_type || null : null,
    // Festival-specific
    start_date: type === "festivals" ? festivalStartDate : null,
    end_date: type === "festivals" ? festivalEndDate : null,
    edition_id: type === "festivals" ? festivalEditionId : null,
    edition_year: type === "festivals" ? festivalEditionYear : null,
    edition_status: type === "festivals" ? festivalEditionStatus : null,
    website: type === "festivals" ? data.website : null,
    capacity_total: type === "festivals" ? data.capacity_total : null,
  };
};

// Get add event params for clubs
export const getAddEventParams = (club) => {
  return new URLSearchParams({
    club_id: club.id,
    venue_name: club.name,
    address: club.address,
    location_url: club.location_url || "",
    country: club.country,
    city: club.city,
  }).toString();
};
