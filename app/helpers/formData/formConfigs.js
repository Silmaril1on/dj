import { commonFields, artistFields } from "./formFields";
import { countries } from "./countries";
import { sexOptions, userSexOptions } from "./sexOptions";

export const formConfigs = {
  // Authentication Forms
  signIn: {
    initialData: {
      email: "",
      password: "",
    },
    fields: {
      email: {
        ...commonFields.email,
        label: "Email",
      },
      password: {
        ...commonFields.password,
        label: "Password",
      },
    },
    sections: [
      {
        fields: ["email", "password"],
      },
    ],
  },

  signUp: {
    initialData: {
      email: "",
      password: "",
      confirmPassword: "",
      userName: "",
    },
    fields: {
      email: {
        ...commonFields.email,
        label: "Email",
      },
      userName: {
        ...commonFields.userName,
        label: "Username",
      },
      password: {
        ...commonFields.password,
        label: "Password",
      },
      confirmPassword: {
        ...commonFields.confirmPassword,
        label: "Confirm Password",
      },
    },
    sections: [
      {
        fields: ["email", "userName", "password", "confirmPassword"],
      },
    ],
  },

  // User Profile Form
  userProfile: {
    initialData: {
      userName: "",
      first_name: "",
      last_name: "",
      birth_date: "",
      sex: "",
      address: "",
      country: "",
      city: "",
      state: "",
      zip_code: "",
    },
    imageField: "user_avatar",
    fields: {
      user_avatar: {
        type: "image",
        required: false,
        label: "Profile Picture",
        helpText: "Upload your profile picture (max 1MB).",
      },
      userName: {
        ...commonFields.userName,
        label: "Username",
        required: false,
      },
      first_name: {
        ...commonFields.firstName,
        label: "First Name",
      },
      last_name: {
        ...commonFields.lastName,
        label: "Last Name",
      },
      birth_date: {
        ...commonFields.birthDate,
        label: "Birth Date",
      },
      sex: {
        type: "select",
        required: false,
        label: "Sex",
        options: userSexOptions,
      },
      address: {
        ...commonFields.address,
        label: "Address",
      },
      country: {
        type: "text",
        required: false,
        label: "Country",
        placeholder: "Country",
      },
      state: {
        ...commonFields.state,
        label: "State/Province",
      },
      city: {
        ...commonFields.city,
        label: "City",
      },
      zip_code: {
        ...commonFields.zipCode,
        label: "ZIP/Postal Code",
      },
    },
    sections: [
      {
        title: "Profile Picture",
        fields: ["user_avatar"],
        gridClass: "space-y-4",
      },
      {
        title: "Account Information",
        fields: ["userName"],
        gridClass: "grid grid-cols-1 gap-6",
      },
      {
        title: "Personal Information",
        fields: ["first_name", "last_name", "birth_date", "sex"],
        gridClass: "grid grid-cols-1 lg:grid-cols-4 gap-6",
      },
      {
        title: "Address Information",
        fields: ["address", "country", "state", "city", "zip_code"],
        gridClass: "grid grid-cols-1 lg:grid-cols-4 gap-6",
      },
    ],
  },

  // Artist Form
  addArtist: {
    initialData: {
      name: "",
      stage_name: "",
      artist_slug: "",
      sex: "",
      is_band: "false",
      desc: "",
      country: "",
      city: "",
      label: [""],
      bio: "",
      birth: "",
      genres: [""],
      social_links: [""],
    },
    imageField: "artist_image",
    arrayFields: ["genres", "social_links", "label"],
    fields: {
      artist_image: {
        ...artistFields.artist_image,
      },
      name: {
        ...artistFields.name,
        label: "Full Name",
      },
      stage_name: {
        ...artistFields.stageName,
        label: "Stage Name",
      },
      artist_slug: {
        ...artistFields.artistSlug,
        label: "Artist Slug",
      },
      sex: {
        type: "select",
        required: true,
        label: "Sex",
        options: sexOptions,
      },
      is_band: {
        type: "select",
        required: false,
        label: "Is Band/Group",
        options: [
          { value: "false", label: "No (Individual Artist)" },
          { value: "true", label: "Yes (Band/Group)" },
        ],
      },
      birth: {
        ...artistFields.birth,
        label: "Birth Date / Year",
        required: false,
        helpText: "Enter year only (e.g., 1990) or full date (YYYY-MM-DD)",
      },

      desc: {
        ...artistFields.desc,
        label: "Description",
      },
      bio: {
        ...artistFields.bio,
        label: "Bio",
      },
      country: {
        type: "select",
        required: true,
        label: "Country",
        options: countries,
        searchable: true,
        showFlags: true,
      },
      city: {
        ...artistFields.city,
        label: "City",
        required: false,
      },
      label: {
        ...artistFields.label,
        label: "Labels",
      },
      genres: {
        ...artistFields.genres,
        label: "Genres",
        required: true,
      },
      social_links: {
        ...artistFields.socialLinks,
        label: "Social Links",
        required: true,
      },
    },
    sections: [
      {
        title: "Artist Image",
        fields: ["artist_image"],
        gridClass: "space-y-4",
      },
      {
        title: "Basic Information",
        fields: ["name", "stage_name"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Artist Details",
        fields: ["sex", "is_band", "birth", "artist_slug"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
      },
      {
        title: "Location & Details",
        fields: ["country", "city"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Description & Bio",
        fields: ["desc", "bio"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Additional Information",
        fields: ["genres", "social_links", "label"],
        gridClass: "grid grid-cols-1 md:grid-cols-3 gap-4",
      },
    ],
  },

  // Artist Album Form
  addArtistAlbum: {
    initialData: {
      name: "",
      release_date: "",
      description: "",
      tracklist: [""],
    },
    imageField: "album_image",
    arrayFields: ["tracklist"],
    fields: {
      album_image: {
        type: "image",
        required: true,
        label: "Album Cover",
        helpText: "Upload album cover image (max 1MB).",
      },
      name: {
        type: "text",
        required: true,
        label: "Album Name",
        placeholder: "Enter album name",
      },
      release_date: {
        type: "date",
        required: true,
        label: "Release Date",
      },
      description: {
        type: "textarea",
        required: false,
        label: "Description",
        placeholder: "Describe your album...",
        rows: 4,
      },
      tracklist: {
        type: "additional",
        required: true,
        label: "Tracklist",
        placeholder: "Enter track name",
        minFields: 1,
      },
    },
    sections: [
      {
        title: "Album Cover",
        fields: ["album_image"],
        gridClass: "space-y-4",
      },
      {
        title: "Album Information",
        fields: ["name", "release_date"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Description",
        fields: ["description"],
        gridClass: "space-y-4",
      },
      {
        title: "Tracklist",
        fields: ["tracklist"],
        gridClass: "space-y-4",
      },
    ],
  },

  // Club Form
  addClub: {
    initialData: {
      name: "",
      club_slug: "",
      country: "",
      city: "",
      capacity: "",
      address: "",
      description: "",
      social_links: [""],
      residents: [""],
      location_url: "",
      venue_email: "",
    },
    imageField: "club_image",
    arrayFields: ["social_links", "residents"],
    fields: {
      club_image: {
        type: "image",
        required: true,
        label: "Club Image",
        helpText: "Upload a club image (max 1MB).",
      },
      name: {
        type: "text",
        required: true,
        label: "Club Name",
        placeholder: "Enter club name",
      },
      club_slug: {
        type: "text",
        required: true,
        label: "Club Slug",
        placeholder: "e.g. fabric-london",
      },
      address: {
        type: "text",
        required: true,
        label: "Address",
        placeholder: "Enter club address",
      },
      country: {
        type: "select",
        required: true,
        label: "Country",
        options: countries,
        searchable: true,
        showFlags: true,
      },
      city: {
        type: "text",
        required: true,
        label: "City",
        placeholder: "Enter city name",
      },
      capacity: {
        type: "text",
        required: true,
        label: "Capacity",
        placeholder: "Enter club capacity (e.g., 500, 1000+)",
      },
      description: {
        type: "textarea",
        required: true,
        label: "Description",
        placeholder:
          "Describe the club, its atmosphere, and what makes it special",
      },
      social_links: {
        type: "additional",
        required: false,
        label: "Social Links",
        placeholder:
          "Enter social media URL (e.g., https://instagram.com/clubname)",
      },
      residents: {
        type: "additional",
        required: false,
        label: "Residents",
        placeholder: "Enter resident DJ name",
      },
      location_url: {
        type: "text",
        required: false,
        label: "Location URL",
        placeholder: "https://maps.google.com/...",
      },
      venue_email: {
        type: "email",
        required: false,
        label: "Venue Email",
        placeholder: "Enter venue email",
      },
    },
    sections: [
      {
        title: "Club Image",
        fields: ["club_image"],
        gridClass: "space-y-4",
      },
      {
        title: "Basic Information",
        fields: ["name", "club_slug"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Location",
        fields: ["country", "city", "address"],
        gridClass: "grid grid-cols-1 md:grid-cols-3 gap-4",
      },
      {
        title: "Capacity & Description",
        fields: ["capacity", "description"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Social Media",
        fields: ["social_links", "residents", "location_url", "venue_email"],
        gridClass: "space-y-4 grid md:grid-cols-2 gap-4",
      },
    ],
  },

  // Event Form
  addEvent: {
    initialData: {
      venue_name: "",
      event_name: "",
      event_type: "",
      country: "",
      city: "",
      address: "",
      location_url: "",
      artists: [""],
      promoter: "",
      date: "",
      doors_open: "",
      event_image: "",
      description: "",
      links: "",
    },
    imageField: "event_image",
    arrayFields: ["artists"],
    fields: {
      event_name: {
        type: "text",
        required: true,
        label: "Event Name",
        placeholder: "Enter event name",
      },
      venue_name: {
        type: "text",
        required: true,
        label: "Venue name",
        placeholder: "Enter Venue name",
      },
      event_type: {
        type: "text",
        required: true,
        label: "Event Type",
        placeholder: "e.g., Concert, Festival, Club Night",
      },
      event_image: {
        type: "image",
        required: false,
        label: "Event Image",
        helpText: "Upload an event image (max 1MB).",
      },
      country: {
        type: "select",
        required: true,
        label: "Country",
        options: countries,
        searchable: true,
        showFlags: true,
      },
      city: {
        type: "text",
        required: true,
        label: "City",
        placeholder: "Enter city name",
      },
      address: {
        type: "text",
        required: false,
        label: "Address",
        placeholder: "Enter full address (optional)",
      },
      location_url: {
        type: "url",
        required: false,
        label: "Location URL",
        placeholder: "https://maps.google.com/...",
      },
      artists: {
        type: "additional",
        required: true,
        label: "Artists",
        placeholder: "Enter artist name",
      },
      promoter: {
        type: "text",
        required: true,
        label: "Promoter",
        placeholder: "Enter promoter name",
      },
      date: {
        type: "date",
        required: true,
        label: "Event Date",
      },
      doors_open: {
        type: "text",
        required: false,
        label: "Doors Open",
        placeholder: "e.g., 10:00 PM",
      },
      description: {
        type: "textarea",
        required: false,
        label: "Description",
        placeholder: "Describe the event, lineup, and what to expect",
      },
      links: {
        type: "text",
        required: false,
        label: "Event Links",
        placeholder: "Enter event links (comma separated)",
      },
    },
    sections: [
      {
        title: "Event Image",
        fields: ["event_image"],
        gridClass: "space-y-4",
      },
      {
        title: "Event Information",
        fields: ["event_name", "event_type", "venue_name"],
        gridClass: "grid grid-cols-1 md:grid-cols-3 gap-4",
      },
      {
        title: "Location Information",
        fields: ["country", "city", "address", "location_url"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Event Details",
        fields: ["artists", "promoter", "date", "doors_open"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Additional Information",
        fields: ["description", "links"],
        gridClass: "grid grid-cols-1 gap-4",
      },
    ],
  },

  // News Form
  addNews: {
    initialData: {
      title: "",
      content: "",
      description: "",
      news_image: "",
      link: "",
    },
    imageField: "news_image",
    fields: {
      news_image: {
        type: "image",
        required: true,
        label: "News Image",
        helpText: "Upload a news image (max 1MB).",
      },
      title: {
        type: "text",
        required: true,
        label: "Title",
        placeholder: "Enter news title",
      },
      description: {
        type: "text",
        required: false,
        label: "Sub-title",
        placeholder: "Enter a sub-title",
      },
      content: {
        type: "textarea",
        required: true,
        label: "Content",
        placeholder: "Enter the main content of the news article",
      },
      link: {
        type: "text",
        required: false,
        label: "External Link",
        placeholder: "https://...",
      },
    },
    sections: [
      {
        title: "News Image",
        fields: ["news_image"],
        gridClass: "space-y-4",
      },
      {
        title: "News Details",
        fields: ["title", "link", "content", "description"],
        gridClass: "grid grid-cols-2 gap-4",
      },
    ],
  },

  // Password Reset Forms
  resetPassword: {
    initialData: { email: "" },
    fields: {
      email: {
        type: "email",
        required: true,
        label: "Email",
        placeholder: "Enter your email",
        icon: "email",
      },
    },
    sections: [
      {
        title: "Reset Password",
        fields: ["email"],
        gridClass: "",
      },
    ],
  },
  updatePassword: {
    initialData: { password: "", confirmPassword: "" },
    fields: {
      password: {
        type: "password",
        required: true,
        label: "New Password",
        placeholder: "Enter your new password",
        icon: "lock",
      },
      confirmPassword: {
        type: "password",
        required: true,
        label: "Confirm Password",
        placeholder: "Confirm your new password",
        icon: "lock",
      },
    },
    sections: [
      {
        title: "Set New Password",
        fields: ["password", "confirmPassword"],
        gridClass: "",
      },
    ],
  },

  // Book DJ Form
  bookDj: {
    initialData: {
      event_name: "",
      venue_name: "",
      event_date: "",
      country: "",
      address: "",
      location_url: "",
      city: "",
      time: "",
      lineup: "",
    },
    fields: {
      event_name: {
        type: "text",
        required: true,
        label: "Event Name",
        placeholder: "Enter event name",
      },
      venue_name: {
        type: "text",
        required: true,
        label: "Venue Name",
        placeholder: "Enter venue name",
      },
      address: {
        type: "text",
        required: false,
        label: "Address",
        placeholder: "Enter full address (optional)",
      },
      location_url: {
        type: "url",
        required: false,
        label: "Location URL",
        placeholder: "Enter location URL (optional)",
      },
      event_date: {
        type: "date",
        required: true,
        label: "Event Date",
      },
      country: {
        type: "select",
        required: true,
        label: "Country",
        options: countries,
        searchable: true,
        showFlags: true,
      },
      city: {
        type: "text",
        required: true,
        label: "City",
        placeholder: "Enter city name",
      },
      time: {
        type: "text",
        required: false,
        label: "Event Time",
        placeholder: "e.g., 10:00 PM - 3:00 AM",
      },
      lineup: {
        type: "textarea",
        required: false,
        label: "Lineup Details",
        placeholder: "Describe the event lineup, other artists, etc.",
      },
    },
    sections: [
      {
        title: "Event Information",
        fields: ["event_name", "venue_name", "event_date", "time"],
        gridClass: "grid grid-cols-2 md:grid-cols-4 gap-4",
      },
      {
        title: "Location",
        fields: ["country", "city", "address", "location_url"],
        gridClass: "grid grid-cols-2 md:grid-cols-4 gap-4",
      },
      {
        title: "Additional Details",
        fields: ["lineup"],
        gridClass: "grid grid-cols-1 gap-4",
      },
    ],
  },

  // Festival Form
  addFestival: {
    initialData: {
      name: "",
      festival_slug: "",
      description: "",
      bio: "",
      start_date: "",
      end_date: "",
      location_url: "",
      address: "",
      capacity_total: "",
      capacity_per_day: "",
      country: "",
      city: "",
      minimum_age: "",
      festival_genre: [""],
      social_links: [""],
    },
    imageField: "poster",
    arrayFields: ["social_links", "festival_genre"],
    fields: {
      poster: {
        type: "image",
        required: true,
        label: "Festival Poster",
        helpText: "Upload festival poster image (max 5MB).",
      },
      name: {
        type: "text",
        required: true,
        label: "Festival Name",
        placeholder: "Enter festival name",
      },
      festival_slug: {
        type: "text",
        required: true,
        label: "Festival Slug",
        placeholder: "e.g. tomorrowland-2026",
      },
      description: {
        type: "textarea",
        required: false,
        label: "Description",
        placeholder: "Brief description of the festival",
        rows: 3,
      },
      bio: {
        type: "textarea",
        required: false,
        label: "Story",
        placeholder: "Detailed information about the festival and its origins",
        rows: 5,
      },
      start_date: {
        type: "date",
        required: false,
        label: "Start Date",
      },
      end_date: {
        type: "date",
        required: false,
        label: "End Date",
      },
      location_url: {
        type: "text",
        required: false,
        label: "Location URL",
        placeholder: "Festival venue/location URL",
      },
      address: {
        type: "text",
        required: false,
        label: "Address",
        placeholder: "Street address",
      },
      capacity_total: {
        type: "text",
        required: false,
        label: "Total Capacity",
        placeholder: "e.g., 50000, 100000+",
      },
      capacity_per_day: {
        type: "text",
        required: false,
        label: "Capacity Per Day",
        placeholder: "e.g., 20000, 30000",
      },
      country: {
        type: "select",
        required: false,
        label: "Country",
        options: countries,
        searchable: true,
        showFlags: true,
      },
      city: {
        type: "text",
        required: false,
        label: "City",
        placeholder: "Enter city name",
      },
      map_image_url: {
        type: "image",
        required: false,
        label: "Venue Map",
        helpText: "Upload venue map image (max 5MB). MD and LG sizes only.",
      },
      minimum_age: {
        type: "text",
        required: false,
        label: "Minimum Age",
        placeholder: "e.g. 18",
      },
      festival_genre: {
        type: "additional",
        required: false,
        label: "Festival Genres",
        placeholder: "e.g. Techno, House, Trance",
      },
      social_links: {
        type: "additional",
        required: false,
        label: "Social Links",
        placeholder:
          "Enter social media URL (e.g., https://facebook.com/festivalname)",
      },
    },
    sections: [
      {
        title: "Images",
        fields: ["poster", "map_image_url"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Basic Information",
        fields: ["name", "festival_slug"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Description",
        fields: ["description"],
        gridClass: "space-y-4",
      },
      {
        title: "Event Details",
        fields: ["start_date", "end_date", "location_url", "minimum_age"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
      },
      {
        title: "Capacity",
        fields: ["capacity_total", "capacity_per_day"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        title: "Location",
        fields: ["country", "city", "address"],
        gridClass: "grid grid-cols-1 md:grid-cols-3 gap-4",
      },
      {
        title: "Bio",
        fields: ["bio"],
        gridClass: "space-y-4",
      },
      {
        title: "Social Media & Genres",
        fields: ["social_links", "festival_genre"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
    ],
  },
};

// Helper function to create custom form configurations
export const createFormConfig = (baseConfig, overrides = {}) => {
  return {
    ...baseConfig,
    ...overrides,
    fields: {
      ...baseConfig.fields,
      ...overrides.fields,
    },
    sections: overrides.sections || baseConfig.sections,
  };
};

// Helper function to add validation to form config
export const addValidation = (formConfig, validationRules) => {
  const newConfig = { ...formConfig };

  Object.keys(validationRules).forEach((fieldName) => {
    if (newConfig.fields[fieldName]) {
      newConfig.fields[fieldName] = {
        ...newConfig.fields[fieldName],
        validation: validationRules[fieldName],
      };
    }
  });

  return newConfig;
};
