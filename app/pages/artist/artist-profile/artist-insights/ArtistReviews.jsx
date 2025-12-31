import SectionContainer from "@/app/components/containers/SectionContainer";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import Paragraph from "@/app/components/ui/Paragraph";
import SpanText from "@/app/components/ui/SpanText";
import Title from "@/app/components/ui/Title";
import { formatTime, truncateString } from "@/app/helpers/utils";
import Link from "next/link";

const ArtistReviews = ({ data, artistId }) => {
  if (data.length === 0 || !data) {
    return null;
  }

  return (
    <SectionContainer
      size="sm"
      className="bg-stone-900"
      title="Artist Reviews"
      description="Read what others are saying about this artist."
    >
      <div className="h-full w-full flex flex-col items-center space-y-2">
        <div className="grid grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3 w-full h-full">
          {data.map((item, idx) => {
            return (
              <div key={idx} className="border border-gold/30 p-2 bg-stone-950">
                <div className="flex gap-2 mb-3">
                  <ProfilePicture avatar_url={item?.user?.user_avatar} />
                  <div>
                    <SpanText
                      text={item?.user?.userName}
                      color="cream"
                      size="xs"
                    />
                    <SpanText text={formatTime(item?.created_at)} size="xs" />
                  </div>
                </div>
                <Title text={item.review_title} size="xs" />
                <Paragraph text={truncateString(item.review_text, 280)} />
              </div>
            );
          })}
        </div>
        <Link
          href={`/artists/${artistId}/reviews`}
          className="hover:text-cream duration-300"
        >
          View all Reviews
        </Link>
      </div>
    </SectionContainer>
  );
};

export default ArtistReviews;
