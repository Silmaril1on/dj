"use client";

import React, { useMemo, useState } from "react";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const fillLineupInputs = (lineup = []) => {
  const values = Array.isArray(lineup) ? lineup.slice(0, 8) : [];
  while (values.length < 8) values.push("");
  return values;
};

const CustomInput = ({
  selectedFestival = null,
  onSaved,
  mode = "weekly",
  monthBatchLabel = "0 of 0",
  monthBatchCount = 0,
  onAnimateNext,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const formConfig = useMemo(() => {
    const config = selectedFestival?.reel_config || {};

    return {
      initialData: {
        entity_id: selectedFestival?.id || "",
        edition_id: selectedFestival?.edition_id || "",
        asset_file: config.asset_url || "",
        asset_url: config.asset_url || "",
        custom_text: config.custom_text || "",
        extra_note: config.extra_note || "",
        lineup: fillLineupInputs(config.lineup || []),
      },
      imageField: "asset_file",
      arrayFields: ["lineup"],
      fields: {
        asset_file: {
          type: "video",
          label: "Video",
          helpText: "Upload the weekly reel video.",
          maxSize: 100 * 1024 * 1024,
        },
        asset_url: {
          type: "url",
          label: "Video URL Override",
          placeholder: "https://...",
          helpText: "Optional. Used when no new video file is uploaded.",
        },
        lineup: {
          type: "additional",
          label: "Custom Lineup",
          placeholder: "Artist name",
          minFields: 8,
          maxFields: 8,
          className: "grid grid-cols-2 gap-x-2 gap-y-0",
        },
        custom_text: {
          type: "textarea",
          label: "Custom Text",
          placeholder: "Optional custom text",
        },
        extra_note: {
          type: "textarea",
          label: "Extra Note",
          placeholder: "Optional extra note",
        },
      },
      sections: [
        {
          title: selectedFestival ? selectedFestival.name : "Select a festival",
          gridClass: "grid gap-2",
          fields: ["asset_file", "asset_url"],
        },
        {
          title: "Custom Lineup",
          gridClass: "grid grid-cols-1 gap-3",
          fields: ["lineup"],
        },
        {
          title: "Text",
          gridClass: "grid grid-cols-2 gap-2",
          fields: ["custom_text", "extra_note"],
        },
      ],
    };
  }, [selectedFestival]);

  const handleSubmit = async (formData) => {
    if (!selectedFestival) return;

    setIsLoading(true);
    setMessage("");
    setError("");

    formData.set("entity_id", selectedFestival.id);
    formData.set("edition_id", selectedFestival.edition_id || "");

    try {
      const response = await fetch("/api/admin/reel-configs", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save reel config");
      }

      setMessage("Reel config saved.");
      onSaved?.(data.config);
    } catch (err) {
      setError(err.message || "Failed to save reel config");
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "month") {
    return (
      <aside className="min-h-[720px] border border-gold/30 bg-black/40 p-4 text-cream">
        <div className="border-b border-gold/20 pb-3">
          <p className="secondary text-[10px] uppercase tracking-[0.35em] text-chino">
            Reel Control
          </p>
          <h2 className="text-xl font-bold uppercase text-gold">This Month</h2>
        </div>

        <div className="mt-4 border border-gold/20 bg-stone-900 p-3">
          <p className="secondary text-[10px] uppercase tracking-[0.3em] text-chino">
            Current Batch
          </p>
          <p className="mt-1 text-lg font-black uppercase text-cream">
            {monthBatchLabel}
          </p>
          <p className="secondary mt-1 text-[10px] uppercase tracking-widest text-chino">
            {monthBatchCount} festivals loaded
          </p>
        </div>

        <button
          type="button"
          onClick={onAnimateNext}
          disabled={monthBatchCount === 0}
          className="mt-4 w-full border border-gold bg-gold px-4 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-black hover:text-gold disabled:cursor-not-allowed disabled:border-gold/30 disabled:bg-stone-900 disabled:text-gold/40"
        >
          ANIMATE NEXT 5 FESTIVAL
        </button>
      </aside>
    );
  }

  return (
    <aside className="min-h-[720px] border border-gold/30 bg-black/40 p-4 text-cream">
      <div className="border-b border-gold/20">
        <p className="secondary text-[10px] uppercase tracking-[0.35em] text-chino">
          Reel Config
        </p>
        <h2 className="text-xl font-bold uppercase text-gold">Custom Input</h2>
      </div>

      {!selectedFestival ? (
        <p className="secondary text-xs uppercase tracking-widest text-chino">
          Select a festival to edit reel data.
        </p>
      ) : (
        <>
          <SubmissionForm
            formConfig={formConfig}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitButtonText="Save Config"
            showGoogle={false}
            idPrefix="reel-config"
          />

          {message && (
            <p className="mt-3 border border-gold/30 bg-gold/10 p-2 text-xs uppercase text-gold">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-3 border border-crimson/40 bg-crimson/10 p-2 text-xs uppercase text-crimson">
              {error}
            </p>
          )}
        </>
      )}
    </aside>
  );
};

export default CustomInput;
