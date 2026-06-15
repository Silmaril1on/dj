import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import {
  MONTH_FESTIVAL_FRAMES,
  MONTH_GLOBE_REVEAL_FRAME,
  MONTH_INTRO_FRAMES,
  REEL_FPS,
  REEL_HEIGHT,
  REEL_WIDTH,
  SECOND,
  WEEK_REEL_DURATION,
  getMonthDuration,
} from "./reelSettings";

const demoFestival = {
  name: "Tomorrowland",
  country: "Belgium",
  city: "Boom",
  start_date: "2026-07-17",
  end_date: "2026-07-26",
  genre: "Electronic Music",
  artists: [
    "Anyma",
    "Charlotte de Witte",
    "Amelie Lens",
    "Tale Of Us",
    "Kevin de Vries",
    "Armin van Buuren",
    "MRAK",
    "ARTBAT",
  ],
};

const colors = {
  black: "#000000",
  gold: "#fcb913",
  goldDark: "#70520a",
  cream: "#fcf5df",
  chino: "#ccc3a6",
};

const clampInterpolate = (frame, input, output) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const toAsset = (url, fallback = "assets/elivagar-logo.png") => {
  const source = url || fallback;
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  return staticFile(source.replace(/^\/+/, ""));
};

const isImageAsset = (url = "") =>
  /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url);

const formatDateRange = (start, end) => {
  if (!start) return "TBA";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  if (Number.isNaN(startDate.getTime())) return "TBA";

  const startMonth = startDate.toLocaleString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endDay =
    endDate && !Number.isNaN(endDate.getTime()) ? endDate.getDate() : null;
  const endMonth =
    endDate && !Number.isNaN(endDate.getTime())
      ? endDate.toLocaleString("en-US", { month: "short" })
      : startMonth;

  if (!endDay || endDay === startDay) return `${startMonth} ${startDay}`;
  if (endMonth !== startMonth) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }

  return `${startMonth} ${startDay} - ${endDay}`;
};

const fillLineup = (lineup = []) => {
  const artists = Array.isArray(lineup)
    ? lineup
        .map((artist) => String(artist).trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  while (artists.length < 8) artists.push("ADD LINEUP");
  return artists;
};

const buildFestival = (festival) => {
  const source = festival || demoFestival;
  const config = source.reel_config || {};

  return {
    ...demoFestival,
    ...source,
    date: formatDateRange(source.start_date, source.end_date),
    genre: config.custom_text || source.genre || demoFestival.genre,
    assetUrl: config.asset_url || config.video_url || "",
    artists: fillLineup(config.lineup || source.artists),
    extraNote: config.extra_note || "and many more...",
  };
};

const shellStyle = {
  backgroundColor: colors.black,
  color: colors.gold,
  fontFamily: "Teko, Teko Fallback, Impact, sans-serif",
  overflow: "hidden",
};

const secondaryFont = {
  fontFamily: "Jost, Jost Fallback, Arial, sans-serif",
};

const SoundfolioFonts = () => {
  const fontHandle = React.useMemo(
    () => delayRender("Loading Soundfolio reel fonts"),
    [],
  );

  React.useEffect(() => {
    Promise.all([
      document.fonts.load('400 72px "Teko"'),
      document.fonts.load('700 128px "Teko"'),
      document.fonts.load('400 34px "Jost"'),
      document.fonts.load('900 38px "Jost"'),
      document.fonts.ready,
    ])
      .then(() => continueRender(fontHandle))
      .catch(() => continueRender(fontHandle));
  }, [fontHandle]);

  return (
    <style>
      {`
        @font-face {
          font-family: "Jost";
          font-style: normal;
          font-weight: 200 900;
          font-display: block;
          src: url("${staticFile("fonts/soundfolio/jost-cyrillic.woff2")}") format("woff2");
          unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
        }
        @font-face {
          font-family: "Jost";
          font-style: normal;
          font-weight: 200 900;
          font-display: block;
          src: url("${staticFile("fonts/soundfolio/jost-latin-ext.woff2")}") format("woff2");
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        @font-face {
          font-family: "Jost";
          font-style: normal;
          font-weight: 200 900;
          font-display: block;
          src: url("${staticFile("fonts/soundfolio/jost-latin.woff2")}") format("woff2");
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        @font-face {
          font-family: "Teko";
          font-style: normal;
          font-weight: 400 700;
          font-display: block;
          src: url("${staticFile("fonts/soundfolio/teko-devanagari.woff2")}") format("woff2");
          unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF, U+11B00-11B09;
        }
        @font-face {
          font-family: "Teko";
          font-style: normal;
          font-weight: 400 700;
          font-display: block;
          src: url("${staticFile("fonts/soundfolio/teko-latin-ext.woff2")}") format("woff2");
          unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
        }
        @font-face {
          font-family: "Teko";
          font-style: normal;
          font-weight: 400 700;
          font-display: block;
          src: url("${staticFile("fonts/soundfolio/teko-latin.woff2")}") format("woff2");
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        @font-face {
          font-family: "Jost Fallback";
          src: local("Arial");
          ascent-override: 111.45%;
          descent-override: 39.06%;
          line-gap-override: 0%;
          size-adjust: 96.01%;
        }
        @font-face {
          font-family: "Teko Fallback";
          src: local("Arial");
          ascent-override: 146.26%;
          descent-override: 72.52%;
          line-gap-override: 0%;
          size-adjust: 65.50%;
        }
        * {
          font-synthesis: none;
        }
      `}
    </style>
  );
};

const uppercase = {
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const BackgroundAtmosphere = ({ frame }) => {
  const glowScale = clampInterpolate(frame % (15 * SECOND), [0, 450], [1, 1.1]);
  const scanX = clampInterpolate(frame, [0, WEEK_REEL_DURATION], [-360, 1480]);
  const grid = frame % 252;

  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at top, rgba(255,186,0,0.22), transparent 38%), linear-gradient(to bottom, #000, #090705, #000)",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.26 + Math.sin(frame / 34) * 0.08,
          transform: `scale(${glowScale})`,
          background:
            "radial-gradient(circle at center, rgba(255,186,0,0.18), transparent 48%)",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.2,
          backgroundImage:
            "linear-gradient(rgba(255,186,0,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,186,0,.08) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          backgroundPosition: `${grid}px ${grid * 2}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 260,
          height: "100%",
          transform: `translateX(${scanX}px)`,
          background:
            "linear-gradient(90deg, transparent, rgba(252,185,19,0.2), transparent)",
          filter: "blur(38px)",
        }}
      />
    </>
  );
};

