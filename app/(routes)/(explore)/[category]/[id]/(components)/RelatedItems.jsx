"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SectionContainer from "@/app/components/containers/SectionContainer";
import { resolveImage } from "@/app/helpers/utils";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Motion from "@/app/components/containers/Motion";

const TYPE_CONFIG = {
  clubs: {
    title: "Related Clubs",
    description: "Clubs in the same country",
    apiParam: "clubId",
    apiEndpoint: "/api/clubs/get-related-clubs",
    responseKey: "clubs",
    getHref: (item) => `/clubs/${item.club_slug || item.id}`,
    getName: (item) => item.name,
  },
  festivals: {
    title: "Related Festivals",
    description: "Festivals in the same country",
    apiParam: "festivalId",
    apiEndpoint: "/api/festivals/get-related-festivals",
    responseKey: "festivals",
    getHref: (item) => `/festivals/${item.festival_slug || item.id}`,
    getName: (item) => item.name,
  },
  events: {
    title: "Upcoming Events Nearby",
    description: "Upcoming events in the same country",
    apiParam: "eventId",
    apiEndpoint: "/api/events/get-related-events",
    responseKey: "events",
    getHref: (item) => `/events/${item.id}`,
    getName: (item) => item.event_name || item.name,
  },
};

const RelatedItems = ({ entityId, entityType, country }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = TYPE_CONFIG[entityType];

  useEffect(() => {
    if (!entityId || !country || !config) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      [config.apiParam]: entityId,
      country,
    });

    fetch(`${config.apiEndpoint}?${params}`)
      .then((r) => r.json())
      .then((data) => setItems(data[config.responseKey] || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [entityId, country, entityType]);

  if (loading) {
    return (
      <SectionContainer title={config?.title} description={config?.description}>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 px-2 lg:px-4 pb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="aspect-square bg-stone-800 animate-pulse" />
              <div className="h-3 bg-stone-800 animate-pulse rounded w-3/4" />
              <div className="h-2 bg-stone-800 animate-pulse rounded w-1/2" />
            </div>
          ))}
        </div>
      </SectionContainer>
    );
  }

  if (!items.length) return null;

  return (
    <SectionContainer title={config.title} description={config.description}>
      <div className="grid grid-cols-4 lg:w-[60%] gap-4 lg:gap-8 px-2 lg:px-4 my-8">
        {items.map((item, i) => (
          <Motion key={item.id} animation="top" delay={i * 0.05}>
            <Link
              href={config.getHref(item)}
              className="flex flex-col gap-1 opacity-80 hover:opacity-100 duration-300"
            >
              <div className="relative aspect-square overflow-hidden rounded-full">
                <img
                  src={resolveImage(item.image_url, "md")}
                  alt={config.getName(item)}
                  className="object-cover w-full h-full transition-transform duration-300"
                />
              </div>
              <div className="center flex-col">
                <p className="text-cream font-bold text-xs lg:text-lg uppercase leading-none truncate">
                  {config.getName(item)}
                </p>
                <ArtistCountry
                  artistCountry={{ country: item.country }}
                  size="small"
                />
              </div>
            </Link>
          </Motion>
        ))}
      </div>
    </SectionContainer>
  );
};

export default RelatedItems;
