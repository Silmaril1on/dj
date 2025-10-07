import Clubs from "@/app/pages/club/clubs-page/Clubs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = { 
  title: "Soundfolio | Clubs", 
  description: "Discover and explore various clubs on Soundfolio. Join communities that share your musical interests and connect with like-minded individuals." 
}

const ClubsPage = async () => {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/club?limit=15&offset=0`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch clubs");
    }

    const result = await response.json();
    const clubs = result?.data || [];
    return <Clubs clubs={clubs} />;
  } catch (error) {
    return <Clubs clubs={[]} error={error.message} />;
  }
};

export default ClubsPage;
