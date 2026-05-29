import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/app/lib/services/shared";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { ServiceError } from "@/app/lib/services/shared";

const handleError = (error) => {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};

/**
 * GET /api/notifications/subscriptions?entity_type=festival&entity_id=xxx&notification_type=lineup_phase_drop
 * Returns whether the current user has an active subscription.
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    if (!user) return NextResponse.json({ subscribed: false });

    const { searchParams } = new URL(request.url);
    const entity_type = searchParams.get("entity_type");
    const entity_id = searchParams.get("entity_id");
    const notification_type =
      searchParams.get("notification_type") || "lineup_phase_drop";

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: "entity_type and entity_id are required" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("notification_subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id)
      .eq("notification_type", notification_type)
      .maybeSingle();

    return NextResponse.json({
      subscribed: data?.status === "active",
      subscription_id: data?.id ?? null,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/notifications/subscriptions
 * Body: { entity_type, entity_id, notification_type }
 * Creates or reactivates a subscription.
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const {
      entity_type,
      entity_id,
      notification_type = "lineup_phase_drop",
    } = await request.json();

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: "entity_type and entity_id are required" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdminClient();

    // Upsert — reactivate if previously cancelled
    const { data, error } = await admin
      .from("notification_subscriptions")
      .upsert(
        {
          user_id: user.id,
          entity_type,
          entity_id,
          notification_type,
          status: "active",
          cancelled_at: null,
        },
        {
          onConflict: "user_id,entity_type,entity_id,notification_type",
          ignoreDuplicates: false,
        },
      )
      .select("id")
      .single();

    if (error) {
      console.error("[SUBSCRIPTIONS] upsert error:", error);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, subscription_id: data.id });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/notifications/subscriptions
 * Body: { entity_type, entity_id, notification_type }
 * Cancels an active subscription.
 */
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const {
      entity_type,
      entity_id,
      notification_type = "lineup_phase_drop",
    } = await request.json();

    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("notification_subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id)
      .eq("notification_type", notification_type);

    if (error) {
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
