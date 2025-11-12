"use client";
import { useState, useMemo } from 'react';
import ErrorCode from '@/app/components/ui/ErrorCode';
import ProductCard from '@/app/components/containers/ProductCard';
import FilterBar from '@/app/components/forms/FilterBar';
import PageHeadline from '@/app/components/containers/PageHeadline';
import Button from '@/app/components/buttons/Button';
import { filterConfigs } from '@/app/helpers/filterSearch/filterConfig';
import {
  filterClubs,
  sortClubs,
  filterEvents,
  sortEvents,
  filterFestivals,
  sortFestivals,
  getCountryOptions,
  getCityOptions,
  mapCardProps,
} from './dataFilterConfigs';

// Configuration for different data types
const DATA_TYPE_CONFIG = {
  clubs: {
    apiEndpoint: '/api/club',
    limit: 15,
    gridCols: 'grid-cols-2 lg:grid-cols-3',
    filterFn: filterClubs,
    sortFn: sortClubs,
    hasCityFilter: true,
  },
  events: {
    apiEndpoint: '/api/events/events-page-route',
    limit: 15,
    gridCols: 'grid-cols-2 lg:grid-cols-4 xl:grid-cols-5',
    filterFn: filterEvents,
    sortFn: sortEvents,
    hasCityFilter: true,
  },
  festivals: {
    apiEndpoint: '/api/festivals/all-festivals',
    limit: 20,
    gridCols: 'grid-cols-2 lg:grid-cols-5',
    filterFn: filterFestivals,
    sortFn: sortFestivals,
    hasCityFilter: false,
  },
};

const AllDataPage = ({
  type = 'clubs', // 'clubs' | 'events' | 'festivals'
  initialData = [],
  error: initialError = null,
  title = '',
  description = '',
}) => {
  const config = DATA_TYPE_CONFIG[type];
  const [data, setData] = useState(initialData);
  const [offset, setOffset] = useState(initialData.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialData.length === config.limit);
  const [filters, setFilters] = useState({});

  // Get unique country options
  const countryOptions = useMemo(() => getCountryOptions(data), [data]);

  // Get unique city options (if applicable)
  const cityOptions = useMemo(() => {
    if (!config.hasCityFilter) return [];
    return getCityOptions(data, filters.country);
  }, [data, filters.country, config.hasCityFilter]);

  // Build filter config with dynamic options
  const dynamicFilterConfig = useMemo(() => {
    return filterConfigs[type].map(field => {
      if (field.name === "country") {
        return { ...field, options: countryOptions };
      }
      if (field.name === "city" && config.hasCityFilter) {
        return { ...field, options: cityOptions };
      }
      return field;
    });
  }, [countryOptions, cityOptions, type, config.hasCityFilter]);

  const handleFilterChange = (name, value) => {
    // Reset city if country changes
    if (name === "country" && config.hasCityFilter) {
      setFilters(prev => ({ ...prev, country: value, city: "" }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Apply filtering and sorting
  const filteredData = useMemo(() => {
    let result = config.filterFn(data, filters);
    if (filters.sort) {
      result = config.sortFn(result, filters.sort);
    }
    return result;
  }, [data, filters, config]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiEndpoint}?limit=${config.limit}&offset=${offset}`);
      const result = await res.json();
      const newData = result?.data || [];
      setData(prev => [...prev, ...newData]);
      setOffset(prev => prev + newData.length);
      setHasMore(newData.length === config.limit);
    } catch (err) {
      console.error('Load more failed:', err);
    }
    setLoading(false);
  };

  if (initialError) {
    return (
      <div className="space-y-3 px-3 lg:px-4 pb-5">
        <PageHeadline title={title} description={description} />
        <ErrorCode title={`Error loading ${type}`} description={initialError} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-3 px-3 lg:px-4 pb-5">
        <PageHeadline title={title} description={description} />
        <ErrorCode 
          title={`No ${type} available`} 
          description={`Check back later for new ${type}.`} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 lg:px-4 pb-5">
      <PageHeadline title={title} description={description} />
      <FilterBar
        config={dynamicFilterConfig}
        values={filters}
        onChange={handleFilterChange}
      />
      <div className={`grid ${config.gridCols} gap-2 lg:gap-4`}>
        {filteredData.map((item, idx) => {
          const { key, ...cardProps } = mapCardProps(item, type, idx);
          return <ProductCard key={key} {...cardProps} />;
        })}
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

export default AllDataPage;
