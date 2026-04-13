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
      name: "genres",
      label: "Genre",
      type: "select",
      options: [],
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
