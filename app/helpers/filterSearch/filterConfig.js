export const filterConfigs = {
  events: [
    {
      name: "country",
      label: "Country",
      type: "select",
      options: [], // Fill dynamically or statically
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
};
