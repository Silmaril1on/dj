// app/pages/artist/artist-page/AllArtistsClient.jsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import ErrorCode from "@/app/components/ui/ErrorCode";
import ProductCard from "@/app/components/containers/ProductCard";
import FilterBar from "@/app/components/forms/FilterBar";
import PageHeadline from "@/app/components/containers/PageHeadline";
import { filterConfigs } from "@/app/helpers/filterSearch/filterConfig";
import Button from "@/app/components/buttons/Button";

const PAGE_LIMIT = 20;
const DEBOUNCE_MS = 300;

const AllArtistsClient = ({ initialArtists = [], initialTotal = 0, initialFilters = {} }) => {
  const [artists, setArtists] = useState(initialArtists || []);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(initialTotal || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [queryVersion, setQueryVersion] = useState(0); // bump to cancel race conditions

  // dynamic options
const countryOptions = useMemo(() => {
  const set = new Set((artists || []).map(a => a.country).filter(Boolean));
  return Array.from(set).sort();
}, [artists]);

const genreOptions = useMemo(() => {
  const allGenres = new Set();
  (artists || []).forEach(artist => {
    if (artist.genres && Array.isArray(artist.genres)) {
      artist.genres.forEach(g => allGenres.add(g));
    }
  });
  return Array.from(allGenres).sort();
}, [artists]);

  const dynamicFilterConfig = useMemo(() => {
    return filterConfigs.artists
      .filter(f => f.name !== "city")
      .map(field => {
        if (field.name === "country") {
          return { ...field, options: countryOptions.map(c => ({ value: c, label: c })) };
        }
        if (field.name === "genres") {
          return { ...field, options: genreOptions.map(g => ({ value: g, label: g })) };
        }
        return field;
      });
  }, [countryOptions, genreOptions]);

  useEffect(() => {
    // initial load when component mounts (or filters change)
    fetchFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // debounce for name filter: bump queryVersion after a short delay
  useEffect(() => {
    const t = setTimeout(() => {
      setQueryVersion(v => v + 1);
      fetchFirstPage();
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.name]);

  const buildQuery = (limit = PAGE_LIMIT, offsetVal = 0) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offsetVal));

    if (filters.country) params.set("country", filters.country);
    if (filters.name) params.set("name", filters.name);
    if (filters.sex) params.set("sex", filters.sex);
    if (filters.genres) params.set("genres", filters.genres);
    if (filters.birth_decade) params.set("birth_decade", filters.birth_decade);
    if (filters.rating_range) params.set("rating_range", filters.rating_range);
    if (filters.sort) params.set("sort", filters.sort);

    return params.toString();
  };

  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffset(0);

    try {
      const qs = buildQuery(PAGE_LIMIT, 0);
      const res = await fetch(`${process.env.NEXT_PUBLIC_PROJECT_URL || ""}/api/artists/all-artists?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setArtists([]);
        setTotal(0);
      } else {
        setArtists(json.data || []);
        setTotal(json.total || (json.data ? json.data.length : 0));
      }
    } catch (err) {
      console.error("Fetch artists failed", err);
      setError("Failed to load artists");
      setArtists([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, queryVersion]);

  const loadMore = async () => {
    if (loading) return;
    const nextOffset = offset + PAGE_LIMIT;
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(PAGE_LIMIT, nextOffset);
      const res = await fetch(`${process.env.NEXT_PUBLIC_PROJECT_URL || ""}/api/artists/all-artists?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setArtists(prev => [...prev, ...(json.data || [])]);
        setOffset(nextOffset);
        if (typeof json.total === "number") setTotal(json.total);
      }
    } catch (err) {
      console.error("Load more failed", err);
      setError("Failed to load more artists");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    // update filters; reset offset in fetchFirstPage()
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // computed UI flags
  const hasMore = total === null ? artists.length % PAGE_LIMIT === 0 && artists.length > 0 : artists.length < total;

  return (
    <div className="px-3 lg:px-4">
      <PageHeadline title="All Artists" description="Discover talented artists from around the world." />
      <FilterBar config={dynamicFilterConfig} values={filters} onChange={handleFilterChange} />

      {error && <ErrorCode title="Error loading artists" description={String(error)} />}

      <div className="mt-4 ">
        {artists.length > 0 ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4">
              {artists.map((artist, idx) => (
                <ProductCard
                  key={artist.id}
                  id={artist.id}
                  image={artist.artist_image}
                  name={artist.stage_name || artist.name}
                  country={artist.country}
                  likesCount={artist.likesCount}
                  href={`/artists/${artist.id}`}
                  delay={idx}
                />
              ))}
            </div>

            <div className="center my-5">
              {hasMore ? (
                <Button text={loading ? "Loading..." : "Load more"} onClick={loadMore} disabled={loading}/>
              ) : (
                <div className="text-sm text-muted">No more artists</div>
              )}
            </div>
          </>
        ) : loading ? (
          <div className="py-12 text-center">Loading...</div>
        ) : (
          <div className="text-center py-10">
            <ErrorCode title="No artists found" description="Try adjusting your filters to see more results." />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllArtistsClient;
