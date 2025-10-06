"use client";
import React, { useState, useMemo } from 'react';
import SectionContainer from '@/app/components/containers/SectionContainer';
import ErrorCode from '@/app/components/ui/ErrorCode';
import ProductCard from '@/app/components/containers/ProductCard';
import FilterBar from '@/app/components/forms/FilterBar';
import PageHeadline from '@/app/components/containers/PageHeadline';
import { AnimatePresence } from 'framer-motion';
import { filterConfigs } from '@/app/helpers/filterSearch/filterConfig';
import Button from '@/app/components/buttons/Button';

const CLUBS_LIMIT = 15;

const Clubs = ({ clubs: initialClubs = [], error }) => {
  const [clubs, setClubs] = useState(initialClubs);
  const [offset, setOffset] = useState(initialClubs.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialClubs.length === CLUBS_LIMIT);
  const [filters, setFilters] = useState({});

  // Dynamically get unique countries and cities from clubs
  const countryOptions = useMemo(() => {
    const set = new Set(clubs.map(c => c.country).filter(Boolean));
    return Array.from(set).sort();
  }, [clubs]);

  const cityOptions = useMemo(() => {
    const filteredClubs = filters.country
      ? clubs.filter(c => c.country === filters.country)
      : clubs;
    const set = new Set(filteredClubs.map(c => c.city).filter(Boolean));
    return Array.from(set).sort();
  }, [clubs, filters.country]);

  // Build filter config with dynamic options
  const dynamicFilterConfig = useMemo(() => {
    return filterConfigs.clubs.map(field => {
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
    if (name === "country") {
      setFilters(prev => ({ ...prev, country: value, city: "" }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Filtering logic
  const filteredClubs = useMemo(() => {
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
    }).sort((a, b) => {
      if (filters.sort === "name") {
        return a.name.localeCompare(b.name);
      }
      if (filters.sort === "capacity_high") {
        return (b.capacity || 0) - (a.capacity || 0);
      }
      if (filters.sort === "capacity_low") {
        return (a.capacity || 0) - (b.capacity || 0);
      }
      if (filters.sort === "most_liked") {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      return 0;
    });
  }, [clubs, filters]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/clubs-page-route?limit=${CLUBS_LIMIT}&offset=${offset}`);
      const data = await res.json();
      const newClubs = data?.data || [];
      setClubs(prev => [...prev, ...newClubs]);
      setOffset(prev => prev + newClubs.length);
      setHasMore(newClubs.length === CLUBS_LIMIT);
    } catch {
      // Handle error
    }
    setLoading(false);
  };

  if (error) {
    return (
      <SectionContainer size="lg" title="Clubs" description="Latest clubs">
        <ErrorCode title="Error loading clubs" description={error} />
      </SectionContainer>
    );
  }

  if (!clubs || clubs.length === 0) {
    return (
      <SectionContainer size="lg" title="Clubs" description="Latest clubs">
        <ErrorCode title="No clubs available" description="Check back later for new clubs." />
      </SectionContainer>
    );
  }

  return (
    <div className="space-y-3 px-4">
      <PageHeadline 
        title="All Clubs" 
        description="Discover the best clubs around the world." 
      />
      <FilterBar
        config={dynamicFilterConfig}
        values={filters}
        onChange={handleFilterChange}
      />
      <div className="grid grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredClubs.map((club, idx) => (
            <ProductCard
              layout
              key={club.id}
              id={club.id}
              image={club.club_image}
              name={club.name}
              country={club.country}
              city={club.city}
              capacity={club.capacity}
              likesCount={club.likesCount}
              href={`/clubs/${club.id}`}
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
            loading={loading}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
};

export default Clubs;