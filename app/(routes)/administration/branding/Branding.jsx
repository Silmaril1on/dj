"use client";
import TrackListAnimation from "./components/TrackListAnimation";
import PosterTool from "./components/PosterTool";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";

// --- Instructions / Control Panel -------------------------------------------

import { useMemo, useState, useCallback } from "react";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const Instructions = ({ branding, onSaved }) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const brandingFormConfig = useMemo(
    () => ({
      imageField: "poster_url",
      arrayFields: ["tracklist"],

      initialData: {
        id: branding?.id ?? "",
        episode_number: branding?.episode_number ?? 1,
        tracklist: Array.isArray(branding?.tracklist)
          ? branding.tracklist.join("\n")
          : typeof branding?.tracklist === "string"
            ? branding.tracklist
            : "",
        poster_url:
          typeof branding?.poster_url === "string" ? branding.poster_url : "",
      },

      sections: [
        {
          gridClass: "grid grid-cols-1 md:grid-cols-2 gap-6 items-start",
          fields: ["tracklist", "poster_url"],
        },
        {
          gridClass: "grid grid-cols-1 md:grid-cols-2 gap-6 items-start",
          fields: ["episode_number"],
        },
      ],

      fields: {
        episode_number: {
          type: "number",
          label: "Episode Number",
          required: true,
          min: 1,
        },

        tracklist: {
          type: "textarea",
          label: "Tracklist",
          placeholder: "Artist - Track Title\nArtist 2 - Track Title 2",
          rows: 12,
          className:
            "min-h-[220px] px-3 py-2 bg-black border border-gold/30 text-cream text-sm resize-y focus:border-gold outline-none font-mono",
        },

        poster_url: {
          type: "image",
          label: "Poster Image",
          helpText: "Upload poster image. Max 15MB.",
        },
      },
    }),
    [branding],
  );

  const handleSubmit = useCallback(
    async (fd) => {
      setSaving(true);

      try {
        const id = branding?.id ?? "";
        fd.set("id", id);

        const tracklistValue = fd.get("tracklist");

        // If textarea sends plain text, normalize to JSON array
        if (typeof tracklistValue === "string") {
          const trimmed = tracklistValue.trim();
          let tracks = null;

          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) tracks = parsed;
            } catch {}
          }

          if (!tracks) {
            tracks = tracklistValue
              .split("\n")
              .map((t) => t.trim())
              .filter(Boolean);
          }

          fd.set("tracklist", JSON.stringify(tracks));
        }

        const res = await fetch("/api/admin/branding", {
          method: "PATCH",
          body: fd,
        });

        const json = await res.json();

        if (json.success && onSaved) {
          onSaved(json.data);
          setShowForm(false);
        }
      } finally {
        setSaving(false);
      }
    },
    [branding?.id, onSaved],
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-gold text-lg font-bold uppercase tracking-widest">
          Branding Control
        </h2>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="px-4 py-2 border border-gold/40 text-gold text-xs font-bold uppercase hover:bg-gold hover:text-black transition-colors"
        >
          {showForm ? "Hide Form" : "Show Form"}
        </button>
      </div>

      {showForm && (
        <SubmissionForm
          showGoogle={false}
          formConfig={brandingFormConfig}
          onSubmit={handleSubmit}
          isLoading={saving}
          submitButtonText={saving ? "Saving..." : "Save Changes"}
          className="space-y-1"
        />
      )}
    </div>
  );
};

const Branding = ({ branding: initialBranding }) => {
  const [activeTab, setActiveTab] = useState("poster");
  const [branding, setBranding] = useState(initialBranding);
  const episode = String(branding?.episode_number ?? 1).padStart(3, "0");
  const tracks = branding?.tracklist ?? [];

  return (
    <div className="w-full">
      <Instructions branding={branding} onSaved={setBranding} />
      <div className="flex justify-center gap-4 py-8">
        <LayoutButtons
          options={[
            { label: "Poster Tool", value: "poster" },
            { label: "Tracklist Reel", value: "reel" },
          ]}
          activeOption={activeTab}
          color="bg-stone-900"
          activeLayout={activeTab}
          onOptionChange={setActiveTab}
        />
      </div>
      {activeTab === "poster" && <PosterTool branding={branding} />}
      {activeTab === "reel" && (
        <TrackListAnimation
          tracklist={true}
          episode={episode}
          tracks={tracks}
        />
      )}
    </div>
  );
};

export default Branding;
