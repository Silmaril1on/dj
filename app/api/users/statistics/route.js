import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET() {
  const startTime = performance.now();
  console.log('🚀 [UNIFIED-STATISTICS] Starting fetch for all 7 datasets...');

  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Execute all 7 queries in parallel
    const [
      likesResult,
      reviewsResult,
      ratingsResult,
      bookingsResult,
      submittedArtistResult,
      submittedClubResult,
      submittedEventsResult,
    ] = await Promise.all([
      // 1. LIKES STATS
      (async () => {
        const queryStart = performance.now();
        try {
          const { count: totalLikes } = await supabase
            .from("artist_likes")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          const { data: recentLikes } = await supabase
            .from("artist_likes")
            .select(`
              created_at,
              artists!inner(
                id,
                name,
                stage_name,
                artist_image
              )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          const recentArtists = recentLikes?.map((like) => ({
            id: like.artists.id,
            name: like.artists.name,
            stage_name: like.artists.stage_name,
            artist_image: like.artists.artist_image,
            liked_at: like.created_at,
          })) || [];

          const duration = (performance.now() - queryStart).toFixed(2);
          console.log(`  ✅ Likes: ${duration}ms`);

          return {
            success: true,
            data: { totalLikes: totalLikes || 0, recentArtists },
            timing: duration,
          };
        } catch (error) {
          console.error('  ❌ Likes failed:', error);
          return { success: false, error: error.message, data: null };
        }
      })(),

      // 2. REVIEWS STATS
      (async () => {
        const queryStart = performance.now();
        try {
          const { count: totalReviews } = await supabase
            .from("artist_reviews")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          const { data: recentReviews } = await supabase
            .from("artist_reviews")
            .select(`
              created_at,
              artists!inner(
                id,
                name,
                stage_name,
                artist_image
              )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          const recentArtists = recentReviews?.map((review) => ({
            id: review.artists.id,
            name: review.artists.name,
            stage_name: review.artists.stage_name,
            artist_image: review.artists.artist_image,
            reviewed_at: review.created_at,
          })) || [];

          const duration = (performance.now() - queryStart).toFixed(2);
          console.log(`  ✅ Reviews: ${duration}ms`);

          return {
            success: true,
            data: { totalReviews: totalReviews || 0, recentArtists },
            timing: duration,
          };
        } catch (error) {
          console.error('  ❌ Reviews failed:', error);
          return { success: false, error: error.message, data: null };
        }
      })(),

      // 3. RATINGS STATS
      (async () => {
        const queryStart = performance.now();
        try {
          const { data: ratings } = await supabase
            .from("artist_ratings")
            .select("score")
            .eq("user_id", user.id);

          const ratingCounts = Array(10).fill(0);
          ratings?.forEach(({ score }) => {
            if (score >= 1 && score <= 10) {
              ratingCounts[score - 1] += 1;
            }
          });

            const totalRatings = ratings?.length || 0;
            const ratingData = ratingCounts
              .map((count, index) => ({
                rating: index + 1,
                count,
                percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0,
              }))
              .reverse();

          const duration = (performance.now() - queryStart).toFixed(2);
          console.log(`  ✅ Ratings: ${duration}ms | Total: ${totalRatings}`);

          return {
            success: true,
            data: { ratedArtists: ratings, ratingData, totalRatings },
            timing: duration,
          };
        } catch (error) {
          console.error('  ❌ Ratings failed:', error);
          return { success: false, error: error.message, data: null };
        }
      })(),

      // 4. BOOKING STATS
      (async () => {
        const queryStart = performance.now();
        try {
          const { data: bookings } = await supabase
            .from("booking_requests")
            .select("response")
            .eq("receiver_id", user.id);

          const confirmed = bookings?.filter(b => b.response === "confirmed").length || 0;
          const declined = bookings?.filter(b => b.response === "declined").length || 0;
          const pending = bookings?.filter(b => b.response === null || b.response === "pending").length || 0;
          const total = bookings?.length || 0;

          const stats = { total, confirmed, declined, pending };

          const duration = (performance.now() - queryStart).toFixed(2);
          console.log(`  ✅ Bookings: ${duration}ms | Total: ${total}`);

          return {
            success: true,
            data: { stats },
            timing: duration,
          };
        } catch (error) {
          console.error('  ❌ Bookings failed:', error);
          return { success: false, error: error.message, data: null };
        }
      })(),

      // 5. SUBMITTED ARTIST
      (async () => {
        const queryStart = performance.now();
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("submitted_artist_id")
            .eq("id", user.id)
            .single();

          let submittedArtists = [];
          if (userData?.submitted_artist_id) {
            const { data } = await supabase
              .from("artists")
              .select("id, name, stage_name, artist_image, status, created_at, city, country")
              .eq("id", userData.submitted_artist_id);
            submittedArtists = data || [];
          }

          const duration = (performance.now() - queryStart).toFixed(2);
          console.log(`  ✅ Submitted Artist: ${duration}ms | Found: ${submittedArtists.length}`);

          return {
            success: true,
            data: submittedArtists,
            timing: duration,
          };
        } catch (error) {
          console.error('  ❌ Submitted Artist failed:', error);
          return { success: false, error: error.message, data: [] };
        }
      })(),

      // 6. SUBMITTED CLUB
      (async () => {
        const queryStart = performance.now();
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("submitted_club_id")
            .eq("id", user.id)
            .single();

          let submittedClubs = [];
          if (userData?.submitted_club_id) {
            const { data } = await supabase
              .from("clubs")
              .select("id, name, country, city, capacity, club_image, status, created_at, description")
              .eq("id", userData.submitted_club_id);
            submittedClubs = data || [];
          }

          const duration = (performance.now() - queryStart).toFixed(2);
          console.log(`  ✅ Submitted Club: ${duration}ms | Found: ${submittedClubs.length}`);

          return {
            success: true,
            data: submittedClubs,
            timing: duration,
          };
        } catch (error) {
          console.error('  ❌ Submitted Club failed:', error);
          return { success: false, error: error.message, data: [] };
        }
      })(),

      // 7. SUBMITTED EVENTS
      (async () => {
        const queryStart = performance.now();
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("submitted_event_id")
            .eq("id", user.id)
            .single();

          const submittedIds = Array.isArray(userData?.submitted_event_id)
          ? userData.submitted_event_id
          : [];
          const totalSubmittedEvents = submittedIds.length;

          let recentEvents = [];
          if (totalSubmittedEvents > 0) {
            const { data } = await supabase
              .from("events")
              .select("id, event_name, promoter, event_image, created_at, city, country, date")
              .in("id", submittedIds)
              .order("created_at", { ascending: false })
              .limit(5);
            recentEvents = data || [];
          }

          const duration = (performance.now() - queryStart).toFixed(2);
          console.log(`  ✅ Submitted Events: ${duration}ms | Total: ${totalSubmittedEvents}`);

          return {
            success: true,
            data: { totalSubmittedEvents, recentEvents },
            timing: duration,
          };
        } catch (error) {
          console.error('  ❌ Submitted Events failed:', error);
          return { success: false, error: error.message, data: { totalSubmittedEvents: 0, recentEvents: [] } };
        }
      })(),
    ]);

    const totalDuration = (performance.now() - startTime).toFixed(2);
    
    console.log(`✅ [UNIFIED-STATISTICS] Completed ALL in ${totalDuration}ms`);
    console.log(`   Breakdown: Likes=${likesResult.timing}ms, Reviews=${reviewsResult.timing}ms, Ratings=${ratingsResult.timing}ms, Bookings=${bookingsResult.timing}ms, Artist=${submittedArtistResult.timing}ms, Club=${submittedClubResult.timing}ms, Events=${submittedEventsResult.timing}ms`);

    return NextResponse.json({
      success: true,
      data: {
        likes: likesResult.data,
        reviews: reviewsResult.data,
        ratings: ratingsResult.data,
        bookings: bookingsResult.data,
        submittedArtist: submittedArtistResult.data,
        submittedClub: submittedClubResult.data,
        submittedEvents: submittedEventsResult.data,
      },
      timing: {
        total: totalDuration,
        breakdown: {
          likes: likesResult.timing,
          reviews: reviewsResult.timing,
          ratings: ratingsResult.timing,
          bookings: bookingsResult.timing,
          submittedArtist: submittedArtistResult.timing,
          submittedClub: submittedClubResult.timing,
          submittedEvents: submittedEventsResult.timing,
        },
      },
    });
  } catch (error) {
    const totalDuration = (performance.now() - startTime).toFixed(2);
    console.error(`❌ [UNIFIED-STATISTICS] Failed after ${totalDuration}ms:`, error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
