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
        helpText: "Upload your profile picture (max 2MB).",
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
      sex: "",
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
      sex: {
        type: "select",
        required: true,
        label: "Sex",
        options: sexOptions,
      },
      birth: {
        ...artistFields.birth,
        label: "Birth Date",
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
        required: true,
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
        fields: ["name", "stage_name", "sex", "birth"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
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

  // Club Form
  addClub: {
    initialData: {
      name: "",
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
        helpText: "Upload a club image (max 2MB).",
      },
      name: {
        type: "text",
        required: true,
        label: "Club Name",
        placeholder: "Enter club name",
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
        fields: ["name", "country", "city"],
        gridClass: "grid grid-cols-1 md:grid-cols-3 gap-4",
      },
      {
        title: "Capacity & Description",
        fields: ["capacity", "address", "description"],
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
        helpText: "Upload an event image (max 2MB).",
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
        helpText: "Upload a news image (max 2MB).",
      },
      title: {
        type: "text",
        required: true,
        label: "Title",
        placeholder: "Enter news title",
      },
      description: {
        type: "textarea",
        required: true,
        label: "Content",
        placeholder: "Enter the main content of the news article",
      },
      content: {
        type: "text",
        required: false,
        label: "Sub-title",
        placeholder: "Enter a sub-title",
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
