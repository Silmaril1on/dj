import AddFestivalLineupForm from "@/app/components/forms/AddFestivalLineupForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | Lineup Update",
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
    // Fetch festival data to verify ownership
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

    // Fetch existing lineup + stages in one call
    let existingLineup = null;
    let existingStandardArtists = [];
    let existingStages = [];
    let lineupType = "none";
    let currentLineupStatus = null;

    try {
      const lineupResponse = await fetch(
        `${process.env.PROJECT_URL}/api/festivals/lineup?festival_id=${festivalUUID}`,
        {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
        },
      );

      if (lineupResponse.ok) {
        const lineupData = await lineupResponse.json();
        existingLineup =
          lineupData.lineup?.length > 0 ? lineupData.lineup : null;
        existingStandardArtists = lineupData.standardArtists || [];
        existingStages = lineupData.stages || [];
        lineupType = lineupData.lineupType || "none";
        // Infer current lineup status from first artist with a phase
        const firstPhase =
          lineupData.lineup?.[0]?.artists?.[0]?.phase ||
          lineupData.standardArtists?.[0]?.phase ||
          null;
        currentLineupStatus = firstPhase;
      }
    } catch {
      console.log("No existing lineup found");
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
