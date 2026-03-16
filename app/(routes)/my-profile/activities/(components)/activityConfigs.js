/**
 * Central config for all activity tabs.
 * Adding a new tab = add one entry here + a service file.
 * The [tab]/page.js switch handles rendering.
 */
export const ACTIVITY_TAB_CONFIGS = {
  ratings: {
    metadata: {
      title: "My Profile | Ratings",
      description: "Artists you have rated",
    },
  },
  reviews: {
    metadata: {
      title: "My Profile | Reviews",
      description: "Reviews you have written",
    },
  },
  "my-events": {
    metadata: {
      title: "My Profile | Events",
      description: "Events you have submitted",
    },
  },
  reminders: {
    metadata: {
      title: "My Profile | Reminders",
      description: "Events you are tracking",
    },
  },
};

export const VALID_ACTIVITY_TABS = Object.keys(ACTIVITY_TAB_CONFIGS);
