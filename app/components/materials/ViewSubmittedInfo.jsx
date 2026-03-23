"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeEvaluationModal,
  setArtistData,
  setLoading,
  setError,
  selectEvaluationModal,
  selectSelectedArtist,
  selectArtistData,
  selectEvaluationLoading,
  selectEvaluationError,
} from "@/app/features/evaluationSlice";
import { MdPerson, MdCalendarToday, MdTransgender } from "react-icons/md";
import Location from "@/app/components/materials/Location";
import Button from "@/app/components/buttons/Button";
import Spinner from "../ui/Spinner";
import SocialLinks from "./SocialLinks";
import ArtistGenres from "./ArtistGenres";
import ArtistCountry from "./ArtistCountry";
import GlobalModal from "../modals/GlobalModal";
import Image from "next/image";

// ─── Sub-components ───────────────────────────────────────────────────────────

const AvatarSide = ({ src, alt }) => (
  <div className="relative w-full aspect-square max-h-72 overflow-hidden rounded-lg border border-gold/20">
    <Image src={src} alt={alt || "submission"} fill className="object-cover" />
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="text-gold/70 shrink-0" size={15} />}
      <span className="text-chino/70 ">{label}:</span>
      <span className="text-chino font-medium capitalize">{value}</span>
    </div>
  );
};

const InformationSide = ({ data, type }) => {
  const isArtist = type === "artist";
  const isClub = type === "club";
  const isEvent = type === "event";
  const isFestival = type === "festival";

  return (
    <div className="flex flex-col gap-1 justify-start">
      {/* Name */}
      <div>
        <h3 className="text-xl font-bold text-gold uppercase leading-none">
          {data.name}
        </h3>
        {isArtist && data.stage_name && (
          <p className="text-chino/60 text-sm mt-0.5">
            aka <span className="text-chino italic">{data.stage_name}</span>
          </p>
        )}
      </div>
      <ArtistCountry
        artistCountry={{ country: data.country, city: data.city }}
      />
      {/* Type-specific fields */}
      <div className="my-2">
        {isArtist && (
          <>
            <InfoRow label="Gender" value={data.sex} />
            <InfoRow label="Born" value={data.birth} />
          </>
        )}

        {isClub && (
          <>
            <Location address={data.address} location_url={data.location_url} />
            <InfoRow icon={MdPerson} label="Capacity" value={data.capacity} />
          </>
        )}

        {isEvent && (
          <InfoRow icon={MdPerson} label="Promoter" value={data.stage_name} />
        )}

        {isFestival && (
          <>
            <Location address={data.address} location_url={data.location_url} />
            <InfoRow label="Start" value={data.start_date} />
            <InfoRow label="End" value={data.end_date} />
            <InfoRow
              icon={MdPerson}
              label="Capacity"
              value={data.capacity_total}
            />
          </>
        )}
      </div>

      {/* Genres (artist only) */}
      {isArtist && data.genres?.length > 0 && (
        <ArtistGenres
          className="text-[10px] flex flex-wrap mb-3"
          genres={data.genres}
        />
      )}
      {/* Social links */}
      {data.social_links?.length > 0 && (
        <SocialLinks social_links={data.social_links} animation={false} />
      )}
    </div>
  );
};

const ViewSubmittedInfo = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectEvaluationModal);
  const selected = useSelector(selectSelectedArtist);
  const data = useSelector(selectArtistData);
  const loading = useSelector(selectEvaluationLoading);
  const error = useSelector(selectEvaluationError);

  const type =
    selected?.__type || (selected?.capacity !== undefined ? "club" : "artist");

  const isArtist = type === "artist";

  useEffect(() => {
    if (!selected?.id || data) return;

    if (isArtist) {
      // Artists need a full profile fetch (genres, bio, social_links, etc.)
      dispatch(setLoading(true));
      fetch(`/api/artists/artist-profile?id=${selected.id}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.artist) dispatch(setArtistData(json.artist));
          else dispatch(setError(json.error || "Failed to fetch artist data"));
        })
        .catch(() => dispatch(setError("Network error")));
    } else {
      // All other types already carry all the data we need
      dispatch(setArtistData(selected));
    }
  }, [selected]);

  const imageField =
    type === "club"
      ? "artist_image" // already mapped to club_image in service
      : type === "festival"
        ? "artist_image" // already mapped to poster in service
        : type === "event"
          ? "artist_image"
          : "artist_image";

  const titleMap = {
    artist: "Artist Details",
    club: "Club Details",
    event: "Event Details",
    festival: "Festival Details",
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={() => dispatch(closeEvaluationModal())}
      title={titleMap[type] ?? "Details"}
      maxWidth="max-w-2xl"
    >
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-red-400">{error}</p>
          <Button text="Retry" onClick={() => dispatch(setArtistData(null))} />
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-2 gap-6 items-start">
          <AvatarSide src={data[imageField]} alt={data.name} />
          <InformationSide data={data} type={type} />
        </div>
      )}
    </GlobalModal>
  );
};

export default ViewSubmittedInfo;
