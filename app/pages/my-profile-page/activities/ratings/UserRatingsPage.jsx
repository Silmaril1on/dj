import { formatTime } from "@/app/helpers/utils";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import SpanText from "@/app/components/ui/SpanText";
import RatingButton from "@/app/components/buttons/RatingButton";
import Image from "next/image";
import Link from "next/link";
import ArtistName from "@/app/components/materials/ArtistName";

const UserRatingsPage = ({ ratingsData, error, currentPage = 1 }) => {
  if (error) {
    return (
      <div className="w-[60%] mx-auto p-8 text-center">
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
          <Title text="Error Loading Ratings" size="lg" className="text-red-400 mb-2" />
          <Paragraph text={error} className="text-red-300" />
        </div>
      </div>
    );
  }

  if (!ratingsData) {
    return (
      <div className="w-[60%] mx-auto p-8 text-center">
        <div className="bg-stone-800 border border-gold/20 rounded-lg p-6">
          <Title text="Loading Ratings..." size="lg" className="text-gold" />
        </div>
      </div>
    );
  }

  if (!ratingsData.ratings || ratingsData.ratings.length === 0) {
    return (
      <div className="w-[60%] mx-auto p-8 text-center">
        <div className="bg-stone-800 border border-gold/20 rounded-lg p-6">
          <Title text="No Ratings Yet" size="lg" className="text-gold mb-2" />
          <Paragraph text="You haven't rated any artists yet. Start exploring and rate your favorite artists!" className="text-stone-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-5 gap-4">
        {ratingsData.ratings.map((rating) => (
          <Link href={`/artists/${rating.artist.id}`} key={rating.id}>
            <div
              key={rating.id}
              className="bg-stone-900 border border-gold/20 group rounded-sm flex-col flex p-2 hover:border-gold/30 transition-colors"
            >
              <div className="h-34 w-full">
                <Image
                  src={rating.artist.artist_image}
                  alt={rating.artist.stage_name || rating.artist.name}
                  width={100}
                  height={100}
                  className="object-cover w-full h-full brightness-80 group-hover:brightness-100 duration-300"
                />
              </div>
              <ArtistName artistName={rating.artist} size="xs" />
              <RatingButton
                artist={rating.artist}
                userRating={rating.score}
                className="text-sm"
              />
              <SpanText className="w-fit" color="chino" size="xs" text={formatTime(rating.created_at)} />
            </div>
          </Link>
        ))}
      </div>
    </div >
  );
};

export default UserRatingsPage;