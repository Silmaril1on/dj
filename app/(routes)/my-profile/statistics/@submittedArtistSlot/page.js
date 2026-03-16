import SubmittedProfileCard from "@/app/(routes)/my-profile/statistics/(components)/SubmittedProfileCard";
import { getUserSubmittedArtistStats } from "@/app/lib/services/user/statistics/getUserSubmittedArtistStats";

export default async function SubmittedArtistsSlot() {
  try {
    const submittedArtist = await getUserSubmittedArtistStats();
    return (
      <SubmittedProfileCard
        data={submittedArtist}
        title="My Artist Profile"
        description="Your artist profile"
        imageField="artist_image"
        getDisplayName={(item) => item.stage_name || item.name}
        getHref={(item) => `/artists/${item.artist_slug}`}
        submitHref="/add-product/artist"
        submitLabel="Submit Artist Profile"
        emptyTitle="Your artist profile is not yet submitted"
        emptyDescription="Do you have artist profile? Please submit it to see your profile here."
      />
    );
  } catch (error) {
    console.error("Error fetching submitted artists:", error);
    return (
      <SubmittedProfileCard
        error={error.message}
        title="My Artist Profile"
        description="Your artist profile"
      />
    );
  }
}
