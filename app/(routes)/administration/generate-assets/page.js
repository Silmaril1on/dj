"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiVideo,
  FiImage,
  FiDownload,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiStar,
  FiX,
  FiUpload,
} from "react-icons/fi";
import { MdCheck, MdEdit } from "react-icons/md";
import Button from "@/app/components/buttons/Button";
import { FaPhotoFilm } from "react-icons/fa6";
import { FaFile, FaFileVideo } from "react-icons/fa";

// ── Model catalogue ─────────────────────────────────────────────────────────

const VIDEO_MODELS = [
  {
    id: "seedance-1-5-pro-251215",
    name: "Seedance 1.5 Pro",
    badge: "Latest",
    badgeColor: "bg-violet text-white",
    tasks: ["t2v", "i2v"],
    resolutions: ["480p", "720p", "1080p"],
    defaultResolution: "720p",
    duration: { min: 4, max: 12, default: 5 },
    fps: 24,
    pricing: {
      "Video w/ audio": "$2.4 / M tokens",
      "Video w/o audio": "$1.2 / M tokens",
    },
    concurrent: 10,
    rpm: 600,
    description:
      "Highest quality Seedance model with audio support. Best for premium final renders.",
    icon: FiStar,
  },
  {
    id: "seedance-1-0-pro-fast-251015",
    name: "Seedance 1.0 Pro Fast",
    badge: "Fast",
    badgeColor: "bg-green text-black",
    tasks: ["t2v", "i2v"],
    resolutions: ["480p", "720p", "1080p"],
    defaultResolution: "1080p",
    duration: { min: 4, max: 10, default: 5 },
    fps: 24,
    pricing: {
      "Image-to-video": "$1.0 / M tokens",
      "Text-to-video": "$1.0 / M tokens",
    },
    concurrent: 10,
    rpm: 600,
    description:
      "Fast generation with good quality. Ideal for drafts, previews, and quick iterations.",
    icon: FiZap,
  },
  {
    id: "seedance-1-0-pro-250528",
    name: "Seedance 1.0 Pro",
    badge: "Stable",
    badgeColor: "bg-gold text-black",
    tasks: ["t2v", "i2v"],
    resolutions: ["480p", "720p", "1080p"],
    defaultResolution: "1080p",
    duration: { min: 4, max: 10, default: 5 },
    fps: 24,
    pricing: {
      "Image-to-video": "$1.0 / M tokens",
      "Text-to-video": "$1.0 / M tokens",
    },
    concurrent: 10,
    rpm: 600,
    description:
      "Reliable and well-tested. Great balance of quality and stability for production use.",
    icon: FiCheckCircle,
  },
];

const IMAGE_MODELS = [
  {
    id: "seedream-4-0-250828",
    name: "Seedream 4.0",
    badge: "Stable",
    badgeColor: "bg-gold text-black",
    tasks: ["t2i", "i2i"],
    sizes: ["512x512", "1K", "2K"],
    defaultSize: "2K",
    pricing: {
      "Text-to-image": "$0.03 / piece",
      "Image-to-image": "$0.03 / piece",
    },
    ipm: 500,
    description:
      "High quality image generation. Excellent for detailed and cinematic visuals.",
    icon: FiCheckCircle,
  },
  {
    id: "seedream-4-5-251128",
    name: "Seedream 4.5",
    badge: "Latest",
    badgeColor: "bg-violet text-white",
    tasks: ["t2i", "i2i"],
    sizes: ["512x512", "1K", "2K"],
    defaultSize: "2K",
    pricing: {
      "Text-to-image": "$0.04 / piece",
      "Image-to-image": "$0.04 / piece",
    },
    ipm: 500,
    description:
      "Latest Seedream model with enhanced detail and quality over 4.0.",
    icon: FiStar,
  },
];

const TASK_LABELS = {
  t2v: "Text → Video",
  i2v: "Image → Video",
  t2i: "Text → Image",
  i2i: "Image → Image",
};

const POLL_INTERVAL = 5000;