const BorderTrace = ({ frame }) => {
  const segment = 3.75 * SECOND;
  const top = clampInterpolate(frame, [0, segment], [0, 100]);
  const right = clampInterpolate(frame, [segment, segment * 2], [0, 100]);
  const bottom = clampInterpolate(frame, [segment * 2, segment * 3], [0, 100]);
  const left = clampInterpolate(frame, [segment * 3, segment * 4], [0, 100]);

  return (
    <AbsoluteFill style={{ zIndex: 50, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: 5,
          width: `${top}%`,
          backgroundColor: colors.goldDark,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 4,
          height: `${right}%`,
          backgroundColor: colors.goldDark,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          height: 4,
          width: `${bottom}%`,
          backgroundColor: colors.goldDark,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: 4,
          height: `${left}%`,
          backgroundColor: colors.goldDark,
        }}
      />
    </AbsoluteFill>
  );
};

const ReelMedia = ({ assetUrl, frame }) => {
  if (!assetUrl) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: 50,
          color: colors.gold,
          textAlign: "center",
          fontSize: 44,
          fontWeight: 900,
          lineHeight: 1,
          ...uppercase,
        }}
      >
        ADD VIDEO OR IMAGE
      </div>
    );
  }

  const src = toAsset(assetUrl);
  const zoom = clampInterpolate(frame, [84, 210], [1.06, 1]);

  if (isImageAsset(assetUrl)) {
    return (
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
        }}
      />
    );
  }

  return (
    <OffthreadVideo
      src={src}
      muted
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};

const WeekFestivalReel = ({ festival }) => {
  const frame = useCurrentFrame();
  const reelFestival = buildFestival(festival);

  const fade = (start, duration = 42) =>
    clampInterpolate(frame, [start, start + duration], [0, 1]);
  const rise = (start, distance = 70) =>
    clampInterpolate(frame, [start, start + 42], [distance, 0]);

  return (
    <AbsoluteFill style={shellStyle}>
      <SoundfolioFonts />
      <Audio src={staticFile("audio/week-intro.mp3")} startFrom={0} />
      <Sequence from={Math.round(5.4 * SECOND)}>
        <Audio src={staticFile("audio/week-lineup.mp3")} />
      </Sequence>
      <BackgroundAtmosphere frame={frame} />
      <BorderTrace frame={frame} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
        }}
      >
        <header
          style={{
            textAlign: "center",
            transform: `translateY(${rise(12, -55)}px)`,
            opacity: fade(12),
          }}
        >
          <p
            style={{
              margin: 0,
              color: "rgba(252,245,223,0.7)",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "0.45em",
              ...secondaryFont,
              textTransform: "uppercase",
            }}
          >
            Soundfolio Presents
          </p>
          <h2
            style={{
              margin: "20px 0 0",
              fontSize: 72,
              lineHeight: 0.9,
              fontWeight: 800,
              ...uppercase,
            }}
          >
            This Week&apos;s Festival
          </h2>
        </header>

        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 520,
              height: 390,
              marginBottom: 78,
              opacity: fade(84),
              transform: `scale(${clampInterpolate(frame, [84, 150], [0.55, 1])}) rotate(${clampInterpolate(frame, [84, 150], [-8, 0])}deg)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -14,
                zIndex: -1,
                background:
                  "linear-gradient(270deg, #f0ce79, #5e4506, #d39804)",
                opacity: 0.5,
                filter: "blur(20px)",
              }}
            />
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                border: `2px solid rgba(252,185,19,0.5)`,
                backgroundColor: colors.black,
              }}
            >
              <ReelMedia assetUrl={reelFestival.assetUrl} frame={frame} />
            </div>
          </div>

          <section
            style={{
              width: "100%",
              textAlign: "center",
              opacity: fade(180),
              transform: `translateY(${rise(180)}px)`,
            }}
          >
            <h1
              style={{
                margin: 0,
                color: colors.gold,
                fontSize: 92,
                lineHeight: 0.9,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              {reelFestival.name}
            </h1>
            <div
              style={{
                marginTop: 22,
                display: "flex",
                justifyContent: "center",
                gap: 20,
                color: colors.cream,
                fontSize: 34,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <span>
                {[reelFestival.city, reelFestival.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              <span style={{ color: "rgba(252,185,19,0.5)" }}>|</span>
              <span style={{ ...secondaryFont, fontSize: 30 }}>
                {reelFestival.date}
              </span>
            </div>
            <p
              style={{
                display: "inline-block",
                margin: "28px 0 0",
                padding: "8px 18px 4px",
                color: colors.black,
                backgroundColor: colors.gold,
                border: `2px solid ${colors.gold}`,
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: "0.35em",
                ...uppercase,
              }}
            >
              {reelFestival.genre}
            </p>
          </section>

          <section
            style={{
              marginTop: 98,
              width: "100%",
              opacity: fade(300),
              transform: `translateY(${rise(300)}px)`,
            }}
          >
            <p
              style={{
                margin: "0 0 28px",
                textAlign: "center",
                color: colors.chino,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "0.45em",
                ...secondaryFont,
                textTransform: "uppercase",
              }}
            >
              Featuring
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
              }}
            >
              {reelFestival.artists.map((artist, index) => {
                const start = 324 + index * 19;
                return (
                  <div
                    key={`${artist}-${index}`}
                    style={{
                      border: `2px solid rgba(252,245,223,0.3)`,
                      backgroundColor: "rgba(252,245,223,0.15)",
                      color: colors.cream,
                      padding: "14px 18px 8px",
                      textAlign: "center",
                      fontSize: 38,
                      lineHeight: 1,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      opacity: fade(start, 28),
                      transform: `translateY(${rise(start, 36)}px)`,
                    }}
                  >
                    {artist}
                  </div>
                );
              })}
            </div>
            <p
              style={{
                margin: "30px 0 0",
                textAlign: "center",
                color: colors.chino,
                fontSize: 24,
                letterSpacing: "0.45em",
                ...secondaryFont,
                textTransform: "uppercase",
                opacity: fade(450),
                transform: `translateY(${rise(450, 36)}px)`,
              }}
            >
              {reelFestival.extraNote}
            </p>
          </section>
        </main>

        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid rgba(252,185,19,0.3)`,
            paddingTop: 48,
            opacity: fade(540),
            transform: `translateY(${rise(540)}px)`,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 38,
                lineHeight: 1,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              Full lineup, ticket info and more on
            </p>
            <p
              style={{
                margin: "14px 0 0",
                color: "rgba(252,245,223,0.8)",
                fontSize: 34,
                letterSpacing: "0.35em",
                ...secondaryFont,
                textTransform: "uppercase",
              }}
            >
              Soundfolio.net
            </p>
          </div>
          <Img
            src={staticFile("assets/elivagar-logo.png")}
            style={{
              width: 120,
              height: 120,
              objectFit: "contain",
              filter: "sepia(1)",
              opacity: fade(630),
              transform: `translateX(${clampInterpolate(frame, [630, 678], [180, 0])}px) rotate(${clampInterpolate(frame, [630, 678], [180, 0])}deg)`,
            }}
          />
        </footer>
      </div>
    </AbsoluteFill>
  );
};

const ProgressDots = ({ festivals, activeIndex }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: 70,
      zIndex: 40,
      display: "flex",
      gap: 14,
      transform: "translateX(-50%)",
    }}
  >
    {festivals.map((festival, index) => (
      <div
        key={`${festival.id || festival.name}-${festival.edition_id || index}`}
        style={{
          width: index === activeIndex ? 76 : 18,
          height: 8,
          backgroundColor:
            index === activeIndex ? colors.gold : "rgba(252,185,19,0.3)",
          transition: "none",
        }}
      />
    ))}
  </div>
);

const MonthIntro = ({ frame }) => {
  const opacity = clampInterpolate(frame, [0, 30, MONTH_INTRO_FRAMES - 28], [0, 1, 1]);
  const exitScale = clampInterpolate(
    frame,
    [MONTH_INTRO_FRAMES - 32, MONTH_INTRO_FRAMES],
    [1, 1.08],
  );
  const exitOpacity = clampInterpolate(
    frame,
    [MONTH_INTRO_FRAMES - 32, MONTH_INTRO_FRAMES],
    [opacity, 0],
  );

  return (
    <AbsoluteFill
      style={{
        zIndex: 50,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.black,
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "rgba(252,245,223,0.8)",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "0.45em",
          ...secondaryFont,
          textTransform: "uppercase",
          transform: `translateY(${clampInterpolate(frame, [0, 42], [48, 0])}px)`,
        }}
      >
        Soundfolio Presents
      </p>
      <h1
        style={{
          margin: "34px 0 0",
          color: colors.gold,
          textAlign: "center",
          fontSize: 128,
          lineHeight: 0.9,
          fontWeight: 900,
          textTransform: "uppercase",
          opacity: clampInterpolate(frame, [20, 56], [0, 1]),
          transform: `scale(${clampInterpolate(frame, [20, 56], [0.8, 1])})`,
        }}
      >
        This Month&apos;s
        <br />
        Festivals
      </h1>
      <div
        style={{
          marginTop: 44,
          height: 4,
          width: clampInterpolate(frame, [60, 94], [0, 520]),
          backgroundColor: colors.gold,
        }}
      />
    </AbsoluteFill>
  );
};

