"use client";
import SocialLinks from "@/app/components/materials/SocialLinks";
import EditProduct from "@/app/components/buttons/EditProduct..jsx";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Location from "@/app/components/materials/Location";
import Lineup from "../../events/event-profile-page/hero-components/LineUp";
import PosterSide from "@/app/pages/events/event-profile-page/hero-components/PosterSide";
import FlexBox from "@/app/components/containers/FlexBox";
import { useRouter } from "next/navigation";
import ArtistSchedule from "@/app/pages/artist/artist-profile/schedule/ArtistSchedule";
import { FaUpload } from "react-icons/fa";
import EmailTag from "@/app/components/ui/EmailTag";
import useRecentlyViewed from "@/app/lib/hooks/useRecentlViewed";

const ClubProfile = ({ club, currentUserId, clubSchedule }) => {
  if (!club) return null;
  const isOwner = currentUserId && club.user_id === currentUserId;
  const router = useRouter();

   useRecentlyViewed("club", club.id);

  const handleAddEvent = () => {
    const params = new URLSearchParams({
      club_id: club.id,
      venue_name: club.name,
      address: club.address,
      location_url: club.location_url || "",
      country: club.country,
      city: club.city,
    }).toString();
    router.push(`/add-product/add-event?${params}`);
  };

  return (
    <div className="flex flex-col pb-5">
        <div className="flex flex-col lg:pl-2 lg:flex-row justify-between items-start lg:items-center pr-4 gap-2">
           {club.residents && (
                <Lineup title="Venue Residents" data={club.residents} />
               )}
            {isOwner && (
                <div className="p-4 flex justify-between items-center">
                     <FlexBox type="row=start" className="gap-2">
                      <EditProduct desc="Edit Club Info" data={club} type="club" />
                           <button
                                 onClick={handleAddEvent}
                                 className="bg-gold/30 flex hover:bg-gold/40 cursor-pointer duration-300 items-center gap-1 secondary text-sm px-2 py-1 rounded-xs font-bold "
                            >
                       <FaUpload />
                       <span>Add Event</span>
                     </button>
                     </FlexBox>
                </div>
            )}
           
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <article className="flex flex-1 space-y-3 justify-between items-start flex-col bg-stone-900 p-4">
          <div >
            <Title size="xl" text={club.name} />
            <ArtistCountry artistCountry={club} />
          </div>
          <Paragraph text={club.description} />
          <div>
            <Location address={club.address} location_url={club.location_url} />
            <EmailTag email={club?.venue_email} />
          </div>
          <div>
            <SocialLinks
              animation={true}
              animationDelay={1.2}
              social_links={club.social_links}
            />
          </div>
          <div className="mt-4 text-xs text-stone-400">
            Capacity: <span className="text-gold">{club.capacity}</span>
          </div>
        </article>
        <PosterSide src={club.club_image} alt={club.name} />
      </div>
      <ArtistSchedule
        clubId={club.id}
        title="Upcoming Events"
        description="See all upcoming events at this club"
      />
    </div>
  );
};

export default ClubProfile;
