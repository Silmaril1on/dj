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
    const response = await fetch(`${process.env.PROJECT_URL}/api/festivals/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    const result = await response.json();
    
    if (!result.success || !result.festival) {
      redirect(`/festivals/${id}`);
    }

    // Fetch existing lineup if any
    let existingLineup = null;
    try {
      const lineupResponse = await fetch(`${process.env.PROJECT_URL}/api/festivals/add-festival-lineup?festival_id=${id}`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      });
      
      if (lineupResponse.ok) {
        const lineupData = await lineupResponse.json();
        existingLineup = lineupData.lineup;
      }
    } catch (err) {
      console.log("No existing lineup found");
    }

    return (
        <AddFestivalLineupForm 
          festivalId={id} 
          festivalName={result.festival.name}
          existingLineup={existingLineup}
        />
    );
  } catch (error) {
    console.error("Error loading festival:", error);
    redirect(`/festivals/${id}`);
  }
};

export default AddLineupPage;
