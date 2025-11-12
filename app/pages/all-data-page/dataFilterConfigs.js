import { formatBirthdate } from '@/app/helpers/utils';

// Filter logic for clubs
export const filterClubs = (clubs, filters) => {
  return clubs.filter(club => {
    if (filters.country && club.country !== filters.country) return false;
    if (filters.city && club.city !== filters.city) return false;
    if (filters.name && !club.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    
    if (filters.capacity) {
      const capacity = club.capacity || 0;
      switch (filters.capacity) {
        case "small":
          if (capacity > 500) return false;
          break;
        case "medium":
          if (capacity <= 500 || capacity > 1500) return false;
          break;
        case "large":
          if (capacity <= 1500 || capacity > 5000) return false;
          break;
        case "massive":
          if (capacity <= 5000) return false;
          break;
      }
    }
    
    return true;
  });
};

// Sort logic for clubs
export const sortClubs = (clubs, sortType) => {
  return [...clubs].sort((a, b) => {
    if (sortType === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortType === "capacity_high") {
      return (b.capacity || 0) - (a.capacity || 0);
    }
    if (sortType === "capacity_low") {
      return (a.capacity || 0) - (b.capacity || 0);
    }
    if (sortType === "most_liked") {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return 0;
  });
};

// Filter logic for events
export const filterEvents = (events, filters) => {
  return events.filter(event => {
    if (filters.country && event.country !== filters.country) return false;
    if (filters.city && event.city !== filters.city) return false;
    if (filters.artist && !event.artists?.some(a => a.toLowerCase().includes(filters.artist.toLowerCase()))) return false;
    if (filters.date && event.date !== filters.date) return false;
    return true;
  });
};

// Sort logic for events
export const sortEvents = (events, sortType) => {
  return [...events].sort((a, b) => {
    if (sortType === "most_interested") {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    if (sortType === "upcoming") {
      return new Date(a.date) - new Date(b.date);
    }
    if (sortType === "latest") {
      return new Date(b.date) - new Date(a.date);
    }
    return 0;
  });
};

// Filter logic for festivals
export const filterFestivals = (festivals, filters) => {
  return festivals.filter(festival => {
    if (filters.country && festival.country !== filters.country) return false;
    if (filters.name && !festival.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    return true;
  });
};

// Sort logic for festivals
export const sortFestivals = (festivals, sortType) => {
  return [...festivals].sort((a, b) => {
    if (sortType === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortType === "most_liked") {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return 0;
  });
};

// Get unique country options
export const getCountryOptions = (data) => {
  const set = new Set(data.map(item => item.country).filter(Boolean));
  return Array.from(set).sort();
};

// Get unique city options
export const getCityOptions = (data, selectedCountry) => {
  const filteredData = selectedCountry
    ? data.filter(item => item.country === selectedCountry)
    : data;
  const set = new Set(filteredData.map(item => item.city).filter(Boolean));
  return Array.from(set).sort();
};

// Map card props based on data type
export const mapCardProps = (item, type, idx) => {
  const baseProps = {
    key: item.id,
    id: item.id,
    name: item.name || item.event_name,
    country: item.country,
    likesCount: item.likesCount,
    delay: idx,
  };

  switch (type) {
    case 'clubs':
      return {
        ...baseProps,
        image: item.club_image,
        city: item.city,
        capacity: item.capacity,
        href: `/clubs/${item.id}`,
      };
    case 'events':
      return {
        ...baseProps,
        image: item.event_image,
        date: formatBirthdate(item.date),
        city: item.city,
        artists: item.artists,
        href: `/events/${item.id}`,
      };
    case 'festivals':
      return {
        ...baseProps,
        image: item.poster,
        href: `/festivals/${item.id}`,
      };
    default:
      return baseProps;
  }
};
