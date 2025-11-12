// Profile type configurations
export const PROFILE_TYPE_CONFIG = {
  clubs: {
    imageKey: 'club_image',
    nameKey: 'name',
    hasLineup: true,
    lineupKey: 'residents',
    lineupTitle: 'Venue Residents',
    hasCapacity: true,
    hasEmail: true,
    emailKey: 'venue_email',
    hasActions: true,
    actionType: 'club',
    hasOwnerControls: true,
    hasSchedule: true,
    scheduleTitle: 'Upcoming Events',
    scheduleDescription: 'See all upcoming events at this club',
  },
  events: {
    imageKey: 'event_image',
    nameKey: 'event_name',
    hasLineup: true,
    lineupKey: 'artists',
    lineupTitle: 'Lineup',
    hasCapacity: false,
    hasEmail: false,
    hasActions: true,
    actionType: 'event',
    hasOwnerControls: false,
    hasSchedule: false,
    hasEventDetails: true,
  },
  festivals: {
    imageKey: 'poster',
    nameKey: 'name',
    hasLineup: true,
    lineupKey: 'lineup',
    lineupTitle: 'Lineup',
    hasCapacity: true,
    hasEmail: false,
    hasActions: true,
    actionType: 'festival',
    hasOwnerControls: true,
    hasSchedule: false,
    hasFestivalDetails: true,
  },
};

// Extract common profile data
export const extractProfileData = (data, type) => {
  const config = PROFILE_TYPE_CONFIG[type];
  
  return {
    id: data.id,
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
    user_id: data.user_id,
    // Event-specific
    date: type === 'events' ? data.date : null,
    doors_open: type === 'events' ? data.doors_open : null,
    links: type === 'events' ? data.links : null,
    promoter: type === 'events' ? data.promoter : null,
    // Festival-specific
    start_date: type === 'festivals' ? data.start_date : null,
    end_date: type === 'festivals' ? data.end_date : null,
    website: type === 'festivals' ? data.website : null,
    capacity_total: type === 'festivals' ? data.capacity_total : null,
    capacity_per_day: type === 'festivals' ? data.capacity_per_day : null,
    location: type === 'festivals' ? data.location : null,
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
