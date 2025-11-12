import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    
    const { id: festivalId } = await params;

    if (!festivalId) {
      return NextResponse.json(
        { success: false, error: "Festival ID is required" },
        { status: 400 }
      );
    }

    // Get current user
    const { user } = await getServerUser(cookieStore);
    const currentUserId = user?.id || null;

    // Fetch festival data
    const { data: festival, error } = await supabase
      .from("festivals")
      .select("*")
      .eq("id", festivalId)
      .single();

    if (error) {
      console.error("Error fetching festival:", error);
      return NextResponse.json(
        { success: false, error: "Festival not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      festival: festival,
      currentUserId: currentUserId,
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/festivals/[id]:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
