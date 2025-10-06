"use client";
import SectionContainer from '@/app/components/containers/SectionContainer'
import ErrorCode from '@/app/components/ui/ErrorCode'
import ProductCard from '@/app/components/containers/ProductCard'
import FilterBar from '@/app/components/forms/FilterBar'
import { formatBirthdate } from '@/app/helpers/utils'
import { useState, useMemo } from 'react'
import { filterConfigs } from '@/app/helpers/filterSearch/filterConfig'
import { AnimatePresence } from 'framer-motion'
import PageHeadline from '@/app/components/containers/PageHeadline';
import Button from '@/app/components/buttons/Button';

const EVENTS_LIMIT = 15;

const AllEventsPage = ({ events: initialEvents = [], error }) => {
  const [events, setEvents] = useState(initialEvents);
  const [offset, setOffset] = useState(initialEvents.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialEvents.length === EVENTS_LIMIT);
  const [filters, setFilters] = useState({});

  // Dynamically get unique countries and cities from events
  const countryOptions = useMemo(() => {
    const set = new Set(events.map(e => e.country).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const cityOptions = useMemo(() => {
    // If a country is selected, only show cities from that country
    const filteredEvents = filters.country
      ? events.filter(e => e.country === filters.country)
      : events;
    const set = new Set(filteredEvents.map(e => e.city).filter(Boolean));
    return Array.from(set).sort();
  }, [events, filters.country]);

  // Build filter config with dynamic options
  const dynamicFilterConfig = useMemo(() => {
    return filterConfigs.events.map(field => {
      if (field.name === "country") {
        return { ...field, options: countryOptions };
      }
      if (field.name === "city") {
        return { ...field, options: cityOptions };
      }
      return field;
    });
  }, [countryOptions, cityOptions]);

  const handleFilterChange = (name, value) => {
    // Reset city if country changes
    if (name === "country") {
      setFilters(prev => ({ ...prev, country: value, city: "" }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Filtering logic
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.country && event.country !== filters.country) return false;
      if (filters.city && event.city !== filters.city) return false;
      if (filters.artist && !event.artists?.some(a => a.toLowerCase().includes(filters.artist.toLowerCase()))) return false;
      if (filters.date && event.date !== filters.date) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sort === "most_interested") {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (filters.sort === "upcoming") {
        return new Date(a.date) - new Date(b.date);
      }
      if (filters.sort === "latest") {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });
  }, [events, filters]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/events-page-route?limit=${EVENTS_LIMIT}&offset=${offset}`);
      const data = await res.json();
      const newEvents = data?.data || [];
      setEvents(prev => [...prev, ...newEvents]);
      setOffset(prev => prev + newEvents.length);
      setHasMore(newEvents.length === EVENTS_LIMIT);
    } catch {
      // Optionally handle error
    }
    setLoading(false);
  };

  if (error) {
    return (
      <SectionContainer size="lg" title="Events" description="Latest events">
        <ErrorCode title="Error loading events" description={error} />
      </SectionContainer>
    )
  }

  if (!events || events.length === 0) {
    return (
      <SectionContainer size="lg" title="Events" description="Latest events">
        <ErrorCode title="No events available" description="Check back later for new events." />
      </SectionContainer>
    )
  }

  return (
    <div className='space-y-3 px-4'>
      <PageHeadline title="Upcomming events" description="Find the latest events happening near you." />
      <FilterBar
        config={dynamicFilterConfig}
        values={filters}
        onChange={handleFilterChange}
      />
      <div className="grid grid-cols-5 gap-4">
        <AnimatePresence>
          {filteredEvents.map((event, idx) => (
            <ProductCard
              layout
              key={event.id}
              id={event.id}
              image={event.event_image}
              name={event.event_name}
              date={formatBirthdate(event.date)}
              country={event.country}
              city={event.city}
              artists={event.artists}
              likesCount={event.likesCount}
              href={`/events/${event.id}`}
              delay={idx * 0.05}
            />
          ))}
        </AnimatePresence>
      </div>
      {hasMore && (
        <div className="flex justify-center my-4">
          <Button
            text={loading ? "Loading..." : "Load More"}
            onClick={loadMore}
            disabled={loading}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default AllEventsPage