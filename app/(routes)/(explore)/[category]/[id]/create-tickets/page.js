import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import CreateTicketsForm from "../(components)/CreateTicketsForm";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { CATEGORY_CONFIGS, VALID_CATEGORIES } from "../../../categoryConfigs";

export const dynamic = "force-dynamic";

const TICKETABLE = ["festivals", "events"];

export const metadata = {
  title: "Soundfolio | Create Tickets",
  description:
    "Manage ticket informations, tiers, prices and quantity for this entity. Only accessible to event owners and admins.",
};

const CreateTicketsPage = async ({ params }) => {
  const { category, id } = await params;

  if (!VALID_CATEGORIES.includes(category) || !TICKETABLE.includes(category)) {
    notFound();
  }

  const cookieStore = await cookies();
  const { user } = await getServerUser(cookieStore);

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch entity data to verify ownership and get the entity name
  const config = CATEGORY_CONFIGS[category].profile;
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const fetchOptions =
    typeof config.fetchOptions === "function"
      ? config.fetchOptions(id)
      : { ...config.fetchOptions };
  fetchOptions.headers = { ...fetchOptions.headers, Cookie: cookieHeader };

  let entityData = null;
  let entityId = null;
  let entityName = id;

  try {
    const response = await fetch(
      config.apiEndpoint(process.env.PROJECT_URL, id),
      fetchOptions,
    );
    const json = await response.json();
    const { data } = config.extractData(json);
    if (data) {
      entityData = data;
      entityId = data.id;
      entityName =
        category === "festivals"
          ? data.name || id
          : data.event_name || data.name || id;
    }
  } catch {
    // Continue — the form will show an error if the entity is inaccessible
  }

  if (!entityId) {
    notFound();
  }

  // Authorization check: must be owner or admin
  const isAdmin = user?.is_admin;
  const isOwner =
    entityData?.user_id === user.id ||
    (Array.isArray(user?.submitted_event_id) &&
      user.submitted_event_id.includes(entityId));

  if (!isAdmin && !isOwner) {
    redirect("/");
  }

  const entityType = category === "festivals" ? "festival" : "event";
  const backHref = `/${category}/${id}`;

  return (
    <CreateTicketsForm
      entityId={entityId}
      entityType={entityType}
      entityName={entityName}
      backHref={backHref}
    />
  );
};

export default CreateTicketsPage;
