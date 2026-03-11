"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import SectionContainer from "../containers/SectionContainer";
import Title from "@/app/components/ui/Title";
import Button from "@/app/components/buttons/Button";
import { FaPlus, FaTrash } from "react-icons/fa";

const AddFestivalLineupForm = ({
  festivalId,
  festivalName,
  existingLineup = null,
  currentLineupStatus = null,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineupStatus, setLineupStatus] = useState(currentLineupStatus || null);

  // Festival days options
  const festivalDays = ["Friday", "Saturday", "Sunday"];

  // Initialize stages - each artist has their own phase
  const [stages, setStages] = useState(
    existingLineup && existingLineup.length > 0
      ? existingLineup
      : [{ stage_name: "", artists: [{ name: "", day: "", phase: null }] }],
  );

  // Add a new stage (new artists in new stages get the currently selected phase)
  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        stage_name: "",
        artists: [{ name: "", day: "", phase: lineupStatus }],
      },
    ]);
  };

  // Remove a stage
  const handleRemoveStage = (stageIndex) => {
    if (stages.length === 1) return; // Keep at least one stage
    const newStages = stages.filter((_, index) => index !== stageIndex);
    setStages(newStages);
  };

  // Update stage name
  const handleStageNameChange = (stageIndex, value) => {
    const newStages = [...stages];
    newStages[stageIndex].stage_name = value;
    setStages(newStages);
  };

  // Update artist name
  const handleArtistChange = (stageIndex, artistIndex, field, value) => {
    const newStages = [...stages];
    newStages[stageIndex].artists[artistIndex][field] = value;
    setStages(newStages);
  };

  const handleAddArtist = (stageIndex) => {
    const newStages = [...stages];
    // New artists get the currently selected phase
    newStages[stageIndex].artists.push({
      name: "",
      day: "",
      phase: lineupStatus,
    });
    setStages(newStages);
  };

  const handleRemoveArtist = (stageIndex, artistIndex) => {
    const newStages = [...stages];
    newStages[stageIndex].artists = newStages[stageIndex].artists.filter(
      (_, index) => index !== artistIndex,
    );
    setStages(newStages);
  };

  // Calculate phase summary (count artists by phase)
  const phaseSummary = () => {
    const summary = {};
    stages.forEach((stage) => {
      stage.artists.forEach((artist) => {
        const phase = artist.phase || "No phase";
        summary[phase] = (summary[phase] || 0) + 1;
      });
    });
    return summary;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(setError(""));

    // Validate
    const hasEmptyStage = stages.some((stage) => !stage.stage_name.trim());
    if (hasEmptyStage) {
      dispatch(
        setError({ message: "All stages must have a name", type: "error" }),
      );
      setIsSubmitting(false);
      return;
    }

    // Filter out empty artists (artists without names)
    const cleanedStages = stages.map((stage) => ({
      ...stage,
      artists: stage.artists
        .filter((artist) => artist.name.trim() !== "")
        .map((artist) => ({
          ...artist,
          // Ensure phase is set: existing artist phase OR currently selected phase
          phase:
            artist.phase !== null && artist.phase !== undefined
              ? artist.phase
              : lineupStatus,
        })),
    }));

    const hasStageWithoutArtists = cleanedStages.some(
      (stage) => stage.artists.length === 0,
    );
    if (hasStageWithoutArtists) {
      dispatch(
        setError({
          message: "Each stage must have at least one artist",
          type: "error",
        }),
      );
      setIsSubmitting(false);
      return;
    }

    // Debug: Log what we're sending
    console.log("Submitting lineup:", {
      lineup_status: lineupStatus,
      stages: cleanedStages,
      sample_artists: cleanedStages[0]?.artists.slice(0, 2),
    });

    try {
      const response = await fetch("/api/festivals/add-festival-lineup", {
        method: existingLineup ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          festival_id: festivalId,
          festival_name: festivalName,
          stages: cleanedStages,
          lineup_status: lineupStatus || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save lineup");
      }

      const result = await response.json();

      const phaseMessage = lineupStatus
        ? ` New stages marked as "${lineupStatus}".`
        : "";

      dispatch(
        showSuccess({
          type: "festival_lineup",
          name: festivalName,
          description: `Lineup ${existingLineup ? "updated" : "added"} successfully!${phaseMessage}`,
        }),
      );

      // Redirect to festival page
      setTimeout(() => {
        router.push(`/festivals/${festivalId}`);
      }, 2000);
    } catch (err) {
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionContainer
      title={`${existingLineup ? "Edit" : "Add"} Lineup for ${festivalName}`}
      description="Organize your festival lineup by stages. Add multiple stages and artists for each stage."
    >
      <form onSubmit={handleSubmit} className="w-full space-y-6 ">
        {/* Lineup Status Selection */}
        <div className="bg-stone-900/50 p-4 border border-gold/20 space-y-2">
          <div>
            <label className="text-sm font-semibold text-gold block mb-2">
              Announcement Phase (for new artists)
            </label>
            <p className="text-xs text-stone-400 mb-3">
              Select a phase to apply to all new artists you add. Existing
              artists will keep their original phase.
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "first phase", label: "First Phase" },
                { value: "second phase", label: "Second Phase" },
                { value: "last phase", label: "Last Phase" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLineupStatus(option.value)}
                  className={`px-3 font-semibold duration-300  pt-1 ${
                    lineupStatus === option.value
                      ? "bg-gold text-black"
                      : "bg-stone-800 text-chino hover:bg-stone-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              {lineupStatus && (
                <button
                  type="button"
                  onClick={() => setLineupStatus(null)}
                  className="px-3 font-semibold bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage, stageIndex) => (
            <div
              key={stageIndex}
              className="bg-stone-800/50 p-4 border border-gold/20 space-y-3"
            >
              {/* Stage Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Title
                    text={`Stage ${stageIndex + 1}`}
                    size="sm"
                    color="gold"
                  />
                  {stages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(stageIndex)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition-colors"
                      title="Remove Stage"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>

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
                    onChange={(e) =>
                      handleStageNameChange(stageIndex, e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Artists List */}
              <div className="space-y-2">
                <label className="text-xs text-chino block">
                  Artists <span className="text-red-500">*</span>
                </label>
                {stage.artists.map((artist, artistIndex) => (
                  <div
                    key={artistIndex}
                    className="bg-stone-900/50 p-3 border border-stone-700/50 space-y-2"
                  >
                    {/* Artist phase badge */}
                    {artist.phase && (
                      <div className="flex justify-end">
                        <span className="text-[9px] px-2 py-0.5 bg-gold/20 text-gold rounded-full font-semibold uppercase">
                          {artist.phase}
                        </span>
                      </div>
                    )}

                    {/* Artist Name and Day on same line */}
                    <div className="grid grid-cols-[2fr_1fr] gap-2">
                      <div>
                        <label className="text-xs text-stone-400 block mb-1">
                          Artist Name
                        </label>
                        <input
                          type="text"
                          placeholder="Artist Name"
                          className="py-1 text-sm w-full"
                          value={artist.name}
                          onChange={(e) =>
                            handleArtistChange(
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
                        <label className="text-xs text-stone-400 block mb-1">
                          Day
                        </label>
                        <select
                          className="py-1 text-sm w-full"
                          value={artist.day}
                          onChange={(e) =>
                            handleArtistChange(
                              stageIndex,
                              artistIndex,
                              "day",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Day</option>
                          {festivalDays.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Remove Artist Button */}
                    {stage.artists.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveArtist(stageIndex, artistIndex)
                        }
                        className="w-full py-1 px-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 text-xs rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <FaTrash size={10} />
                        Remove Artist
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Artist Button */}
                <button
                  type="button"
                  onClick={() => handleAddArtist(stageIndex)}
                  className="w-full py-2 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
                >
                  <FaPlus size={10} />
                  Add Artist
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Stage Button */}
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

        {/* Submit Button */}
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
                : existingLineup
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
