import AddFestivalLineupForm from "@/app/components/forms/AddFestivalLineupForm";
import { getLineup } from "@/app/lib/services/festivals/festivalLineup";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// force-dynamic so the auth cookie is always read fresh (ownership check)
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lineup Update",
  description: "Add or edit lineup for your festival",
};

const AddLineupPage = async ({ params }) => {
  const { id } = await params;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    // Fetch festival data to verify ownership (must stay no-store — auth-gated)
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/festivals?id=${id}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      },
    );

    const result = await response.json();

    if (!result.success || !result.festival) {
      redirect(`/festivals/${id}`);
    }

    // Use the real UUID from the fetched festival (id in URL is a slug)
    const festivalUUID = result.festival.id;

    // Call the service directly — getLineup is wrapped with unstable_cache so
    // subsequent page visits within the revalidation window skip the DB entirely.
    // Cache is busted instantly after any lineup mutation via revalidateTag.
    let existingLineup = null;
    let existingStandardArtists = [];
    let existingStages = [];
    let lineupType = "none";
    let currentLineupStatus = null;

    try {
      const lineupData = await getLineup(festivalUUID, cookieStore);
      existingLineup = lineupData.lineup?.length > 0 ? lineupData.lineup : null;
      existingStandardArtists = lineupData.standardArtists || [];
      existingStages = lineupData.stages || [];
      lineupType = lineupData.lineupType || "none";
      const firstPhase =
        lineupData.lineup?.[0]?.artists?.[0]?.phase ||
        lineupData.standardArtists?.[0]?.phase ||
        null;
      currentLineupStatus = firstPhase;
    } catch {
      // No existing lineup — form starts fresh
    }

    return (
      <AddFestivalLineupForm
        festivalId={festivalUUID}
        festivalName={result.festival.name}
        existingLineup={existingLineup}
        existingStandardArtists={existingStandardArtists}
        existingStages={existingStages}
        lineupType={lineupType}
        currentLineupStatus={currentLineupStatus}
      />
    );
  } catch (error) {
    console.error("Error loading festival:", error);
    redirect(`/festivals/${id}`);
  }
};

export default AddLineupPage;