const BASE64_MIME_MAP = [
  { prefix: "/9j/", mime: "image/jpeg" },
  { prefix: "iVBORw0KGgo", mime: "image/png" },
  { prefix: "R0lGOD", mime: "image/gif" },
  { prefix: "UklGR", mime: "image/webp" },
];

const resolveImageSrc = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (typeof item.url === "string") return item.url;
  if (typeof item.url?.url === "string") return item.url.url;

  const b64 = typeof item.b64_json === "string" ? item.b64_json.trim() : "";
  if (!b64) return null;
  if (b64.startsWith("data:")) return b64;

  const match = BASE64_MIME_MAP.find((entry) => b64.startsWith(entry.prefix));
  const mime = match ? match.mime : "image/png";
  return `data:${mime};base64,${b64}`;
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    queued: { color: "text-gold", Icon: FiClock, label: "Queued" },
    running: {
      color: "text-green",
      Icon: FiLoader,
      label: "Generating…",
      spin: true,
    },
    succeed: { color: "text-green", Icon: FiCheckCircle, label: "Done" },
    failed: { color: "text-crimson", Icon: FiAlertCircle, label: "Failed" },
  };
  const s = map[status] || map.queued;
  return (
    <span
      className={`flex items-center gap-1 text-sm font-semibold ${s.color}`}
    >
      <s.Icon size={14} className={s.spin ? "animate-spin" : ""} />
      {s.label}
    </span>
  );
}

