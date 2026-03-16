import SubmittedProfileCard from "@/app/(routes)/my-profile/statistics/(components)/SubmittedProfileCard";
import { getUserSubmittedClubStats } from "@/app/lib/services/user/statistics/getUserSubmittedClubStats";

export default async function SubmittedClubsSlot() {
  try {
    const submittedClub = await getUserSubmittedClubStats();
    return (
      <SubmittedProfileCard
        data={submittedClub}
        title="My Club Profile"
        description="Your club profile"
        imageField="club_image"
        getDisplayName={(item) => item.name}
        getHref={(item) => `/clubs/${item.id}`}
        submitHref="/add-product/club"
        submitLabel="Submit Club Profile"
        emptyTitle="Your club profile is not yet submitted"
        emptyDescription="Do you have a club profile? Please submit it to see your profile here."
        renderExtra={(item) =>
          item.capacity && (
            <span className="text-gold/80 text-sm font-medium mt-1">
              Capacity: <span className="text-cream">{item.capacity}</span>
            </span>
          )
        }
      />
    );
  } catch (error) {
    console.error("Error fetching submitted clubs:", error);
    return (
      <SubmittedProfileCard
        error={error.message}
        title="My Club Profile"
        description="Your club profile"
      />
    );
  }
}
