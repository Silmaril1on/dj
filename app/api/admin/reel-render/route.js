import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import {
  REEL_CODEC,
  REEL_CRF,
  REEL_PIXEL_FORMAT,
} from "@/app/(routes)/administration/commercials/remotion/reelSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMPOSITION_IDS = new Set(["this-week", "this-month"]);

const slugify = (value) =>
  String(value || "soundfolio-reel")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

const getInputProps = ({ reelType, festival, festivals, monthLabel }) => {
  if (reelType === "this-month") {
    return {
      festivals: Array.isArray(festivals) ? festivals : [],
      monthLabel: monthLabel || "",
    };
  }

  return { festival: festival || null };
};

export async function POST(request) {
  let outputLocation;
  let bundleLocation;

  try {
    const body = await request.json();
    const reelType = body?.reelType || "this-week";

    if (!COMPOSITION_IDS.has(reelType)) {
      return Response.json({ error: "Unknown reel type." }, { status: 400 });
    }

    const inputProps = getInputProps({ reelType, ...body });
    const entryPoint = path.join(
      process.cwd(),
      "app",
      "(routes)",
      "administration",
      "commercials",
      "remotion",
      "index.jsx",
    );

    bundleLocation = await fs.mkdtemp(
      path.join(os.tmpdir(), `soundfolio-remotion-${reelType}-`),
    );

    const serveUrl = await bundle({
      entryPoint,
      outDir: bundleLocation,
      rootDir: process.cwd(),
      publicDir: path.join(process.cwd(), "public"),
      ignoreRegisterRootWarning: true,
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            "@": process.cwd(),
          },
        },
      }),
    });

    const composition = await selectComposition({
      serveUrl,
      id: reelType,
      inputProps,
      logLevel: "warn",
    });

    outputLocation = path.join(
      os.tmpdir(),
      `soundfolio-${reelType}-${Date.now()}.mp4`,
    );

    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      codec: REEL_CODEC,
      crf: REEL_CRF,
      pixelFormat: REEL_PIXEL_FORMAT,
      x264Preset: "slow",
      colorSpace: "bt709",
      outputLocation,
      overwrite: true,
      logLevel: "warn",
    });

    const video = await fs.readFile(outputLocation);
    const downloadName = `${slugify(body?.fileName || reelType)}.mp4`;

    return new Response(video, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(video.length),
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[reel-render]", error);

    return Response.json(
      { error: error?.message || "Failed to render reel." },
      { status: 500 },
    );
  } finally {
    if (outputLocation) {
      await fs.unlink(outputLocation).catch(() => {});
    }
    if (bundleLocation) {
      await fs.rm(bundleLocation, { recursive: true, force: true }).catch(() => {});
    }
  }
}
