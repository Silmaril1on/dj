"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import ErrorCode from "@/app/components/ui/ErrorCode";
import ProductCard from "@/app/components/containers/ProductCard";
import FilterBar from "@/app/components/forms/FilterBar";
import Button from "@/app/components/buttons/Button";
import { filterConfigs } from "@/app/helpers/filterSearch/filterConfig";
import usePagination from "@/app/lib/hooks/usePagination";
import Spinner from "@/app/components/ui/Spinner";
import { normalizeCountriesInData } from "@/app/helpers/countryUtils";
import {
  filterArtists,
  filterClubs,
  filterEvents,
  filterFestivals,
  getCityOptions,
  getCountryOptions,
  getGenreOptions,
  mapCardProps,
  sortArtists,
  sortClubs,
  sortEvents,
  sortFestivals,
} from "@/app/helpers/dataFilterConfigs";

// Configuration for different data types
const DATA_TYPE_CONFIG = {
  clubs: {
    apiEndpoint: "/api/club",
    limit: 30,
    gridCols: "grid-cols-2 lg:grid-cols-4",
    filterFn: filterClubs,
    sortFn: sortClubs,
    hasCityFilter: true,
  },
  artists: {
    apiEndpoint: "/api/artists/get-all-artists",
    limit: 30,
    gridCols: "grid-cols-2 lg:grid-cols-5",
    filterFn: filterArtists,
    sortFn: sortArtists,
    hasCityFilter: false,
  },
  events: {
    apiEndpoint: "/api/events/get-all-events",
    limit: 20,
    gridCols: "grid-cols-2 lg:grid-cols-4 xl:grid-cols-5",
    filterFn: filterEvents,
    sortFn: sortEvents,
    hasCityFilter: true,
  },
  festivals: {
    apiEndpoint: "/api/festivals/all-festivals",
    limit: 20,
    gridCols: "grid-cols-2 lg:grid-cols-5",
    filterFn: filterFestivals,
    sortFn: sortFestivals,
    hasCityFilter: false,
  },
};

