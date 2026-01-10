import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mbid = searchParams.get("mbid"); // MusicBrainz ID

    if (!mbid) {
      return NextResponse.json(
        { success: false, error: "MusicBrainz ID is required" },
        { status: 400 }
      );
    }

    // Fetch artist info from MusicBrainz with comprehensive includes
    const mbUrl = `https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels+genres+aliases+tags+ratings+annotation&fmt=json`;

    console.log("🎵 Fetching MusicBrainz artist:", mbid);

    const response = await fetch(mbUrl, {
      headers: {
        "User-Agent": "Soundfolio/1.0 (contact@soundfolio.com)",
      },
    });

    if (!response.ok) {
      console.error("❌ MusicBrainz API error:", response.status);
      return NextResponse.json(
        { success: false, error: "Failed to fetch from MusicBrainz" },
        { status: response.status }
      );
    }

    const artistData = await response.json();
    console.log(
      "📦 Full MusicBrainz artist data:",
      JSON.stringify(artistData, null, 2)
    );

    // Extract legal name from aliases first
    let legalName = null;
    if (artistData.aliases) {
      const legalNameAlias = artistData.aliases.find(
        (alias) =>
          alias.type === "Legal name" ||
          alias.type === "Birth name" ||
          alias["type-id"] === "d4dcd0c0-b341-3612-a332-c0ce797b25cf"
      );
      if (legalNameAlias) {
        legalName = legalNameAlias.name;
      }
    }

    // Extract relevant information
    const basicInfo = {
      mbid: artistData.id,
      // Name logic: if legalName exists, use it for 'name', otherwise use artist name
      name: legalName || artistData.name,
      // Stage name logic: if legalName exists, artist name is stage name, otherwise null
      stageName: legalName ? artistData.name : null,
      legalName: legalName, // Keep for reference
      sortName: artistData["sort-name"],
      type: artistData.type,
      gender: artistData.gender || null,
      disambiguation: artistData.disambiguation || null,

      // Birth information
      birthDate: artistData["life-span"]?.begin || null,
      birthPlace: null,
      birthCity: null,
      birthCountry: null,

      // Death information (if applicable)
      deathDate: artistData["life-span"]?.end || null,
      ended: artistData["life-span"]?.ended || false,

      // Area information
      area: artistData.area?.name || null,
      areaId: artistData.area?.id || null,
      beginArea: artistData["begin-area"]?.name || null,
      beginAreaId: artistData["begin-area"]?.id || null,
      endArea: artistData["end-area"]?.name || null,

      // Country - MusicBrainz provides full country name
      country: artistData.country || artistData.area?.name || null,

      // Genres and Tags
      genres: artistData.genres?.map((g) => g.name) || [],
      tags:
        artistData.tags?.map((t) => ({
          name: t.name,
          count: t.count || 0,
        })) || [],

      // Ratings
      rating: artistData.rating?.value || null,
      ratingCount: artistData.rating?.["votes-count"] || 0,

      // Annotation/Biography
      annotation: artistData.annotation || null,

      // External links
      externalLinks: {},

      // Artist image (will be populated from relationships)
      artistImage: null,
    };

    // Parse birth place (MusicBrainz doesn't provide detailed birth place in this endpoint)
    // We'll need to make an additional call if needed
    if (artistData["begin-area"]) {
      try {
        const areaResponse = await fetch(
          `https://musicbrainz.org/ws/2/area/${artistData["begin-area"].id}?fmt=json`,
          {
            headers: {
              "User-Agent": "Soundfolio/1.0 (contact@soundfolio.com)",
            },
          }
        );

        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          basicInfo.birthCity = areaData.name;

          // Try to get country from area hierarchy
          if (
            areaData["iso-3166-1-codes"] &&
            areaData["iso-3166-1-codes"].length > 0
          ) {
            basicInfo.birthCountry = areaData.name;
          }
        }
      } catch (err) {
        console.error("Error fetching area details:", err);
      }
    }

    // Parse external links (URLs) and images
    if (artistData.relations) {
      artistData.relations.forEach((rel) => {
        const url = rel.url?.resource;
        if (!url) return;

        // Artist images from various sources
        if (
          rel.type === "image" ||
          url.includes("wikimedia") ||
          url.includes("commons.wikimedia")
        ) {
          if (!basicInfo.artistImage) {
            basicInfo.artistImage = url;
          }
        }
        // Instagram
        else if (url.includes("instagram.com")) {
          basicInfo.externalLinks.instagram = url;
        }
        // Facebook
        else if (url.includes("facebook.com")) {
          basicInfo.externalLinks.facebook = url;
        }
        // Twitter/X
        else if (url.includes("twitter.com") || url.includes("x.com")) {
          basicInfo.externalLinks.twitter = url;
        }
        // SoundCloud
        else if (url.includes("soundcloud.com")) {
          basicInfo.externalLinks.soundcloud = url;
        }
        // Spotify
        else if (url.includes("spotify.com")) {
          basicInfo.externalLinks.spotify = url;
        }
        // Apple Music
        else if (url.includes("music.apple.com")) {
          basicInfo.externalLinks.appleMusic = url;
        }
        // Resident Advisor
        else if (url.includes("residentadvisor.net")) {
          basicInfo.externalLinks.residentAdvisor = url;
        }
        // Beatport
        else if (url.includes("beatport.com")) {
          basicInfo.externalLinks.beatport = url;
        }
        // YouTube
        else if (url.includes("youtube.com") || url.includes("youtu.be")) {
          basicInfo.externalLinks.youtube = url;
        }
        // Discogs
        else if (url.includes("discogs.com")) {
          basicInfo.externalLinks.discogs = url;
        }
        // Wikipedia
        else if (url.includes("wikipedia.org")) {
          basicInfo.externalLinks.wikipedia = url;
        }
        // Wikidata
        else if (url.includes("wikidata.org")) {
          basicInfo.externalLinks.wikidata = url;
        }
        // Official homepage
        else if (rel.type === "official homepage") {
          basicInfo.externalLinks.homepage = url;
        }
      });
    }

    console.log("✅ Processed artist info:", basicInfo.name);

    return NextResponse.json({
      success: true,
      data: basicInfo,
    });
  } catch (error) {
    console.error("Error fetching artist basic info:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