function ModelCard({ model, selected, onClick, type }) {
  return (
    <button
      onClick={onClick}
      className={`text-left w-full p-4 border transition-all duration-200 ${
        selected
          ? "border-gold/50 bg-gold/10"
          : "border-gold/20 bg-neutral-900 hover:border-gold/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <model.icon size={15} className="text-gold mt-0.5 shrink-0" />
          <span className="text-cream font-bold text-sm">{model.name}</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${model.badgeColor}`}
        >
          {model.badge}
        </span>
      </div>

      <p className="text-gold/60 text-xs mb-3 leading-relaxed">
        {model.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-2">
        {model.tasks.map((t) => (
          <span
            key={t}
            className="text-[10px] border border-gold/30 text-gold px-1.5 py-0.5"
          >
            {TASK_LABELS[t]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-gold/50 mt-2">
        {type === "video" && (
          <>
            <span>Res: {model.resolutions.join(" · ")}</span>
            <span>FPS: {model.fps}</span>
            <span>
              Duration: {model.duration.min}–{model.duration.max}s
            </span>
            <span>RPM: {model.rpm}</span>
          </>
        )}
        {type === "image" && (
          <>
            <span>Sizes: {model.sizes.join(" · ")}</span>
            <span>IPM: {model.ipm}</span>
          </>
        )}
        {Object.entries(model.pricing).map(([label, price]) => (
          <span key={label} className="col-span-2">
            {label}: <span className="text-gold/80">{price}</span>
          </span>
        ))}
      </div>

      <div className="mt-2 text-[9px] text-gold/30 font-mono break-all">
        {model.id}
      </div>
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function GenerateAssetsPage() {
  const [category, setCategory] = useState("video");

  // ── Video state ──────────────────────────────────────────────────────────
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0]);
  const [videoTask, setVideoTask] = useState("t2v");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoImageFile, setVideoImageFile] = useState(null);
  const [videoImagePreview, setVideoImagePreview] = useState(null);
  const [videoResolution, setVideoResolution] = useState(
    VIDEO_MODELS[0].defaultResolution,
  );
  const [videoDuration, setVideoDuration] = useState(
    VIDEO_MODELS[0].duration.default,
  );
  const [videoCameraFixed, setVideoCameraFixed] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoResults, setVideoResults] = useState([]);
  const [videoError, setVideoError] = useState("");

  // ── Image state ──────────────────────────────────────────────────────────
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0]);
  const [imageTask, setImageTask] = useState("t2i");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageFiles, setImageFiles] = useState([null]);
  const [imagePreviews, setImagePreviews] = useState([null]);
  const [imageSize, setImageSize] = useState(IMAGE_MODELS[0].defaultSize);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResults, setImageResults] = useState([]);
  const [imageError, setImageError] = useState("");

  const pollingRef = useRef({});
  const videoFileRef = useRef(null);
  const imageFileRefs = useRef([]);

  // Sync defaults when video model changes
  useEffect(() => {
    setVideoResolution(videoModel.defaultResolution);
    setVideoDuration(videoModel.duration.default);
    if (!videoModel.tasks.includes(videoTask))
      setVideoTask(videoModel.tasks[0]);
  }, [videoModel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync defaults when image model changes
  useEffect(() => {
    setImageSize(imageModel.defaultSize);
    if (!imageModel.tasks.includes(imageTask))
      setImageTask(imageModel.tasks[0]);
  }, [imageModel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup polling intervals and object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRef.current).forEach(clearInterval);
      if (videoImagePreview) URL.revokeObjectURL(videoImagePreview);
      imagePreviews.forEach((p) => p && URL.revokeObjectURL(p));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image upload helpers ─────────────────────────────────────────────────
  const setVideoFile = (file) => {
    if (videoImagePreview) URL.revokeObjectURL(videoImagePreview);
    setVideoImageFile(file);
    setVideoImagePreview(URL.createObjectURL(file));
  };

  const setImageFileAt = (i, file) => {
    const preview = URL.createObjectURL(file);
    setImageFiles((prev) => prev.map((f, idx) => (idx === i ? file : f)));
    setImagePreviews((prev) => {
      if (prev[i]) URL.revokeObjectURL(prev[i]);
      return prev.map((p, idx) => (idx === i ? preview : p));
    });
  };

  const addImageSlot = () => {
    if (imageFiles.length < 4) {
      setImageFiles((prev) => [...prev, null]);
      setImagePreviews((prev) => [...prev, null]);
    }
  };

  const removeImageSlot = (i) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => {
      if (prev[i]) URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const uploadFileToStorage = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/byteplus/upload", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  };

  // ── Video task polling ───────────────────────────────────────────────────
  const pollVideoTask = useCallback((taskId, resultId) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/admin/byteplus/video/status?taskId=${taskId}`,
        );
        const data = await res.json();
        const status = data?.status;

        setVideoResults((prev) =>
          prev.map((item) =>
            item.id === resultId
              ? {
                  ...item,
                  status,
                  url:
                    data?.content?.[0]?.video_url ||
                    data?.content?.[0]?.url ||
                    item.url,
                  apiError: data?.error?.message || "",
                }
              : item,
          ),
        );

        if (status === "succeed" || status === "failed") {
          clearInterval(intervalId);
          delete pollingRef.current[taskId];
        }
      } catch {
        // keep polling on transient network errors
      }
    }, POLL_INTERVAL);

    pollingRef.current[taskId] = intervalId;
  }, []);

  // ── Generate video ───────────────────────────────────────────────────────
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return setVideoError("Prompt is required.");
    if (videoTask === "i2v" && !videoImageFile)
      return setVideoError("Source image is required for Image → Video.");
    setVideoError("");
    setVideoLoading(true);

    try {
      let imageUrl = undefined;
      if (videoTask === "i2v" && videoImageFile) {
        try {
          imageUrl = await uploadFileToStorage(videoImageFile);
        } catch (err) {
          setVideoError(err.message || "Image upload failed.");
          setVideoLoading(false);
          return;
        }
      }

      const res = await fetch("/api/admin/byteplus/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: videoModel.id,
          prompt: videoPrompt,
          imageUrl,
          resolution: videoResolution,
          duration: videoDuration,
          cameraFixed: videoCameraFixed,
          taskType: videoTask,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVideoError(data.error || "Generation failed.");
      } else {
        const taskId = data.id || data.task_id;
        const resultId = String(Date.now());
        setVideoResults((prev) => [
          {
            id: resultId,
            taskId,
            model: videoModel.name,
            taskType: videoTask,
            prompt: videoPrompt,
            status: data.status || "queued",
            url: "",
            apiError: "",
            createdAt: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        if (taskId) pollVideoTask(taskId, resultId);
      }
    } catch {
      setVideoError("Network error. Please try again.");
    } finally {
      setVideoLoading(false);
    }
  };

  // ── Generate image ───────────────────────────────────────────────────────
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return setImageError("Prompt is required.");
    const filledFiles = imageFiles.filter(Boolean);
    if (imageTask === "i2i" && filledFiles.length === 0)
      return setImageError("At least one image is required for Image → Image.");
    setImageError("");
    setImageLoading(true);

    try {
      let uploadedUrls = [];
      if (imageTask === "i2i" && filledFiles.length > 0) {
        try {
          uploadedUrls = await Promise.all(
            filledFiles.map((file) => uploadFileToStorage(file)),
          );
        } catch (err) {
          setImageError(err.message || "Image upload failed.");
          setImageLoading(false);
          return;
        }
      }

      const res = await fetch("/api/admin/byteplus/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: imageModel.id,
          prompt: imagePrompt,
          images: imageTask === "i2i" ? uploadedUrls : undefined,
          size: imageSize,
          watermark: false,
          taskType: imageTask,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImageError(data.error || "Generation failed.");
      } else {
        const rawImages = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
            ? data.data.data
            : Array.isArray(data?.data?.outputs)
              ? data.data.outputs
              : Array.isArray(data?.images)
                ? data.images
                : [];
        const urls = rawImages.map(resolveImageSrc).filter(Boolean);
        setImageResults((prev) => [
          {
            id: String(Date.now()),
            model: imageModel.name,
            taskType: imageTask,
            prompt: imagePrompt,
            urls,
            createdAt: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      }
    } catch {
      setImageError("Network error. Please try again.");
    } finally {
      setImageLoading(false);
    }
  };

  // ── Download helper ──────────────────────────────────────────────────────
  const downloadAsset = async (url, filename) => {
    if (url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      return;
    }
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-cream primary mb-1">
          AI Asset Generator
        </h1>
        <p className="text-gold/80 text-sm secondary">
          BytePlus · Seedance (video) &amp; Seedream (image) — 5 activated
          models
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-8">
        <Button
          onClick={() => setCategory("video")}
          icon={<FiVideo size={16} />}
          text="Video — Seedance (3 models)"
          className={category !== "video" ? "opacity-50" : ""}
        />
        <Button
          onClick={() => setCategory("image")}
          icon={<FiImage size={16} />}
          text="Image — Seedream (2 models)"
          className={category !== "image" ? "opacity-50" : ""}
        />
      </div>

      {/* ── VIDEO SECTION ─────────────────────────────────────────────────── */}
      {category === "video" && (
        <div className="grid gap-3 items-start">
          {/* Left: Model selector + Form */}
          <div className="space-y-3">
            {/* Model cards */}
            <div>
              <h2 className="text-xs font-bold text-gold/50 uppercase tracking-widest">
                Select Video Model
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {VIDEO_MODELS.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    type="video"
                    selected={videoModel.id === m.id}
                    onClick={() => setVideoModel(m)}
                  />
                ))}
              </div>
            </div>

            {/* Form */}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-900 border border-gold/20 p-6 space-y-5">
                <h2 className="text-sm font-bold text-gold uppercase tracking-widest">
                  Generation Settings — {videoModel.name}
                </h2>

                {/* Task type */}
                <div>
                  <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                    Task Type
                  </label>
                  <div className="flex gap-2">
                    {videoModel.tasks.map((t) => (
                      <Button
                        key={t}
                        onClick={() => setVideoTask(t)}
                        text={TASK_LABELS[t]}
                        className={videoTask !== t ? "opacity-40" : ""}
                      />
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                    Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="Describe the video you want to generate…"
                    className="w-full"
                  />
                </div>

                {/* Image upload — i2v only */}
                {videoTask === "i2v" && (
                  <div>
                    <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                      Source Image
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 overflow-hidden bg-stone-800 border-2 border-gold/30 shrink-0">
                        {videoImagePreview ? (
                          <img
                            src={videoImagePreview}
                            alt="Source"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiImage size={24} className="text-gold/30" />
                          </div>
                        )}
                        {videoImageFile && (
                          <button
                            type="button"
                            onClick={() => {
                              if (videoImagePreview)
                                URL.revokeObjectURL(videoImagePreview);
                              setVideoImageFile(null);
                              setVideoImagePreview(null);
                            }}
                            className="absolute top-0 right-0 bg-red-600/80 text-white p-0.5"
                          >
                            <FiX size={10} />
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => videoFileRef.current?.click()}
                          className="px-2 py-1 bg-gold/30 text-gold border border-gold/30 flex items-center gap-2 text-xs font-bold hover:bg-gold/50 transition-colors"
                        >
                          <FiUpload size={14} />
                          {videoImageFile ? "Change Image" : "Upload Image"}
                        </button>
                        <p className="text-xs text-gold/40 mt-1">
                          PNG, JPG, WEBP — max 10 MB
                        </p>
                      </div>
                      <input
                        ref={videoFileRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f) setVideoFile(f);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Settings row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                  {/* Resolution */}
                  <div>
                    <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                      Resolution
                    </label>
                    <select
                      value={videoResolution}
                      onChange={(e) => setVideoResolution(e.target.value)}
                      className="w-full"
                    >
                      {videoModel.resolutions.map((r) => (
                        <option key={r} value={r}>
                          {r.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration slider with gauge */}
                  <div>
                    <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                      Duration: {videoDuration}s
                    </label>
                    <div className="relative flex items-center h-5">
                      <div className="absolute inset-x-0 h-1 bg-gold/15 rounded-full pointer-events-none" />
                      <div
                        className="absolute left-0 h-1 bg-gold rounded-full pointer-events-none transition-all"
                        style={{
                          width: `${
                            ((videoDuration - videoModel.duration.min) /
                              (videoModel.duration.max -
                                videoModel.duration.min)) *
                            100
                          }%`,
                        }}
                      />
                      <input
                        type="range"
                        min={videoModel.duration.min}
                        max={videoModel.duration.max}
                        step={1}
                        value={videoDuration}
                        onChange={(e) =>
                          setVideoDuration(Number(e.target.value))
                        }
                        className="w-full relative z-10 bg-transparent border-0 p-0 appearance-none [&::-webkit-slider-runnable-track]:opacity-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(252,185,19,0.7)] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gold [&::-moz-range-thumb]:border-0 [&::-moz-range-track]:opacity-0"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gold/40 mt-0.5">
                      <span>{videoModel.duration.min}s</span>
                      <span>{videoModel.duration.max}s</span>
                    </div>
                  </div>

                  {/* Camera fixed */}
                  <div className="pt-2">
                    <input
                      id="cameraFixed"
                      type="checkbox"
                      checked={videoCameraFixed}
                      onChange={(e) => setVideoCameraFixed(e.target.checked)}
                      className="sr-only"
                    />
                    <label
                      htmlFor="cameraFixed"
                      className="inline-flex items-center gap-2 cursor-pointer select-none"
                    >
                      <span
                        className={`relative flex h-5 w-5 items-center justify-center border transition-colors ${
                          videoCameraFixed
                            ? "border-gold bg-gold/25"
                            : "border-cream/45 bg-black/40"
                        }`}
                      >
                        <MdCheck
                          className={`h-4 w-4 text-gold transition-opacity ${
                            videoCameraFixed ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </span>
                      <span className="text-xs text-cream/90">
                        Camera Fixed
                      </span>
                    </label>
                  </div>
                </div>

                {/* Error */}
                {videoError && (
                  <div className="flex items-center gap-2 text-crimson text-sm">
                    <FiAlertCircle size={14} />
                    {videoError}
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerateVideo}
                  disabled={videoLoading}
                  loading={videoLoading}
                  icon={<FiVideo size={16} />}
                  text={videoLoading ? "Submitting Task…" : "Generate Video"}
                />
              </div>
              <div>
                {videoResults.length > 0 ? (
                  <div>
                    <h2 className="text-xs font-bold text-gold/50 uppercase tracking-widest mb-3">
                      Generated Videos
                    </h2>
                    <div className="space-y-4">
                      {videoResults.map((item) => (
                        <div
                          key={item.id}
                          className="bg-neutral-900 border border-gold/20 p-4"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                            <div>
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <span className="text-gold font-bold text-sm">
                                  {item.model}
                                </span>
                                <span className="text-[10px] border border-gold/30 text-gold px-1.5 py-0.5">
                                  {TASK_LABELS[item.taskType]}
                                </span>
                                <span className="text-gold/40 text-xs">
                                  {item.createdAt}
                                </span>
                              </div>
                              <p className="text-gold/60 text-xs line-clamp-2 max-w-lg">
                                {item.prompt}
                              </p>
                            </div>
                            <StatusBadge status={item.status} />
                          </div>

                          {(item.status === "running" ||
                            item.status === "queued") && (
                            <div className="flex items-center gap-2 text-gold/50 text-sm py-6">
                              <FiLoader
                                size={16}
                                className="animate-spin text-gold"
                              />
                              Polling every 5s for result…
                            </div>
                          )}

                          {item.status === "failed" && (
                            <p className="text-crimson text-sm">
                              {item.apiError ||
                                "Generation failed. Please try again."}
                            </p>
                          )}

                          {item.status === "succeed" && item.url && (
                            <div>
                              <video
                                src={item.url}
                                controls
                                className="w-full max-h-96 bg-black mb-3"
                              />
                              <Button
                                onClick={() =>
                                  downloadAsset(
                                    item.url,
                                    `${item.model.replace(/\s+/g, "-")}-${item.id}.mp4`,
                                  )
                                }
                                icon={<FiDownload size={14} />}
                                text="Download Video"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-col  space-y-5 h-full">
                    <FaFileVideo size={80} />
                    <h1 className="secondary text-cream">
                      {" "}
                      Generated videos will appear here
                    </h1>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ImageSection
        category={category}
        imageModel={imageModel}
        setImageModel={setImageModel}
        imageTask={imageTask}
        setImageTask={setImageTask}
        imagePrompt={imagePrompt}
        setImagePrompt={setImagePrompt}
        imageFiles={imageFiles}
        imagePreviews={imagePreviews}
        imageSize={imageSize}
        setImageSize={setImageSize}
        imageLoading={imageLoading}
        setImageLoading={setImageLoading}
        imageResults={imageResults}
        setImageResults={setImageResults}
        imageError={imageError}
        setImageError={setImageError}
        handleGenerateImage={handleGenerateImage}
        addImageSlot={addImageSlot}
        removeImageSlot={removeImageSlot}
      />
    </div>
  );
}

const ImageSection = ({
  category,
  imageModel,
  setImageModel,
  imageTask,
  setImageTask,
  imagePrompt,
  setImagePrompt,
  imageFiles,
  imagePreviews,
  imageSize,
  addImageSlot,
  removeImageSlot,
  setImageSize,
  imageLoading,
  setImageLoading,
  handleGenerateImage,
  imageResults,
  setImageResults,
  imageError,
  setImageError,
}) => {
  return (
    <>
      {category === "image" && (
        <div className="grid gap-3 items-start">
          {/* Left: Model selector + Form */}
          <div className="space-y-3">
            {/* Model cards */}
            <div>
              <h2 className="text-xs font-bold text-gold/50 uppercase tracking-widest mb-3">
                Select Image Model
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {IMAGE_MODELS.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    type="image"
                    selected={imageModel.id === m.id}
                    onClick={() => setImageModel(m)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Form */}
              <div className="bg-neutral-900 border border-gold/20 p-6 space-y-5">
                <h2 className="text-sm font-bold text-gold uppercase tracking-widest">
                  Generation Settings — {imageModel.name}
                </h2>

                {/* Task type */}
                <div>
                  <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                    Task Type
                  </label>
                  <div className="flex gap-2">
                    {imageModel.tasks.map((t) => (
                      <Button
                        key={t}
                        onClick={() => setImageTask(t)}
                        text={TASK_LABELS[t]}
                        className={imageTask !== t ? "opacity-40" : ""}
                      />
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                    Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate…"
                    className="w-full"
                  />
                </div>

                {/* Reference image upload — i2i only */}
                {imageTask === "i2i" && (
                  <div>
                    <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                      Reference Images (up to 4)
                    </label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {imageFiles.map((file, i) => (
                        <div
                          key={i}
                          className="relative w-20 h-20 overflow-hidden bg-stone-800 border-2 border-gold/30 shrink-0 group"
                        >
                          {imagePreviews[i] ? (
                            <>
                              <img
                                src={imagePreviews[i]}
                                alt={`Reference ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImageSlot(i)}
                                className="absolute top-0 right-0 bg-red-600/80 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiX size={10} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => imageFileRefs.current[i]?.click()}
                              className="w-full h-full flex flex-col items-center justify-center text-gold/30 hover:text-gold transition-colors gap-1"
                            >
                              <FiUpload size={16} />
                              <span className="text-[9px]">Image {i + 1}</span>
                            </button>
                          )}
                          <input
                            ref={(el) => (imageFileRefs.current[i] = el)}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files[0];
                              if (f) setImageFileAt(i, f);
                            }}
                          />
                        </div>
                      ))}
                      {imageFiles.length < 4 && (
                        <button
                          type="button"
                          onClick={addImageSlot}
                          className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gold/20 text-gold/30 hover:text-gold/60 hover:border-gold/40 transition-colors gap-1 text-[9px]"
                        >
                          <FiUpload size={14} />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Settings */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-gold/50 mb-2 uppercase tracking-wide">
                      Output Size
                    </label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full"
                    >
                      {imageModel.sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Error */}
                {imageError && (
                  <div className="flex items-center gap-2 text-crimson text-sm">
                    <FiAlertCircle size={14} />
                    {imageError}
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerateImage}
                  disabled={imageLoading}
                  loading={imageLoading}
                  icon={<FiImage size={16} />}
                  text={imageLoading ? "Generating…" : "Generate Image"}
                />
              </div>
              {/* Right: Results */}
              <div>
                {imageResults.length > 0 ? (
                  <div className="h-full">
                    <div className="space-y-4 h-full">
                      {imageResults.map((item) => (
                        <div
                          key={item.id}
                          className="bg-neutral-900 flex flex-col border border-gold/20 p-4 h-full space-y-4"
                        >
                          <div className="flex flex-col items-start gap-2 flex-wrap ">
                            <div>
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <span className="text-gold font-bold text-sm">
                                  {item.model}
                                </span>
                                <span className="text-[10px] border border-gold/30 text-gold px-1.5 py-0.5">
                                  {TASK_LABELS[item.taskType]}
                                </span>
                                <span className="text-gold/40 text-xs">
                                  {item.createdAt}
                                </span>
                              </div>
                              <p className="text-chino secondary text-xs line-clamp-2 max-w-lg">
                                {item.prompt}
                              </p>
                            </div>
                          </div>

                          {item.urls.length === 0 ? (
                            <p className="text-crimson text-sm">
                              No images returned. Try a different prompt.
                            </p>
                          ) : (
                            <div className="flex h-full w-full ">
                              {item.urls.map((url, idx) => (
                                <div key={idx} className="relative h-full">
                                  <img
                                    src={url}
                                    alt={`Generated image ${idx + 1}`}
                                    className="w-full h-full object-cover border border-gold/20"
                                  />
                                  <button
                                    onClick={() =>
                                      downloadAsset(
                                        url,
                                        `${item.model.replace(/\s+/g, "-")}-${item.id}-${idx + 1}.png`,
                                      )
                                    }
                                    className="absolute bottom-2 cursor-pointer left-2 center space-x-2 px-3 py-1 bg-black/50 backdrop-blur-lg border border-gold/50"
                                  >
                                    <FiDownload />
                                    <span className="secondary">Download</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center flex-col justify-center h-full space-y-5">
                    <FaPhotoFilm size={80} />
                    <h1 className="text-cream secondary">
                      Generated images will appear here
                    </h1>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
