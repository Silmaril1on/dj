"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import ErrorCode from "@/app/components/ui/ErrorCode";
import ProductCard from "@/app/components/containers/ProductCard";
import FilterBar from "@/app/components/forms/FilterBar";
import PageHeadline from "@/app/components/containers/PageHeadline";
import { filterConfigs } from "@/app/helpers/filterSearch/filterConfig";
import Button from "@/app/components/buttons/Button";
import Spinner from "@/app/components/ui/Spinner";

const PAGE_LIMIT = 20;
const DEBOUNCE_MS = 300;

const AllFestivals = ({ initialFestivals = [], initialTotal = 0, initialFilters = {}, error: initialError = null }) => {
  const [festivals, setFestivals] = useState(initialFestivals || []);
  const [offset, setOffset] = useState(initialFestivals.length > 0 ? PAGE_LIMIT : 0);
  const [total, setTotal] = useState(initialTotal || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [filters, setFilters] = useState(initialFilters);
  const [queryVersion, setQueryVersion] = useState(0);
  const [allFestivalsData, setAllFestivalsData] = useState(initialFestivals || []);

  // STATIC options - extracted from ALL festivals data
  const countryOptions = useMemo(() => {
    const set = new Set((allFestivalsData || []).map(f => f.country).filter(Boolean));
    return Array.from(set).sort();
  }, [allFestivalsData]);

  // Fetch ALL festivals once for filter options
  useEffect(() => {
    const fetchAllForFilters = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_PROJECT_URL || ""}/api/festivals/all-festivals?limit=9999`, { cache: "no-store" });
        const json = await res.json();
        if (!json.error && json.data) {
          setAllFestivalsData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch all festivals for filters", err);
      }
    };
    if (allFestivalsData.length === 0) {
      fetchAllForFilters();
    }
  }, []);

  const dynamicFilterConfig = useMemo(() => {
    return filterConfigs.festivals
      .map(field => {
        if (field.name === "country") {
          return { ...field, options: countryOptions.map(c => ({ value: c, label: c })) };
        }
        return field;
      });
  }, [countryOptions]);

  useEffect(() => {
    fetchFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // debounce for name filter
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
    if (filters.sort) params.set("sort", filters.sort);

    return params.toString();
  };

  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffset(0);

    try {
      const qs = buildQuery(PAGE_LIMIT, 0);
      const res = await fetch(`${process.env.NEXT_PUBLIC_PROJECT_URL || ""}/api/festivals/all-festivals?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setFestivals([]);
        setTotal(0);
      } else {
        setFestivals(json.data || []);
        setTotal(json.total || (json.data ? json.data.length : 0));
      }
    } catch (err) {
      console.error("Fetch festivals failed", err);
      setError("Failed to load festivals");
      setFestivals([]);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_PROJECT_URL || ""}/api/festivals/all-festivals?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setFestivals(prev => [...prev, ...(json.data || [])]);
        setOffset(nextOffset);
        if (typeof json.total === "number") setTotal(json.total);
      }
    } catch (err) {
      console.error("Load more failed", err);
      setError("Failed to load more festivals");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (!value || value === "" || value === null || value === undefined) {
        delete newFilters[name];
      } else {
        newFilters[name] = value;
      }
      return newFilters;
    });
  };

  const hasMore = total === null ? festivals.length % PAGE_LIMIT === 0 && festivals.length > 0 : festivals.length < total;

  return (
    <div className="px-2 lg:px-4">
      <PageHeadline title="All Festivals" description="Discover music festivals from around the world." />
      <FilterBar config={dynamicFilterConfig} values={filters} onChange={handleFilterChange} />

      {error && <ErrorCode title="Error loading festivals" description={String(error)} />}

      <div className="mt-4">
        {festivals.length > 0 ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4">
              {festivals.map((festival, idx) => (
                <ProductCard
                  key={festival.id}
                  id={festival.id}
                  image={festival.poster}
                  name={festival.name}
                  country={festival.country}
                  likesCount={festival.likesCount}
                  href={`/festivals/${festival.id}`}
                  delay={idx}
                />
              ))}
            </div>

            <div className="center my-5">
              {hasMore ? (
                <Button text={loading ? "Loading..." : "Load more"} onClick={loadMore} disabled={loading}/>
              ) : (
                <div className="text-sm text-muted">No more festivals</div>
              )}
            </div>
          </>
        ) : loading ? (
          <div className="py-12 center">
            <Spinner/>
          </div>
        ) : (
          <div className="text-center py-10">
            <ErrorCode title="No festivals found" description="Try adjusting your filters to see more results." />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllFestivals;