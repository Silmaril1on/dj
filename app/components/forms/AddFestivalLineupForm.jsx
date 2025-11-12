"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import SectionContainer from "../containers/SectionContainer";
import Title from "@/app/components/ui/Title";
import Button from "@/app/components/buttons/Button";
import AdditionalInput from "./AdditionalInput";
import { FaPlus, FaTrash } from "react-icons/fa";

const AddFestivalLineupForm = ({ festivalId, festivalName, existingLineup = null }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize stages - each stage has name and artists array
  const [stages, setStages] = useState(
    existingLineup && existingLineup.length > 0
      ? existingLineup
      : [{ stage_name: "", artists: [""] }]
  );

  // Add a new stage
  const handleAddStage = () => {
    setStages([...stages, { stage_name: "", artists: [""] }]);
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

  // Update artists array for a stage using AdditionalInput handlers
  const handleArtistChange = (stageIndex, artistIndex, value) => {
    const newStages = [...stages];
    newStages[stageIndex].artists[artistIndex] = value;
    setStages(newStages);
  };

  const handleAddArtist = (stageIndex) => {
    const newStages = [...stages];
    newStages[stageIndex].artists.push("");
    setStages(newStages);
  };

  const handleRemoveArtist = (stageIndex, artistIndex) => {
    const newStages = [...stages];
    newStages[stageIndex].artists = newStages[stageIndex].artists.filter(
      (_, index) => index !== artistIndex
    );
    setStages(newStages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(setError(""));

    // Validate
    const hasEmptyStage = stages.some((stage) => !stage.stage_name.trim());
    if (hasEmptyStage) {
      dispatch(setError({ message: "All stages must have a name", type: "error" }));
      setIsSubmitting(false);
      return;
    }

    // Filter out empty artists
    const cleanedStages = stages.map((stage) => ({
      ...stage,
      artists: stage.artists.filter((artist) => artist.trim() !== ""),
    }));

    const hasStageWithoutArtists = cleanedStages.some((stage) => stage.artists.length === 0);
    if (hasStageWithoutArtists) {
      dispatch(setError({ message: "Each stage must have at least one artist", type: "error" }));
      setIsSubmitting(false);
      return;
    }

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save lineup");
      }

      const result = await response.json();
      dispatch(
        showSuccess({
          type: "festival_lineup",
          name: festivalName,
          description: `Lineup ${existingLineup ? "updated" : "added"} successfully!`,
        })
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
      <form onSubmit={handleSubmit} className="w-full space-y-6">
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
                  <Title text={`Stage ${stageIndex + 1}`} size="sm" color="gold" />
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
                  <label htmlFor={`stage-name-${stageIndex}`} className="text-xs text-chino block">
                    Stage Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`stage-name-${stageIndex}`}
                    type="text"
                    placeholder="e.g., Main Stage, Techno Stage"
                    className="py-1"
                    value={stage.stage_name}
                    onChange={(e) => handleStageNameChange(stageIndex, e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Artists List using AdditionalInput */}
              <div>
                <label className="text-xs text-chino block">
                  Artists <span className="text-red-500">*</span>
                </label>
                <AdditionalInput
                  className="py-1"
                  id={`stage-${stageIndex}-artists`}
                  name={`stage-${stageIndex}-artists`}
                  fields={stage.artists}
                  onChange={(artistIndex, value) =>
                    handleArtistChange(stageIndex, artistIndex, value)
                  }
                  onAdd={() => handleAddArtist(stageIndex)}
                  onRemove={(artistIndex) => handleRemoveArtist(stageIndex, artistIndex)}
                  placeholder="Artist Name"
                  minFields={1}
                  maxFields={50}
                />
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
            text={isSubmitting ? "Saving..." : existingLineup ? "Update Lineup" : "Save Lineup"}
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