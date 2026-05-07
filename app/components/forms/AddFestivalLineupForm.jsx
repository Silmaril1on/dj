"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import SectionContainer from "../containers/SectionContainer";
import Title from "@/app/components/ui/Title";
import Button from "@/app/components/buttons/Button";
import AdditionalInput from "@/app/components/forms/AdditionalInput";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";
import { FaPlus, FaTrash } from "react-icons/fa";

const FESTIVAL_DAYS = ["Friday", "Saturday", "Sunday"];

/** Given existing stages from DB and optional pre-fill artists, build form state */
const buildEnhancedInitialStages = (
  existingLineup,
  existingStages,
  prefillArtists,
  lineupStatus,
) => {
  // Case 1: existing enhanced lineup → use it as-is
  if (existingLineup && existingLineup.length > 0) {
    return existingLineup.map((stage) => ({
      stage_name: stage.stage_name || "",
      locked_name: true, // came from DB stages
      artists: stage.artists.map((a) => ({
        name: a.name || "",
        day: a.day || "",
        phase: a.phase || null,
      })),
    }));
  }

  // Case 2: festival has DB stages configured
  if (existingStages && existingStages.length > 0) {
    return existingStages.map((s, i) => ({
      stage_name: s.stage_name,
      locked_name: true,
      artists:
        i === 0 && prefillArtists && prefillArtists.length > 0
          ? prefillArtists.map((a) => ({
              name: a.name,
              day: "",
              phase: lineupStatus,
            }))
          : [{ name: "", day: "", phase: lineupStatus }],
    }));
  }

  // Case 3: no stages — fresh form, optionally prefill artists into stage 1
  const artists =
    prefillArtists && prefillArtists.length > 0
      ? prefillArtists.map((a) => ({
          name: a.name,
          day: "",
          phase: lineupStatus,
        }))
      : [{ name: "", day: "", phase: lineupStatus }];

  return [{ stage_name: "", locked_name: false, artists }];
};

// ─── Phase style helper ──────────────────────────────────────────────────────

const phaseStyle = (phase) => {
  if (phase === "first phase")
    return "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
  if (phase === "second phase")
    return "bg-blue-500/20 border-blue-500/40 text-blue-400";
  if (phase === "third phase")
    return "bg-orange-500/20 border-orange-500/40 text-orange-400";
  return "bg-gold/20 border-gold/40 text-gold";
};

// ─── Standard Lineup Section ─────────────────────────────────────────────────

