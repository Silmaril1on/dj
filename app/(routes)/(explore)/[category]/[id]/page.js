import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import SingleDataProfile from "@/app/(routes)/(explore)/[category]/[id]/SingleDataProfile";
import { CATEGORY_CONFIGS, VALID_CATEGORIES } from "../../categoryConfigs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { category } = await params;
  return CATEGORY_CONFIGS[category]?.metadata.profile || {};
}

const ProfileNotFound = ({ label }) => (
  <div className="w-full flex justify-center items-center h-96">
    <div className="bg-stone-900 border border-red-400/30 rounded-lg p-8 text-center">
      <h2 className="text-red-400 text-2xl mb-2">{label} Not Found</h2>
      <p className="text-stone-300">
        This {label.toLowerCase()} does not exist.
      </p>
    </div>
  </div>
);

const ProfileError = ({ label }) => (
  <div className="w-full flex justify-center items-center h-96">
    <div className="bg-stone-900 border border-red-400/30 rounded-lg p-8 text-center">
      <h2 className="text-red-400 text-2xl mb-2">Error Loading {label}</h2>
      <p className="text-stone-300">Please try again later.</p>
    </div>
  </div>
);

const CategoryProfilePage = async ({ params }) => {
  const { category, id } = await params;

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const config = CATEGORY_CONFIGS[category].profile;
  const label = category.charAt(0).toUpperCase() + category.slice(1, -1); // "clubs" → "Club"

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const fetchOptions =
      typeof config.fetchOptions === "function"
        ? config.fetchOptions(id)
        : { ...config.fetchOptions };

    fetchOptions.headers = {
      ...fetchOptions.headers,
      Cookie: cookieHeader,
    };

    const response = await fetch(
      config.apiEndpoint(process.env.PROJECT_URL, id),
      fetchOptions,
    );

    const json = await response.json();
    const { data, currentUserId } = config.extractData(json);

    if (!data) {
      return <ProfileNotFound label={label} />;
    }

    return (
      <SingleDataProfile
        data={data}
        type={config.type}
        currentUserId={currentUserId}
      />
    );
  } catch {
    return <ProfileError label={label} />;
  }
};

export default CategoryProfilePage;
