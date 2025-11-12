import SingleDataProfile from '@/app/pages/single-data-profile/SingleDataProfile';
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | Festival Details",
  description: "Festival details page",
}

const FestivalProfilePage = async ({ params }) => {
  const { id } = await params;
  
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(`${process.env.PROJECT_URL}/api/festivals/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    const result = await response.json();
    
    if (!result.success || !result.festival) {
      return (
        <div className="w-full flex justify-center items-center h-96">
          <div className="bg-stone-900 border border-red-400/30 rounded-lg p-8 text-center">
            <h2 className="text-red-400 text-2xl mb-2">Festival Not Found</h2>
            <p className="text-stone-300">This festival does not exist.</p>
          </div>
        </div>
      );
    }

    return <SingleDataProfile data={result.festival} type="festivals" currentUserId={result.currentUserId} />;
  } catch (error) {
    return (
      <div className="w-full flex justify-center items-center h-96">
        <div className="bg-stone-900 border border-red-400/30 rounded-lg p-8 text-center">
          <h2 className="text-red-400 text-2xl mb-2">Error Loading Festival</h2>
          <p className="text-stone-300">Please try again later.</p>
        </div>
      </div>
    );
  }
}

export default FestivalProfilePage;