const StandardLineupSection = ({
  existingArtists,
  newArtists,
  onNewArtistsChange,
}) => {
  const handleChange = (index, value) => {
    const next = [...newArtists];
    next[index] = value;
    onNewArtistsChange(next);
  };

  const handleAdd = () => onNewArtistsChange([...newArtists, ""]);

  const handleRemove = (index) => {
    if (newArtists.length === 1) return;
    onNewArtistsChange(newArtists.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Existing artists — read-only display grid */}
      {existingArtists.length > 0 && (
        <div>
          <p className="text-xs text-chino mb-2 uppercase secondary">
            {existingArtists.length} artist
            {existingArtists.length !== 1 ? "s" : ""} already in lineup
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {existingArtists.map((artist, i) => (
              <div
                key={i}
                className="bg-stone-900 border border-stone-700/60 p-2 flex flex-col gap-1"
              >
                {artist.phase && (
                  <span
                    className={`text-[8px] px-1.5 py-0.5 border font-bold secondary uppercase self-start ${phaseStyle(
                      artist.phase,
                    )}`}
                  >
                    {artist.phase}
                  </span>
                )}
                <span className="text-cream/90 pl-1 text-xs font-bold uppercase leading-tight">
                  {artist.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New artists input */}
      <div className="space-y-2">
        <label className="text-xs text-chino block secondary uppercase">
          {existingArtists.length > 0 ? "Add More Artists" : "Artist Names"}{" "}
          {existingArtists.length === 0 && (
            <span className="text-red-500">*</span>
          )}
        </label>
        <AdditionalInput
          className="grid grid-cols-5"
          fields={newArtists}
          onChange={handleChange}
          onAdd={handleAdd}
          onRemove={handleRemove}
          placeholder="Artist name"
          id="standard-artist"
          name="standard-artist"
          minFields={1}
        />
      </div>
    </div>
  );
};

// ─── Enhanced Stage Card ──────────────────────────────────────────────────────

const StageCard = ({
  stage,
  stageIndex,
  canRemove,
  lineupStatus,
  onRemove,
  onNameChange,
  onArtistChange,
  onAddArtist,
  onRemoveArtist,
}) => (
  <div className="bg-stone-800/50 p-4 border border-gold/20 space-y-3">
    {/* Stage Header */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Title
          text={
            stage.locked_name
              ? stage.stage_name.toUpperCase()
              : `Stage ${stageIndex + 1}`
          }
          size="sm"
          color="gold"
        />
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(stageIndex)}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors"
            title="Remove Stage"
          >
            <FaTrash size={14} />
          </button>
        )}
      </div>

      {!stage.locked_name && (
        <div>
          <label
            htmlFor={`stage-name-${stageIndex}`}
            className="text-xs text-chino block"
          >
            Stage Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`stage-name-${stageIndex}`}
            type="text"
            placeholder="e.g., Main Stage, Techno Stage"
            className="py-1"
            value={stage.stage_name}
            onChange={(e) => onNameChange(stageIndex, e.target.value)}
            required
          />
        </div>
      )}
    </div>

    {/* Artists List */}
    <div className="space-y-2">
      <label className="text-xs text-chino block">
        Artists <span className="text-red-500">*</span>
      </label>
      {stage.artists.map((artist, artistIndex) => (
        <div
          key={artistIndex}
          className="bg-stone-900/50 p-3 border border-chino/15 "
        >
          {artist.phase && (
            <div className="flex justify-end">
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full secondary font-semibold uppercase border ${
                  artist.phase === "first phase"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : artist.phase === "second phase"
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                      : artist.phase === "third phase"
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                        : "bg-gold/20 border-gold/40 text-gold"
                }`}
              >
                {artist.phase}
              </span>
            </div>
          )}
          <div className="grid grid-cols-[4fr_3fr_0.5fr] items-end gap-2 ">
            <div>
              <label className="text-xs text-stone-400">Artist Name</label>
              <input
                type="text"
                placeholder="Artist Name"
                className="py-1 text-sm w-full"
                value={artist.name}
                onChange={(e) =>
                  onArtistChange(
                    stageIndex,
                    artistIndex,
                    "name",
                    e.target.value,
                  )
                }
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-400">Day</label>
              <select
                className="py-1 text-sm w-full"
                value={artist.day}
                onChange={(e) =>
                  onArtistChange(stageIndex, artistIndex, "day", e.target.value)
                }
              >
                <option value="">Day</option>
                {FESTIVAL_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            {stage.artists.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveArtist(stageIndex, artistIndex)}
                className="w-fit p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 text-xs"
              >
                <FaTrash size={10} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onAddArtist(stageIndex)}
        className="w-full py-2 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold transition-colors flex items-center justify-center gap-1"
      >
        <FaPlus size={10} />
        Add Artist
      </button>
    </div>
  </div>
);

// ─── Main Form ────────────────────────────────────────────────────────────────

const AddFestivalLineupForm = ({
  festivalId,
  festivalName,
  existingLineup = null,
  existingStandardArtists = [],
  existingStages = [],
  lineupType = "none",
  currentLineupStatus = null,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineupStatus, setLineupStatus] = useState(currentLineupStatus || null);

  const [lineupMode, setLineupMode] = useState(
    lineupType === "standard" ? "standard" : "enhanced",
  );

  // Standard mode state — only NEW artists being added (existing ones shown read-only)
  const [standardArtists, setStandardArtists] = useState([""]);

  // Enhanced mode state
  const [stages, setStages] = useState(() =>
    buildEnhancedInitialStages(
      existingLineup,
      existingStages,
      null,
      lineupStatus,
    ),
  );

  // ── Mode switching ──────────────────────────────────────────────────────────

  const switchToStandard = () => {
    setLineupMode("standard");
  };

  const switchToEnhanced = () => {
    // When upgrading from standard, prefill all standard artists into stage 1
    const prefill =
      lineupMode === "standard" && standardArtists.some((n) => n.trim())
        ? standardArtists.filter((n) => n.trim()).map((name) => ({ name }))
        : null;

    setStages(
      buildEnhancedInitialStages(
        existingLineup,
        existingStages,
        prefill,
        lineupStatus,
      ),
    );
    setLineupMode("enhanced");
  };

  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        stage_name: "",
        locked_name: false,
        artists: [{ name: "", day: "", phase: lineupStatus }],
      },
    ]);
  };

  const handleRemoveStage = (stageIndex) => {
    if (stages.length === 1) return;
    setStages(stages.filter((_, i) => i !== stageIndex));
  };

  const handleStageNameChange = (stageIndex, value) => {
    const next = [...stages];
    next[stageIndex] = { ...next[stageIndex], stage_name: value };
    setStages(next);
  };

  const handleArtistChange = (stageIndex, artistIndex, field, value) => {
    const next = stages.map((stage, si) => {
      if (si !== stageIndex) return stage;
      const artists = stage.artists.map((artist, ai) =>
        ai === artistIndex ? { ...artist, [field]: value } : artist,
      );
      return { ...stage, artists };
    });
    setStages(next);
  };

  const handleAddArtist = (stageIndex) => {
    const next = stages.map((stage, si) => {
      if (si !== stageIndex) return stage;
      return {
        ...stage,
        artists: [...stage.artists, { name: "", day: "", phase: lineupStatus }],
      };
    });
    setStages(next);
  };

  const handleRemoveArtist = (stageIndex, artistIndex) => {
    const next = stages.map((stage, si) => {
      if (si !== stageIndex) return stage;
      return {
        ...stage,
        artists: stage.artists.filter((_, ai) => ai !== artistIndex),
      };
    });
    setStages(next);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const hasExistingData =
    (existingLineup && existingLineup.length > 0) ||
    existingStandardArtists.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(setError(""));

    let body;

    if (lineupMode === "standard") {
      // Combine already-saved artists with newly entered ones
      const existingNames = existingStandardArtists.map((a) => a.name);
      const newNames = standardArtists.map((n) => n.trim()).filter(Boolean);
      const allArtists = [...existingNames, ...newNames];
      if (allArtists.length === 0) {
        dispatch(
          setError({ message: "Add at least one artist name", type: "error" }),
        );
        setIsSubmitting(false);
        return;
      }
      body = {
        festival_id: festivalId,
        lineup_type: "standard",
        artists: allArtists,
        lineup_status: lineupStatus || null,
      };
    } else {
      // Validate stage names for non-locked stages
      const hasEmptyName = stages.some(
        (s) => !s.locked_name && !s.stage_name.trim(),
      );
      if (hasEmptyName) {
        dispatch(
          setError({ message: "All stages must have a name", type: "error" }),
        );
        setIsSubmitting(false);
        return;
      }

      const cleanedStages = stages.map((stage) => ({
        stage_name: stage.stage_name,
        artists: stage.artists
          .filter((a) => a.name.trim() !== "")
          .map((a) => ({
            ...a,
            phase:
              a.phase !== null && a.phase !== undefined
                ? a.phase
                : lineupStatus,
          })),
      }));

      if (cleanedStages.some((s) => s.artists.length === 0)) {
        dispatch(
          setError({
            message: "Each stage must have at least one artist",
            type: "error",
          }),
        );
        setIsSubmitting(false);
        return;
      }

      body = {
        festival_id: festivalId,
        lineup_type: "enhanced",
        stages: cleanedStages,
        lineup_status: lineupStatus || null,
      };
    }

    try {
      const response = await fetch("/api/festivals/lineup", {
        method: hasExistingData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save lineup");
      }

      router.push(`/festivals/${festivalId}`);
    } catch (err) {
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SectionContainer
      title={`${hasExistingData ? "Edit" : "Add"} Lineup for ${festivalName}`}
      description={
        lineupMode === "standard"
          ? "Add artist names quickly. You can assign stages and days later."
          : "Organize your festival lineup by stages. Add multiple stages and artists for each stage."
      }
    >
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* ── Announcement Phase + Mode Toggle ── */}
        <div className="bg-stone-900/50 space-y-4">
          {/* Mode toggle row */}
          <div className="flex items-start flex-col gap-1">
            <LayoutButtons
              layoutId="lineupModeToggle"
              color="bg-stone-900"
              activeOption={lineupMode}
              onOptionChange={(val) =>
                val === "standard" ? switchToStandard() : switchToEnhanced()
              }
              options={[
                { value: "standard", label: "Simple Lineup Upload" },
                { value: "enhanced", label: "Enhanced Lineup Upload" },
              ]}
            />
            {lineupMode === "standard" && (
              <span className="text-xs text-chino secondary">
                Best for quick uploads or when you only have artist names. You
                can assign stages and days later using Enhanced mode
              </span>
            )}
          </div>

          {/* Phase selection — shown for both modes */}
          <div>
            <label className="text-lg font-bold text-gold block leading-none">
              Announcement Phase
            </label>
            <p className="text-xs text-chino mb-3 secondary">
              {lineupMode === "enhanced"
                ? "Select a phase to apply to all new artists you add. Existing artists keep their original phase."
                : "Select a phase to assign to this set of artists."}
            </p>
            <div className="flex gap-2 flex-wrap">
              {/* First Phase — green */}
              <button
                type="button"
                onClick={() => setLineupStatus("first phase")}
                className={`px-3 py-1 font-semibold text-sm duration-300 border ${
                  lineupStatus === "first phase"
                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-300"
                    : "bg-stone-800 border-emerald-500/30 text-emerald-500/70 hover:bg-emerald-500/10 hover:border-emerald-400/60"
                }`}
              >
                First Phase
              </button>
              {/* Second Phase — blue */}
              <button
                type="button"
                onClick={() => setLineupStatus("second phase")}
                className={`px-3 py-1 font-semibold text-sm duration-300 border ${
                  lineupStatus === "second phase"
                    ? "bg-blue-500/30 border-blue-400 text-blue-300"
                    : "bg-stone-800 border-blue-500/30 text-blue-500/70 hover:bg-blue-500/10 hover:border-blue-400/60"
                }`}
              >
                Second Phase
              </button>
              {/* Third Phase — orange */}
              <button
                type="button"
                onClick={() => setLineupStatus("third phase")}
                className={`px-3 py-1 font-semibold text-sm duration-300 border ${
                  lineupStatus === "third phase"
                    ? "bg-orange-500/30 border-orange-400 text-orange-300"
                    : "bg-stone-800 border-orange-500/30 text-orange-500/70 hover:bg-orange-500/10 hover:border-orange-400/60"
                }`}
              >
                Third Phase
              </button>
              {lineupStatus && (
                <button
                  type="button"
                  onClick={() => setLineupStatus(null)}
                  className="px-3 py-1 font-semibold text-sm bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Standard mode ── */}
        {lineupMode === "standard" && (
          <div className="bg-stone-800/50 p-4 border border-gold/20">
            <StandardLineupSection
              existingArtists={existingStandardArtists}
              newArtists={standardArtists}
              onNewArtistsChange={setStandardArtists}
            />
          </div>
        )}

        {/* ── Enhanced mode ── */}
        {lineupMode === "enhanced" && (
          <>
            {existingStages.length > 0 && !existingLineup && (
              <p className="text-xs text-stone-400 italic px-1">
                Stages loaded from your festival setup. Add artists to each
                stage below.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stages.map((stage, stageIndex) => (
                <StageCard
                  key={stageIndex}
                  stage={stage}
                  stageIndex={stageIndex}
                  canRemove={stages.length > 1}
                  lineupStatus={lineupStatus}
                  onRemove={handleRemoveStage}
                  onNameChange={handleStageNameChange}
                  onArtistChange={handleArtistChange}
                  onAddArtist={handleAddArtist}
                  onRemoveArtist={handleRemoveArtist}
                />
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleAddStage}
                className="py-3 px-6 bg-gold/20 hover:bg-gold/30 text-gold font-bold cursor-pointer rounded transition-colors flex items-center gap-2"
              >
                <FaPlus />
                <span>Add Another Stage</span>
              </button>
            </div>
          </>
        )}

        {/* ── Actions ── */}
        <div className="flex justify-end gap-4 pt-6 border-t border-stone-700">
          <Button
            text="Cancel"
            type="button"
            size="small"
            onClick={() => router.push(`/festivals/${festivalId}`)}
          />
          <Button
            text={
              isSubmitting
                ? "Saving..."
                : hasExistingData
                  ? "Update Lineup"
                  : "Save Lineup"
            }
            type="submit"
            size="small"
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </div>
      </form>
    </SectionContainer>
  );
};

export default AddFestivalLineupForm;
