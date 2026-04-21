import SubmittedProfileCard from "@/app/(routes)/my-profile/statistics/(components)/SubmittedProfileCard";
import { getUserSubmittedFestivalStats } from "@/app/lib/services/user/statistics/getUserSubmittedFestivalStats";

export default async function SubmittedFestivalSlot() {
  try {
    const submittedFestival = await getUserSubmittedFestivalStats();
    if (!submittedFestival || submittedFestival.length === 0) return null;
    return (
      <SubmittedProfileCard
        data={submittedFestival}
        title="My Festival Profile"
        description="Your festival profile"
        imageField="image_url"
        getDisplayName={(item) => item.name}
        getHref={(item) => `/festivals/${item.festival_slug}`}
        submitHref="/add-product/festival"
        submitLabel="Submit Festival Profile"
        emptyTitle="Your festival profile is not yet submitted"
        emptyDescription="Do you have a festival? Please submit it to see your profile here."
        renderExtra={(item) =>
          item.capacity_total && (
            <span className="text-gold/80 text-sm font-medium mt-1">
              Capacity:{" "}
              <span className="text-cream">{item.capacity_total}</span>
            </span>
          )
        }
      />
    );
  } catch (error) {
    console.error("Error fetching submitted festival:", error);
    return (
      <SubmittedProfileCard
        error={error.message}
        title="My Festival Profile"
        description="Your festival profile"
      />
    );
  }
}
