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
};
