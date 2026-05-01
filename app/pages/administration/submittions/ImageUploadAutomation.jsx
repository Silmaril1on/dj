"use client";
import { useState } from "react";
import FlexBox from "@/app/components/containers/FlexBox";

const ImageUploadAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/upload-artist-images", {
        method: "GET",
      });
      const data = await response.json();
      setPreview(data);
      setShowPreview(true);
    } catch (error) {
      console.error("Preview error:", error);
      setResult({
        success: false,
        message: "Failed to load preview",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (
      !confirm(
        "Are you sure you want to upload images for all pending artists?",
      )
    ) {
      return;
    }

    setLoading(true);
    setResult(null);
    setShowPreview(false);
    try {
      const response = await fetch("/api/admin/upload-artist-images", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);

      // Reload page after successful upload to show updated submissions
      if (data.successCount > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResult({
        success: false,
        message: "Failed to upload images",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-stone-900/50 bordered rounded-lg">
      <FlexBox type="between-row" className="gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-gold font-semibold mb-1">
            Artist Image Automation
          </h3>
          <p className="text-cream/70 text-sm">
            Automatically upload images from /public/artist-photos to pending
            artists
          </p>
        </div>

        <FlexBox type="row" className="gap-3">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 bg-stone-800 text-gold hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors border border-gold/20"
          >
            {loading && showPreview ? "Loading..." : "Preview"}
          </button>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 bg-gold text-stone-900 hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors font-semibold"
          >
            {loading && !showPreview ? "Uploading..." : "Upload Images"}
          </button>
        </FlexBox>
      </FlexBox>

      {/* Preview Results */}
      {showPreview && preview && (
        <div className="mt-4 p-4 bg-stone-800/50 rounded-md border border-gold/10">
          <h4 className="text-gold font-semibold mb-2">Preview</h4>
          <div className="space-y-2 text-sm">
            <p className="text-cream">
              Total pending without images:{" "}
              <span className="text-gold font-semibold">
                {preview.totalPendingWithoutImages}
              </span>
            </p>
            <p className="text-cream">
              With matching images:{" "}
              <span className="text-green-500 font-semibold">
                {preview.withMatchingImages}
              </span>
            </p>
            <p className="text-cream">
              Without matching images:{" "}
              <span className="text-red-400 font-semibold">
                {preview.withoutMatchingImages}
              </span>
            </p>
          </div>

          {preview.preview && preview.preview.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto">
              <div className="space-y-1">
                {preview.preview.map((item, index) => (
                  <div
                    key={item.artistId}
                    className={`text-xs p-2 rounded ${item.hasMatchingImage ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}
                  >
                    {item.artistName}{" "}
                    {item.hasMatchingImage
                      ? `✓ ${item.imageFile}`
                      : "✗ No match"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Results */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-md border ${result.success ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"}`}
        >
          <h4
            className={`font-semibold mb-2 ${result.success ? "text-green-400" : "text-red-400"}`}
          >
            {result.success ? "Upload Complete" : "Upload Failed"}
          </h4>
          <p className="text-cream text-sm mb-3">{result.message}</p>

          {result.results && result.results.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {result.results.map((item) => (
                <div
                  key={item.artistId}
                  className={`text-xs p-2 rounded ${item.status === "success" ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}
                >
                  <div className="font-semibold">{item.artistName}</div>
                  {item.status === "success" ? (
                    <div className="space-y-0.5">
                      <div className="text-green-400">✓ {item.sourceFile}</div>
                      {item.imageUrls && (
                        <div className="text-green-500/70 flex gap-2 flex-wrap">
                          {Object.entries(item.imageUrls).map(([size, url]) => (
                            <a
                              key={size}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              [{size}]
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-400">✗ {item.reason}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.successCount > 0 && (
            <p className="text-gold text-sm mt-3 italic">
              Page will reload in 3 seconds...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadAutomation;
