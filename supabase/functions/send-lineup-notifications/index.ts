import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Subscription = { user_id: string };
type UserRow = {
  id: string;
  email: string;
  userName: string | null;
};
type FestivalRow = { name: string; festival_slug: string };

/**
 * Mirror of app/emails/EmailTemplate.jsx — same dark design, self-contained
 * so the Deno edge function has no dependency on the Next.js app directory.
 */
function buildEmailHtml(
  userName: string,
  festivalName: string,
  phaseName: string,
  festivalUrl: string,
): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${festivalName} just dropped their ${phaseName} lineup!</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0d0d0d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background-color:#111111;max-width:600px;border:1px solid #222;">

          <!-- Header -->
          <tr>
            <td style="background-color:#000000;padding:28px 32px;text-align:center;">
              <h1 style="color:#fcb913;margin:0;font-size:26px;letter-spacing:2px;text-transform:uppercase;">
                SoundFolio
              </h1>
            </td>
          </tr>

          <!-- Gold accent bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#fcb913,#e09d00);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">

              <p style="text-align:center;margin:0 0 24px;">
                <span style="display:inline-block;background:#1a1600;border:1px solid #fcb913;
                  color:#fcb913;font-size:11px;letter-spacing:3px;text-transform:uppercase;
                  padding:6px 18px;">
                  Lineup Alert
                </span>
              </p>

              <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;
                text-transform:uppercase;letter-spacing:1px;">
                ${festivalName}
              </h2>
              <p style="color:#fcb913;font-size:15px;text-align:center;margin:0 0 28px;
                text-transform:uppercase;letter-spacing:2px;">
                ${phaseName} is here
              </p>

              <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hey <strong style="color:#fff;">${userName}</strong>,
              </p>
              <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 32px;">
                Good news &#8212; <strong style="color:#fff;">${festivalName}</strong> has just
                published their <strong style="color:#fcb913;">${phaseName}</strong> lineup.
                Head over to their page to see who's playing.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${festivalUrl}"
                      style="display:inline-block;padding:14px 44px;background-color:#fcb913;
                      color:#000000;text-decoration:none;font-weight:bold;font-size:14px;
                      letter-spacing:1px;text-transform:uppercase;">
                      View Lineup &#8594;
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #222;margin:0 0 20px;" />

              <p style="color:#555;font-size:11px;text-align:center;margin:0 0 16px;line-height:1.6;">
                You're receiving this because you set up a lineup alert for this festival on SoundFolio.
                You can cancel your alert at any time from the festival page.
              </p>
              <p style="color:#555;font-size:11px;text-align:center;margin:0;line-height:1.6;">
                SoundFolio &#8212; The music community platform.<br/>
                &copy; ${year} SoundFolio. All rights reserved.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#000;padding:16px 32px;text-align:center;">
              <p style="color:#444;font-size:11px;margin:0;letter-spacing:1px;text-transform:uppercase;">
                Discover DJs, Artists &amp; Book Amazing Talents
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://soundfolio.net";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { festivalId, phaseName } = (await req.json()) as {
      festivalId: string;
      phaseName: string;
    };

    if (!festivalId || !phaseName) {
      return new Response(
        JSON.stringify({ error: "festivalId and phaseName are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Fetch festival details
    const { data: festival, error: festivalError } = await supabase
      .from("festivals")
      .select("name, festival_slug")
      .eq("id", festivalId)
      .single<FestivalRow>();

    if (festivalError || !festival) {
      return new Response(JSON.stringify({ error: "Festival not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active lineup subscriptions for this festival
    const { data: subscriptions, error: subError } = await supabase
      .from("notification_subscriptions")
      .select("user_id")
      .eq("entity_type", "festival")
      .eq("entity_id", festivalId)
      .eq("notification_type", "lineup_phase_drop")
      .eq("status", "active");

    if (subError) {
      console.error(
        "[send-lineup-notifications] Subscriptions fetch error:",
        subError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: "No active subscribers",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userIds = (subscriptions as Subscription[]).map((s) => s.user_id);

    // Fetch user emails + names
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, userName")
      .in("id", userIds);

    if (usersError || !users || users.length === 0) {
      console.error(
        "[send-lineup-notifications] Users fetch error:",
        usersError,
      );
      return new Response(
        JSON.stringify({ error: "Failed to fetch user data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const festivalUrl = `${siteUrl}/festivals/${festival.festival_slug}`;
    const subject = `${festival.name} — ${phaseName} lineup is live!`;

    // Send in batches of 8 to respect Resend rate limits
    const BATCH_SIZE = 8;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < (users as UserRow[]).length; i += BATCH_SIZE) {
      const batch = (users as UserRow[]).slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (u) => {
          if (!u.email) return;
          const userName = u.userName || "Music Lover";
          const html = buildEmailHtml(
            userName,
            festival.name,
            phaseName,
            festivalUrl,
          );

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "SoundFolio <hello@updates.soundfolio.net>",
              to: u.email,
              subject,
              html,
            }),
          });

          if (res.ok) {
            sent++;
          } else {
            failed++;
            const errBody = await res.text();
            console.error(
              `[send-lineup-notifications] Email failed for ${u.id}:`,
              errBody,
            );
          }
        }),
      );
    }

    return new Response(JSON.stringify({ success: true, sent, failed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-lineup-notifications] Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
