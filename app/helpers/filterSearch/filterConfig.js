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
      name: "birth_decade",
      label: "Birth Decade",
      type: "select",
      options: [
        { value: "1960s", label: "60s (1960-1969)" },
        { value: "1970s", label: "70s (1970-1979)" },
        { value: "1980s", label: "80s (1980-1989)" },
        { value: "1990s", label: "90s (1990-1999)" },
        { value: "2000s", label: "2000s (2000-2009)" },
        { value: "2010s", label: "2010s (2010-2019)" },
        { value: "2020s", label: "2020s (2020+)" },
      ],
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
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
      ],
    },
  ],
};