const ProductsPage = ({
  type = "clubs", // 'clubs' | 'artists' | 'events' | 'festivals'
  initialData = [],
  error: initialError = null,
  title = "",
  description = "",
}) => {
  const config = DATA_TYPE_CONFIG[type] || DATA_TYPE_CONFIG.clubs;
  const safeType = DATA_TYPE_CONFIG[type] ? type : "clubs";
  const [filters, setFilters] = useState({});
  const [fetchingFiltered, setFetchingFiltered] = useState(false);
  const prevServerFiltersRef = useRef("");

  // Build query params from filters (server-side only)
  const buildQueryParams = (currentFilters, limit, offset) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("offset", offset);

    // Add server-side filters based on type
    if (currentFilters.country)
      params.append("country", currentFilters.country);
    if (currentFilters.city) params.append("city", currentFilters.city);
    if (currentFilters.sex) params.append("sex", currentFilters.sex);
    if (currentFilters.genres) params.append("genres", currentFilters.genres);
    if (currentFilters.rating_range)
      params.append("rating_range", currentFilters.rating_range);
    if (currentFilters.capacity)
      params.append("capacity", currentFilters.capacity);
    if (currentFilters.date) params.append("date", currentFilters.date);

    return params.toString();
  };

  const { data, loading, hasMore, loadMore, reset } = usePagination({
    initialData: normalizeCountriesInData(initialData),
    limit: config.limit,
    initialHasMore: initialData.length === config.limit,
    fetchPage: async ({ limit, offset }) => {
      const queryString = buildQueryParams(filters, limit, offset);
      const res = await fetch(`${config.apiEndpoint}?${queryString}`, {
        cache: "no-store",
      });
      const result = await res.json();
      const rawData = result?.data || [];
      return { data: normalizeCountriesInData(rawData) };
    },
    onError: (err) => {
      console.error("Load more failed:", err);
    },
  });

  // Server-side filters (exclude sort which is client-side)
  const serverFilters = useMemo(() => {
    const { sort, ...rest } = filters;
    return rest;
  }, [filters]);

  // Build unique key for server filters to detect changes
  const serverFiltersKey = useMemo(
    () => JSON.stringify(serverFilters),
    [serverFilters],
  );

  // Get unique country options
  const countryOptions = useMemo(() => getCountryOptions(data), [data]);

  // Get unique genre options (artists)
  const genreOptions = useMemo(() => getGenreOptions(data), [data]);

  // Get unique city options (if applicable)
  const cityOptions = useMemo(() => {
    if (!config.hasCityFilter) return [];
    return getCityOptions(data, filters.country);
  }, [data, filters.country, config.hasCityFilter]);

  // Build filter config with dynamic options
  const dynamicFilterConfig = useMemo(() => {
    return (filterConfigs[safeType] || []).map((field) => {
      if (field.name === "country") {
        return { ...field, options: countryOptions };
      }
      if (field.name === "genres" && safeType === "artists") {
        return { ...field, options: genreOptions };
      }
      if (field.name === "city" && config.hasCityFilter) {
        return { ...field, options: cityOptions };
      }
      return field;
    });
  }, [countryOptions, cityOptions, genreOptions, type, config.hasCityFilter]);

  const handleFilterChange = (name, value) => {
    // Reset city if country changes
    if (name === "country" && config.hasCityFilter) {
      setFilters((prev) => ({ ...prev, country: value, city: "" }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Fetch filtered data from server when server-side filters change
  useEffect(() => {
    const fetchFilteredData = async () => {
      // Skip if this is the initial load or filters haven't changed
      if (prevServerFiltersRef.current === serverFiltersKey) return;

      // Skip if no server filters and it's not a reset
      if (serverFiltersKey === "{}" && prevServerFiltersRef.current === "")
        return;

      prevServerFiltersRef.current = serverFiltersKey;
      setFetchingFiltered(true);

      try {
        const queryString = buildQueryParams(filters, config.limit, 0);
        const res = await fetch(`${config.apiEndpoint}?${queryString}`, {
          cache: "no-store",
        });
        const result = await res.json();
        const rawData = result?.data || [];
        const normalizedData = normalizeCountriesInData(rawData);

        // Reset pagination with new filtered data
        await reset(normalizedData);
      } catch (err) {
        console.error("Filter fetch failed:", err);
      } finally {
        setFetchingFiltered(false);
      }
    };

    fetchFilteredData();
  }, [serverFiltersKey, config.apiEndpoint, config.limit, filters, reset]);

  // Apply client-side sorting
  const displayedData = useMemo(() => {
    let result = [...data];

    // Apply sorting
    if (filters.sort) {
      result = config.sortFn(result, filters.sort);
    }

    return result;
  }, [data, filters.sort, config]);

  if (initialError) {
    return (
      <div className="space-y-3 px-3 lg:px-4 pb-5">
        <div className="lg:px-4 py-2 lg:py-10 bg-stone-950">
          <h1 className="text-2xl lg:text-5xl font-bold">{title}</h1>
          <p className="secondary text-[10px] md:text-sm text-cream ">
            {description}
          </p>
        </div>
        <ErrorCode title={`Error loading ${type}`} description={initialError} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-3 px-3 lg:px-4 pb-5">
        <div className="lg:px-4 py-2 lg:py-10 bg-stone-950">
          <h1 className="text-2xl lg:text-5xl font-bold">{title}</h1>
          <p className="secondary text-[10px] md:text-sm text-cream ">
            {description}
          </p>
        </div>
        <ErrorCode
          title={`No ${type} available`}
          description={`Check back later for new ${type}.`}
        />
      </div>
    );
  }

  const hasServerFilters = Object.keys(serverFilters).length > 0;

  console.log(initialData, "////");

  return (
    <div className="space-y-3 px-3 lg:px-4 pb-5">
      {/* Headline */}
      <div className="lg:px-4 py-2 lg:py-10 bg-stone-950">
        <h1 className="text-2xl lg:text-5xl font-bold">{title}</h1>
        <p className="secondary text-[10px] md:text-sm text-cream ">
          {description}
        </p>
      </div>
      {/* Filter Bar */}
      <FilterBar
        config={dynamicFilterConfig}
        values={filters}
        onChange={handleFilterChange}
      />
      {/* Loading state for filter fetch */}
      {fetchingFiltered && (
        <div className="text-center py-10">
          <Spinner />
        </div>
      )}
      {/* No results */}
      {!fetchingFiltered && displayedData.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400 mb-2">
            No {type} found
            {hasServerFilters && " matching your filters"}
          </p>
          {hasServerFilters && (
            <p className="text-sm text-gray-500">
              Try adjusting your filters to see more results
            </p>
          )}
        </div>
      )}

      {/* Results grid */}
      {!fetchingFiltered && displayedData.length > 0 && (
        <>
          {/* Filter info */}
          <div className={`grid ${config.gridCols} gap-2 lg:gap-4`}>
            {displayedData.map((item, idx) => {
              const { key, ...cardProps } = mapCardProps(item, type, idx);
              return <ProductCard key={key} {...cardProps} />;
            })}
          </div>

          {/* Load More button */}
          {hasMore && (
            <div className="flex flex-col items-center gap-2 my-4">
              <Button
                text={loading ? "Loading..." : "Load More"}
                onClick={loadMore}
                loading={loading}
                disabled={loading}
              />
            </div>
          )}

          {/* End of results */}
          {!hasMore && data.length >= config.limit && (
            <div className="text-center py-4 text-sm text-gray-500">
              All {type} loaded
              {hasServerFilters && " (filtered results)"}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;
