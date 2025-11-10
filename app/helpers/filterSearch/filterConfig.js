export const filterConfigs = {
  events: [
    {
      name: "country",
      label: "Country",
      type: "select",
      options: [],
    },
    {
      name: "city",
      label: "City",
      type: "select",
      options: [],
    },
    {
      name: "artist",
      label: "Artist",
      type: "text",
      placeholder: "Search by artist name",
    },
    {
      name: "sort",
      label: "Sort By",
      type: "select",
      options: [
        { value: "most_interested", label: "Most Interested" },
        { value: "upcoming", label: "Upcoming" },
        { value: "latest", label: "Latest" },
      ],
    },
  ],
  clubs: [
    {
      name: "country",
      label: "Country",
      type: "select",
      options: [],
    },
    {
      name: "city",
      label: "City",
      type: "select",
      options: [],
    },
    {
      name: "name",
      label: "Club Name",
      type: "text",
      placeholder: "Search by club name",
    },
    {
      name: "capacity",
      label: "Capacity",
      type: "select",
      options: [
        { value: "small", label: "Small (0-500)" },
        { value: "medium", label: "Medium (500-1500)" },
        { value: "large", label: "Large (1500-5000)" },
        { value: "massive", label: "Massive (5000+)" },
      ],
    },
    {
      name: "sort",
      label: "Sort By",
      type: "select",
      options: [
        { value: "name", label: "Name A-Z" },
        { value: "capacity_high", label: "Capacity High-Low" },
        { value: "capacity_low", label: "Capacity Low-High" },
        { value: "most_liked", label: "Most Liked" },
      ],
    },
  ],
  artists: [
    {
      name: "country",
      label: "Country",
      type: "select",
      options: [],
    },
    {
      name: "sex",
      label: "Gender",
      type: "select",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ],
    },
        {
      name: "name",
      label: "Artist Name",
      type: "text",
      placeholder: "Search by artist name",
    },
    {
      name: "genres",
      label: "Genre",
      type: "select",
      options: [],
    },
    {
      name: "rating_range",
      label: "Rating Range",
      type: "select",
      options: [
        { value: "high", label: "High (8.0-10.0)" },
        { value: "medium", label: "Medium (6.0-7.9)" },
        { value: "low", label: "Low (0-5.9)" },
      ],
    },
    {
      name: "sort",
      label: "Sort By",
      type: "select",
      options: [
        { value: "name", label: "Name A-Z" },
        { value: "rating_high", label: "Rating High-Low" },
        { value: "rating_low", label: "Rating Low-High" },
        { value: "most_liked", label: "Most Liked" },
      ],
    },
  ],
  festivals: [
    {
      name: "country",
      label: "Country",
      type: "select",
      options: [],
    },
    {
      name: "name",
      label: "Festival Name",
      type: "text",
      placeholder: "Search by festival name",
    },
    {
      name: "sort",
      label: "Sort By",
      type: "select",
      options: [
        { value: "name", label: "Name A-Z" },
        { value: "date_asc", label: "Date (Earliest First)" },
        { value: "date_desc", label: "Date (Latest First)" },
        { value: "most_liked", label: "Most Liked" },
        { value: "newest", label: "Newest Added" },
        { value: "oldest", label: "Oldest Added" },
      ],
    },
  ],
};