const MonthGlobe = ({ frame, activeFestival }) => {
  const reveal = clampInterpolate(
    frame,
    [MONTH_GLOBE_REVEAL_FRAME, MONTH_GLOBE_REVEAL_FRAME + 54],
    [0, 1],
  );
  const imageUrl = toAsset("globe/earth-night.jpg");
  const rotation = frame * 0.08;
  const pinX = activeFestival?.lng
    ? clampInterpolate(Number(activeFestival.lng), [-180, 180], [170, 910])
    : 540;
  const pinY = activeFestival?.lat
    ? clampInterpolate(Number(activeFestival.lat), [-90, 90], [760, 250])
    : 500;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 285,
        zIndex: 10,
        width: 1000,
        height: 1000,
        opacity: reveal,
        transform: `translateX(-50%) translateY(${clampInterpolate(reveal, [0, 1], [120, 0])}px) scale(${clampInterpolate(reveal, [0, 1], [0.72, 1])})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 70,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(252,185,19,0.12), rgba(0,0,0,0) 68%)",
          boxShadow: "0 0 90px rgba(252,185,19,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 62,
          borderRadius: "50%",
          overflow: "hidden",
          border: "1px solid rgba(252,185,19,0.22)",
          backgroundColor: "#020304",
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: "140%",
            height: "100%",
            objectFit: "cover",
            transform: `translateX(${-210 + Math.sin(rotation / 80) * 34}px) rotate(${rotation * 0.18}deg) scale(1.06)`,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.16), transparent 22%), radial-gradient(circle, transparent 48%, rgba(0,0,0,0.78) 75%)",
          }}
        />
      </div>
      {activeFestival && (
        <div
          style={{
            position: "absolute",
            left: pinX,
            top: pinY,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            transform: `translate(-50%, -100%) scale(${clampInterpolate(frame % MONTH_FESTIVAL_FRAMES, [0, 34], [0, 1])})`,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              overflow: "hidden",
              border: `3px solid ${colors.gold}`,
              backgroundColor: colors.black,
            }}
          >
            <Img
              src={toAsset(activeFestival.image_url || activeFestival.image)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <span
            style={{
              maxWidth: 280,
              padding: "4px 8px 1px",
              backgroundColor: "rgba(0,0,0,0.72)",
              color: colors.cream,
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1.2,
              textAlign: "center",
              whiteSpace: "nowrap",
              ...uppercase,
            }}
          >
            {activeFestival.name}
          </span>
        </div>
      )}
    </div>
  );
};

const MonthFestivalCard = ({ festival, index, localFrame }) => {
  const imageUrl = toAsset(festival.image_url || festival.image);
  const opacity = clampInterpolate(
    localFrame,
    [0, 28, MONTH_FESTIVAL_FRAMES - 26, MONTH_FESTIVAL_FRAMES],
    [0, 1, 1, 0],
  );

  return (
    <div
      style={{
        position: "absolute",
        left: "9%",
        bottom: 158,
        zIndex: 30,
        width: "82%",
        padding: 36,
        border: `2px solid rgba(252,185,19,0.5)`,
        backgroundColor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(12px)",
        opacity,
        transform: `translateY(${clampInterpolate(localFrame, [0, 28], [82, 0])}px) scale(${clampInterpolate(localFrame, [0, 28], [0.92, 1])})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <div
          style={{
            width: 150,
            height: 150,
            overflow: "hidden",
            border: `5px solid ${colors.gold}`,
            backgroundColor: colors.black,
            transform: `rotate(${clampInterpolate(localFrame, [0, 34], [-20, 0])}deg) scale(${clampInterpolate(localFrame, [0, 34], [0, 1])})`,
          }}
        >
          <Img
            src={imageUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              color: "rgba(252,185,19,0.7)",
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "0.35em",
              ...uppercase,
            }}
          >
            Festival #{index + 1}
          </p>
          <h2
            style={{
              margin: "10px 0 0",
              color: colors.gold,
              fontSize: 72,
              lineHeight: 0.92,
              fontWeight: 900,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {festival.name}
          </h2>
          <div
            style={{
              marginTop: 10,
              color: colors.cream,
              fontSize: 34,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {[festival.city, festival.country].filter(Boolean).join(", ")}
          </div>
          <p
            style={{
              margin: "6px 0 0",
              color: colors.gold,
              fontSize: 46,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {formatDateRange(festival.start_date, festival.end_date)}
          </p>
        </div>
      </div>
    </div>
  );
};

const MonthOutro = ({ frame }) => {
  const opacity = clampInterpolate(frame, [0, 36], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        zIndex: 50,
        alignItems: "center",
        justifyContent: "center",
        padding: 90,
        textAlign: "center",
        backgroundColor: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(12px)",
        opacity,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "rgba(252,245,223,0.7)",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "0.45em",
          ...secondaryFont,
          textTransform: "uppercase",
          transform: `translateY(${clampInterpolate(frame, [0, 42], [58, 0])}px)`,
        }}
      >
        Explore More
      </p>
      <h2
        style={{
          margin: "34px 0 0",
          color: colors.gold,
          fontSize: 128,
          lineHeight: 0.9,
          fontWeight: 900,
          textTransform: "uppercase",
          transform: `translateY(${clampInterpolate(frame, [9, 50], [58, 0])}px)`,
        }}
      >
        Discover more
        <br />
        Festivals
      </h2>
      <p
        style={{
          margin: "44px 0 0",
          color: colors.chino,
          fontSize: 36,
          letterSpacing: "0.25em",
          ...secondaryFont,
          textTransform: "uppercase",
        }}
      >
        on Soundfolio
      </p>
      <Img
        src={staticFile("assets/elivagar-logo.png")}
        style={{
          marginTop: 42,
          width: 230,
          height: 230,
          objectFit: "contain",
          filter: "sepia(1)",
          transform: `scale(${clampInterpolate(frame, [30, 64], [0, 1])})`,
        }}
      />
    </AbsoluteFill>
  );
};

const MonthFestivalReel = ({ festivals = [], monthLabel = "" }) => {
  const frame = useCurrentFrame();
  const reelFestivals = Array.isArray(festivals) ? festivals : [];
  const playableFestivals = reelFestivals.length ? reelFestivals : [];
  const festivalFrame = Math.max(0, frame - MONTH_INTRO_FRAMES);
  const activeIndex = Math.min(
    playableFestivals.length - 1,
    Math.floor(festivalFrame / MONTH_FESTIVAL_FRAMES),
  );
  const activeFestival = playableFestivals[activeIndex];
  const activeLocalFrame = festivalFrame - activeIndex * MONTH_FESTIVAL_FRAMES;
  const outroStart =
    MONTH_INTRO_FRAMES +
    Math.max(1, playableFestivals.length) * MONTH_FESTIVAL_FRAMES +
    Math.round(1.4 * SECOND);
  const showIntro = frame < MONTH_INTRO_FRAMES;
  const showOutro = frame >= outroStart;

  return (
    <AbsoluteFill style={{ ...shellStyle, color: colors.cream }}>
      <SoundfolioFonts />
      <Audio src={staticFile("audio/month-intro.mp3")} />
      {playableFestivals.map((festival, index) => (
        <Sequence
          key={`${festival.id || festival.name}-${festival.edition_id || index}-audio`}
          from={MONTH_INTRO_FRAMES + index * MONTH_FESTIVAL_FRAMES}
          durationInFrames={MONTH_FESTIVAL_FRAMES}
        >
          <Audio src={staticFile("audio/monthly-listing.mp3")} />
        </Sequence>
      ))}
      <Sequence from={outroStart}>
        <Audio src={staticFile("audio/week-intro.mp3")} />
      </Sequence>

      <BackgroundAtmosphere frame={frame} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 84,
          zIndex: 20,
          textAlign: "center",
          opacity: clampInterpolate(
            frame,
            [MONTH_GLOBE_REVEAL_FRAME, MONTH_GLOBE_REVEAL_FRAME + 34],
            [0, 1],
          ),
          transform: `translateY(${clampInterpolate(frame, [MONTH_GLOBE_REVEAL_FRAME, MONTH_GLOBE_REVEAL_FRAME + 34], [-58, 0])}px)`,
        }}
      >
        <p
          style={{
            margin: 0,
            color: colors.chino,
            fontSize: 30,
            letterSpacing: "0.45em",
            ...secondaryFont,
            textTransform: "uppercase",
          }}
        >
          Soundfolio Radar
        </p>
        <h2
          style={{
            margin: "18px 0 0",
            color: colors.gold,
            fontSize: 76,
            lineHeight: 0.9,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {monthLabel}
        </h2>
      </div>

      {!playableFestivals.length && (
        <AbsoluteFill
          style={{
            zIndex: 60,
            alignItems: "center",
            justifyContent: "center",
            padding: 120,
            textAlign: "center",
            backgroundColor: colors.black,
          }}
        >
          <p
            style={{
              color: colors.chino,
              fontSize: 34,
              letterSpacing: "0.35em",
              ...secondaryFont,
              textTransform: "uppercase",
            }}
          >
            No festivals found for this reel.
          </p>
        </AbsoluteFill>
      )}

      <MonthGlobe frame={frame} activeFestival={activeFestival} />
      {!showIntro && !showOutro && activeFestival && (
        <MonthFestivalCard
          festival={activeFestival}
          index={activeIndex}
          localFrame={activeLocalFrame}
        />
      )}
      <ProgressDots festivals={playableFestivals} activeIndex={activeIndex} />
      {showIntro && <MonthIntro frame={frame} />}
      {showOutro && <MonthOutro frame={frame - outroStart} />}
    </AbsoluteFill>
  );
};

export const CommercialReelRoot = () => (
  <>
    <Composition
      id="this-week"
      component={WeekFestivalReel}
      fps={REEL_FPS}
      width={REEL_WIDTH}
      height={REEL_HEIGHT}
      durationInFrames={WEEK_REEL_DURATION}
      defaultProps={{ festival: demoFestival }}
    />
    <Composition
      id="this-month"
      component={MonthFestivalReel}
      fps={REEL_FPS}
      width={REEL_WIDTH}
      height={REEL_HEIGHT}
      durationInFrames={getMonthDuration(1)}
      defaultProps={{ festivals: [demoFestival], monthLabel: "This Month" }}
      calculateMetadata={({ props }) => ({
        durationInFrames: getMonthDuration(props.festivals?.length || 0),
      })}
    />
  </>
);
