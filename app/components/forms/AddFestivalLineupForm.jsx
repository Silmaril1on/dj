"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { selectUser } from "@/app/features/userSlice";

const LINEUP_CACHE_TTL = 30 * 60 * 1000;
const lineupCacheKey = (id, editionId) =>
  `lineup_form_${id}_${editionId || "none"}`;

function loadLineupCache(festivalId, editionId) {
  try {
    const raw = sessionStorage.getItem(lineupCacheKey(festivalId, editionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > LINEUP_CACHE_TTL) return null;
    return parsed.artists;
  } catch {
    return null;
  }
}

function saveLineupCache(festivalId, editionId, artists) {
  try {
    sessionStorage.setItem(
      lineupCacheKey(festivalId, editionId),
      JSON.stringify({ artists, timestamp: Date.now() }),
    );
  } catch {
    // ignore
  }
}

import SectionContainer from "../containers/SectionContainer";
import Title from "@/app/components/ui/Title";
import Button from "@/app/components/buttons/Button";
import AdditionalInput from "@/app/components/forms/AdditionalInput";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";
import GlobalModal from "@/app/components/modals/GlobalModal";
import SwitchButton from "@/app/components/buttons/SwitchButton";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { MdEdit } from "react-icons/md";

const FESTIVAL_DAYS = ["Friday", "Saturday", "Sunday"];

/** Given existing stages from DB and optional pre-fill artists, build form state */
const buildEnhancedInitialStages = (
  existingLineup,
  existingStages,
  prefillArtists,
  lineupStatus,
) => {
  // Case 1: existing enhanced lineup → use it as-is, mark all as phase_locked (from DB)
  if (existingLineup && existingLineup.length > 0) {
    return existingLineup.map((stage) => ({
      stage_name: stage.stage_name || "",
      locked_name: true, // came from DB stages
      artists: stage.artists.map((a) => ({
        lineup_id: a.lineup_id || null,
        name: a.name || "",
        day: a.day || "",
        time_from: a.time_from || "",
        time_to: a.time_to || "",
        phase: a.phase || null,
        support_act: a.support_act || false,
        phase_locked: true, // came from DB — don't auto-update when lineupStatus changes
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
              lineup_id: null,
              name: a.name,
              day: "",
              time_from: "",
              time_to: "",
              phase: lineupStatus,
              support_act: false,
              phase_locked: false,
            }))
          : [
              {
                lineup_id: null,
                name: "",
                day: "",
                time_from: "",
                time_to: "",
                phase: lineupStatus,
                support_act: false,
                phase_locked: false,
              },
            ],
    }));
  }

  // Case 3: no stages — fresh form, optionally prefill artists into stage 1
  const artists =
    prefillArtists && prefillArtists.length > 0
      ? prefillArtists.map((a) => ({
          lineup_id: null,
          name: a.name,
          day: "",
          time_from: "",
          time_to: "",
          phase: lineupStatus,
          support_act: false,
          phase_locked: false,
        }))
      : [
          {
            lineup_id: null,
            name: "",
            day: "",
            time_from: "",
            time_to: "",
            phase: lineupStatus,
            support_act: false,
            phase_locked: false,
          },
        ];

  return [{ stage_name: "", locked_name: false, artists }];
};

// ─── Phase style helper ──────────────────────────────────────────────────────

const PHASES = [
  { value: "first phase", label: "First Phase" },
  { value: "second phase", label: "Second Phase" },
  { value: "third phase", label: "Third Phase" },
];

const dayStyle = (day) => {
  if (day === "Friday")
    return "bg-violet-500/20 border-violet-500/40 text-violet-400";
  if (day === "Saturday")
    return "bg-amber-500/20 border-amber-500/40 text-amber-400";
  if (day === "Sunday")
    return "bg-teal-500/20 border-teal-500/40 text-teal-400";
  return "bg-stone-700/60 border-stone-500 text-stone-400";
};

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
  activeDays,
  artistsByDay,
  onArtistsByDayChange,
  canEdit,
  onEditArtist,
  onDeleteArtist,
}) => {
  const PHASE_OPTIONS = [
    { label: "All", value: null },
    { label: "1st Phase", value: "first phase" },
    { label: "2nd Phase", value: "second phase" },
    { label: "3rd Phase", value: "third phase" },
  ];

  const DAY_FILTER_OPTIONS = [
    { label: "All", value: null },
    ...["Friday", "Saturday", "Sunday"]
      .filter((d) => existingArtists.some((a) => a.day === d))
      .map((d) => ({ label: d, value: d })),
  ];

  const [phaseFilter, setPhaseFilter] = useState(null);
  const [dayFilter, setDayFilter] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredArtists = existingArtists.filter((a) => {
    const phaseOk = !phaseFilter || a.phase === phaseFilter;
    const dayOk = !dayFilter || a.day === dayFilter;
    return phaseOk && dayOk;
  });

  const handleDayInput = (dayKey, index, value) => {
    const cur = artistsByDay[dayKey] || [""];
    const next = [...cur];
    next[index] = value;
    onArtistsByDayChange({ ...artistsByDay, [dayKey]: next });
  };

  const handleDayAdd = (dayKey) => {
    const cur = artistsByDay[dayKey] || [""];
    onArtistsByDayChange({ ...artistsByDay, [dayKey]: [...cur, ""] });
  };

  const handleDayRemove = (dayKey, index) => {
    const cur = artistsByDay[dayKey] || [""];
    if (cur.length === 1) return;
    onArtistsByDayChange({
      ...artistsByDay,
      [dayKey]: cur.filter((_, i) => i !== index),
    });
  };

  const inputSections =
    activeDays.length === 0
      ? [{ key: "", label: null }]
      : activeDays.map((d) => ({ key: d, label: d }));

  return (
    <div className="space-y-4 ">
      {/* Existing artists — read-only display grid */}
      {existingArtists.length > 0 && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-chino uppercase secondary">
              {existingArtists.length} artist
              {existingArtists.length !== 1 ? "s" : ""} already in lineup
            </p>
            <button
              type="button"
              onClick={() => setIsCollapsed((v) => !v)}
              className="flex items-center gap-1 text-xs text-chino hover:text-cream transition-colors secondary uppercase"
            >
              {isCollapsed ? (
                <>
                  <span>Show</span>
                  <FaChevronDown size={10} />
                </>
              ) : (
                <>
                  <span>Hide</span>
                  <FaChevronUp size={10} />
                </>
              )}
            </button>
          </div>
          {!isCollapsed && (
            <>
              <div className="flex justify-between flex-col lg:flex-row mb-2">
                {/* Phase filter */}
                <LayoutButtons
                  color="bg-stone-900"
                  layoutId="phaseModeToggle"
                  options={PHASE_OPTIONS.map((p) => ({
                    label: p.label,
                    value: p.value ?? "all",
                  }))}
                  activeOption={phaseFilter ?? "all"}
                  onOptionChange={(v) => setPhaseFilter(v === "all" ? null : v)}
                />
                {/* Day filter — only when at least one existing artist has a day assigned */}
                {DAY_FILTER_OPTIONS.length > 1 && (
                  <LayoutButtons
                    color="bg-stone-900"
                    layoutId="dayModeToggle"
                    options={DAY_FILTER_OPTIONS.map((d) => ({
                      label: d.label,
                      value: d.value ?? "all",
                    }))}
                    activeOption={dayFilter ?? "all"}
                    onOptionChange={(v) => setDayFilter(v === "all" ? null : v)}
                  />
                )}
              </div>
              {/* Artist grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {(phaseFilter || dayFilter
                  ? filteredArtists
                  : existingArtists
                ).map((artist, i) => (
                  <ArtistCard
                    key={i}
                    artist={artist}
                    canEdit={canEdit}
                    onEditArtist={onEditArtist}
                    onDeleteArtist={onDeleteArtist}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* New artists input — one section per active day, or single no-day section */}
      <div className="space-y-4">
        {inputSections.map(({ key, label }) => (
          <div key={key || "__noday"} className={`space-y-2 `}>
            <label className="text-xs text-chino block secondary uppercase">
              {label && <span className="text-cream font-bold">{label} </span>}
              {existingArtists.length > 0 ? "Add More Artists" : "Artist Names"}
              {existingArtists.length === 0 && inputSections[0].key === key && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <AdditionalInput
              className="grid grid-cols-5"
              fields={artistsByDay[key] || [""]}
              onChange={(index, value) => handleDayInput(key, index, value)}
              onAdd={() => handleDayAdd(key)}
              onRemove={(index) => handleDayRemove(key, index)}
              placeholder={label ? `Artist name (${label})` : "Artist name"}
              id={`standard-artist-${key || "noday"}`}
              name={`standard-artist-${key || "noday"}`}
              minFields={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ArtistCard = ({ artist, canEdit, onEditArtist, onDeleteArtist }) => (
  <div className="bg-stone-900 border border-stone-700/60 p-2 flex flex-col gap-1 relative group">
    <div className="space-x-1">
      {artist.phase && (
        <span
          className={`text-[8px] px-1.5 py-0.5 border font-bold secondary uppercase self-start ${phaseStyle(artist.phase)}`}
        >
          {artist.phase}
        </span>
      )}
      {artist.day && (
        <span
          className={`text-[8px] px-1.5 py-0.5 border font-bold secondary uppercase self-start ${dayStyle(artist.day)}`}
        >
          {artist.day}
        </span>
      )}
      {artist.support_act && (
        <span className="text-[8px] px-1.5 py-0.5 border border-slate-400 text-slate-400 bg-slate-700/80 font-bold secondary uppercase self-start">
          Support Act
        </span>
      )}
    </div>
    <span className="text-cream/90 pl-0.5 text-md font-bold uppercase leading-none">
      {artist.name}
    </span>

    {canEdit && (
      <div className="flex flex-col gap-1 mt-1 w-fit absolute top-0 right-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEditArtist(artist)}
          className="flex-1 p-1 text-gold text-xs flex items-center justify-center gap-1 transition-colors"
          title="Edit"
        >
          <MdEdit size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteArtist(artist)}
          className="flex-1 p-1 text-red-500 text-xs flex items-center justify-center gap-1 transition-colors"
          title="Delete"
        >
          <FaTrash size={13} />
        </button>
      </div>
    )}
  </div>
);

// ─── Enhanced Stage Card ──────────────────────────────────────────────────────

const StageCard = ({
  stage,
  stageIndex,
  canRemove,
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
      {stage.artists.map((artist, artistIndex) => {
        return (
          <div
            key={artistIndex}
            className="bg-stone-900/50 p-3 border border-chino/15"
          >
            <div className="grid grid-cols-[4fr_2.8fr_0.7fr] items-end gap-2">
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
                    onArtistChange(
                      stageIndex,
                      artistIndex,
                      "day",
                      e.target.value,
                    )
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
            <div className="mt-2 grid grid-cols-2 gap-2 pr-9">
              <div>
                <label className="text-xs text-stone-400">From</label>
                <input
                  type="text"
                  placeholder="e.g. 13:00"
                  className="py-1 text-sm w-full"
                  value={artist.time_from || ""}
                  onChange={(e) =>
                    onArtistChange(
                      stageIndex,
                      artistIndex,
                      "time_from",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs text-stone-400">To</label>
                <input
                  type="text"
                  placeholder="e.g. 14:00"
                  className="py-1 text-sm w-full"
                  value={artist.time_to || ""}
                  onChange={(e) =>
                    onArtistChange(
                      stageIndex,
                      artistIndex,
                      "time_to",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between w-full gap-2 pr-9">
              <span className="text-xs text-chino secondary">Support Act</span>
              <SwitchButton
                size="sm"
                checked={artist.support_act || false}
                onChange={(val) =>
                  onArtistChange(stageIndex, artistIndex, "support_act", val)
                }
              />
            </div>
          </div>
        );
      })}

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
  editionId = null,
  festivalName,
  existingLineup = null,
  existingStandardArtists: initialStandardArtists = [],
  existingStages = [],
  lineupType = "none",
  currentLineupStatus = null,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineupStatus, setLineupStatus] = useState(currentLineupStatus || null);

  // Local copy of existing standard artists — initialise from sessionStorage cache (30 min)
  // so the UI is instantly populated on revisit without waiting for server re-fetch.
  const [existingStandardArtists, setExistingStandardArtists] = useState(() => {
    const cached = loadLineupCache(festivalId, editionId);
    return cached ?? initialStandardArtists;
  });

  // Keep cache in sync with server-provided prop on initial mount
  useEffect(() => {
    if (initialStandardArtists.length > 0) {
      saveLineupCache(festivalId, editionId, initialStandardArtists);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [lineupMode, setLineupMode] = useState(
    lineupType === "standard" ? "standard" : "enhanced",
  );

  // Standard mode state — per-day artist input buckets
  const [activeDays, setActiveDays] = useState([]);
  const [artistsByDay, setArtistsByDay] = useState({ "": [""] });

  // Enhanced mode state
  const [stages, setStages] = useState(() =>
    buildEnhancedInitialStages(
      existingLineup,
      existingStages,
      null,
      lineupStatus,
    ),
  );

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    artist: null,
  });

  // Delete full lineup confirmation state
  const [deleteFullConfirm, setDeleteFullConfirm] = useState(false);
  const [isDeletingFull, setIsDeletingFull] = useState(false);

  // Edit artist modal state
  const [editModal, setEditModal] = useState({ open: false, artist: null });
  const [editForm, setEditForm] = useState({
    name: "",
    phase: null,
    stage_id: "",
    day: "",
    support_act: false,
  });
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Sync non-locked stage artists when lineupStatus changes
  useEffect(() => {
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        artists: stage.artists.map((artist) =>
          artist.phase_locked ? artist : { ...artist, phase: lineupStatus },
        ),
      })),
    );
  }, [lineupStatus]);

  // ── Phase toggle (re-click to clear) ────────────────────────────────────────

  const handlePhaseToggle = (phase) => {
    setLineupStatus((prev) => (prev === phase ? null : phase));
  };

  // ── Day toggle (standard mode — re-click to deselect) ───────────────────────

  const handleDayToggle = (day) => {
    setActiveDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      setArtistsByDay((cur) => ({ ...cur, [day]: cur[day] || [""] }));
      return [...prev, day];
    });
  };

  // ── Mode switching ──────────────────────────────────────────────────────────

  const switchToStandard = () => {
    setLineupMode("standard");
  };

  const switchToEnhanced = () => {
    // When upgrading from standard, prefill all standard artists into stage 1
    const allNames = Object.values(artistsByDay)
      .flat()
      .filter((n) => n.trim());
    const prefill =
      lineupMode === "standard" && allNames.length > 0
        ? allNames.map((name) => ({ name }))
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
        artists: [
          {
            lineup_id: null,
            name: "",
            day: "",
            time_from: "",
            time_to: "",
            phase: lineupStatus,
            phase_locked: false,
          },
        ],
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
        artists: [
          ...stage.artists,
          {
            lineup_id: null,
            name: "",
            day: "",
            time_from: "",
            time_to: "",
            phase: lineupStatus,
            support_act: false,
            phase_locked: false,
          },
        ],
      };
    });
    setStages(next);
  };

  const handleRemoveArtist = async (stageIndex, artistIndex) => {
    const artist = stages[stageIndex]?.artists[artistIndex];

    if (artist?.lineup_id) {
      try {
        const response = await fetch(
          `/api/festivals/lineup?lineup_id=${artist.lineup_id}&festival_id=${festivalId}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          dispatch(
            setError({ message: "Failed to delete artist", type: "error" }),
          );
          return;
        }
      } catch {
        dispatch(
          setError({ message: "Failed to delete artist", type: "error" }),
        );
        return;
      }
    }

    const next = stages.map((stage, si) => {
      if (si !== stageIndex) return stage;
      return {
        ...stage,
        artists: stage.artists.filter((_, ai) => ai !== artistIndex),
      };
    });
    setStages(next);
  };

  // ── Edit / Delete existing standard artists ─────────────────────────────────

  const canUserEdit = user?.is_admin || !!user?.submitted_festival_id;

  const openEditModal = (artist) => {
    setEditForm({
      name: artist.name,
      phase: artist.phase,
      stage_id: artist.stage_id || "",
      day: artist.day || "",
      support_act: artist.support_act || false,
    });
    setEditModal({ open: true, artist });
  };

  const closeEditModal = () => setEditModal({ open: false, artist: null });

  const handleEditSave = async () => {
    if (!editModal.artist?.lineup_id) return;
    setIsEditSaving(true);
    try {
      const response = await fetch("/api/festivals/lineup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_artist",
          lineup_id: editModal.artist.lineup_id,
          festival_id: festivalId,
          edition_id: editionId,
          name: editForm.name,
          phase: editForm.phase,
          stage_id: editForm.stage_id || null,
          day: editForm.day || null,
          support_act: editForm.support_act,
        }),
      });
      if (!response.ok) throw new Error("Failed to update");
      // Update local state + cache instantly
      setExistingStandardArtists((prev) => {
        const updated = prev.map((a) =>
          a.lineup_id === editModal.artist.lineup_id
            ? {
                ...a,
                name: editForm.name,
                phase: editForm.phase,
                day: editForm.day,
                stage_id: editForm.stage_id,
                support_act: editForm.support_act,
              }
            : a,
        );
        saveLineupCache(festivalId, editionId, updated);
        return updated;
      });
      closeEditModal();
    } catch {
      dispatch(setError({ message: "Failed to update artist", type: "error" }));
    } finally {
      setIsEditSaving(false);
    }
  };

  // Opens the delete confirmation modal — actual deletion runs in performDelete
  const handleDeleteArtist = (artist) => {
    setDeleteConfirm({ open: true, artist });
  };

  const performDelete = async () => {
    const artist = deleteConfirm.artist;
    if (!artist) return;
    setDeleteConfirm({ open: false, artist: null });
    try {
      const response = await fetch(
        `/api/festivals/lineup?lineup_id=${artist.lineup_id}&festival_id=${festivalId}&edition_id=${editionId || ""}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete");
      setExistingStandardArtists((prev) => {
        const updated = prev.filter((a) => a.lineup_id !== artist.lineup_id);
        saveLineupCache(festivalId, editionId, updated);
        return updated;
      });
    } catch {
      dispatch(setError({ message: "Failed to delete artist", type: "error" }));
    }
  };

  // ── Delete full lineup ───────────────────────────────────────────────────────

  const handleDeleteFullLineup = async () => {
    setDeleteFullConfirm(false);
    setIsDeletingFull(true);
    try {
      const response = await fetch(
        `/api/festivals/lineup?festival_id=${festivalId}&edition_id=${editionId || ""}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to delete lineup");
      setExistingStandardArtists([]);
      saveLineupCache(festivalId, editionId, []);
      setStages(
        buildEnhancedInitialStages(null, existingStages, null, lineupStatus),
      );
      setActiveDays([]);
      setArtistsByDay({ "": [""] });
      router.refresh();
    } catch {
      dispatch(
        setError({ message: "Failed to delete full lineup", type: "error" }),
      );
    } finally {
      setIsDeletingFull(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const hasExistingData =
    (existingLineup && existingLineup.length > 0) ||
    initialStandardArtists.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(setError(""));

    let body;

    if (lineupMode === "standard") {
      const allNewArtists = [];
      if (activeDays.length === 0) {
        (artistsByDay[""] || [])
          .map((n) => n.trim())
          .filter(Boolean)
          .forEach((name) => {
            allNewArtists.push({ name, phase: lineupStatus || null });
          });
      } else {
        activeDays.forEach((day) => {
          (artistsByDay[day] || [])
            .map((n) => n.trim())
            .filter(Boolean)
            .forEach((name) => {
              allNewArtists.push({ name, day, phase: lineupStatus || null });
            });
        });
      }
      if (existingStandardArtists.length === 0 && allNewArtists.length === 0) {
        dispatch(
          setError({ message: "Add at least one artist name", type: "error" }),
        );
        setIsSubmitting(false);
        return;
      }
      // Only send new artists — existing ones are managed via individual edit/delete.
      body = {
        festival_id: festivalId,
        edition_id: editionId,
        lineup_type: "standard",
        artists: allNewArtists,
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
            lineup_id: a.lineup_id || null,
            name: a.name,
            day: a.day,
            time_from: a.time_from || null,
            time_to: a.time_to || null,
            phase: a.phase_locked ? a.phase : (lineupStatus ?? null),
            support_act: a.support_act || false,
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
        edition_id: editionId,
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

      // Re-fetch updated lineup to get proper lineup_ids for new artists, then update state + cache
      const updatedResponse = await fetch(
        `/api/festivals/lineup?festival_id=${festivalId}&edition_id=${editionId || ""}`,
      );
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        const freshArtists = updatedData.standardArtists || [];
        setExistingStandardArtists(freshArtists);
        saveLineupCache(festivalId, editionId, freshArtists);
      }
      // Reset input fields for each active section
      setArtistsByDay(() => {
        const reset = { "": [""] };
        activeDays.forEach((d) => {
          reset[d] = [""];
        });
        return reset;
      });
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
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div className="">
          <span className="secondary text-xs text-chino">
            <b className="text-cream">NOTE:</b> Adding a new artists instantly
            triggers an email notification to all fans who have turned on lineup
            alerts.
          </span>
        </div>
        {/* ── Announcement Phase + Mode Toggle ── */}
        <div className="bg-stone-900/50 space-y-4">
          {/* Mode toggle row */}
          <div className="flex items-center flex-col gap-1">
            <LayoutButtons
              color="bg-stone-900"
              activeOption={lineupMode}
              onOptionChange={(val) =>
                val === "standard" ? switchToStandard() : switchToEnhanced()
              }
              size="md"
              options={[
                { value: "standard", label: "Simple Lineup Upload" },
                { value: "enhanced", label: "Enhanced Lineup Upload" },
              ]}
            />
            {lineupMode === "standard" ? (
              <span className="text-xs text-chino secondary">
                Best for quick lineup upload. You can assign stages later.
              </span>
            ) : (
              <span className="text-xs text-chino secondary">
                Best for full control over structured lineup, stages, and
                scheduling.
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row justify-between">
            {/* Phase selection — shown for both modes */}
            <div className="">
              <label className="text-lg font-bold text-gold block leading-none">
                Announcement Phase
              </label>
              <p className="text-xs text-chino mb-3 secondary">
                {lineupMode === "enhanced"
                  ? "Select a phase to apply to all new artists you add. Existing artists keep their original phase."
                  : "Select a phase to assign to this set of artists. Click again to deselect."}
              </p>
              <div className="flex gap-2 flex-wrap ">
                {PHASES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePhaseToggle(value)}
                    className={`px-3 py-1 font-semibold text-sm duration-300 border ${phaseStyle(value)} ${
                      lineupStatus === value
                        ? "opacity-100"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day selection — standard mode only */}
            {lineupMode === "standard" && (
              <div className="">
                <label className="text-lg font-bold text-gold lg:text-end block leading-none">
                  Festival Day
                </label>
                <p className="text-xs text-chino mb-3 secondary">
                  Artists added in each day section will be tagged with that
                  day. Click again to deselect.
                </p>
                <div className="flex gap-2 flex-wrap lg:justify-end">
                  {FESTIVAL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1 font-semibold text-sm duration-300 border ${dayStyle(day)} ${
                        activeDays.includes(day)
                          ? "opacity-100"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Standard mode ── */}
        {lineupMode === "standard" && (
          <div className="bg-stone-800/50 p-4 border border-gold/20">
            <StandardLineupSection
              existingArtists={existingStandardArtists}
              activeDays={activeDays}
              artistsByDay={artistsByDay}
              onArtistsByDayChange={setArtistsByDay}
              canEdit={canUserEdit}
              onEditArtist={openEditModal}
              onDeleteArtist={handleDeleteArtist}
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
          {hasExistingData && (
            <Button
              text={isDeletingFull ? "Deleting..." : "Delete Full Lineup"}
              type="remove"
              size="small"
              disabled={isDeletingFull}
              onClick={() => setDeleteFullConfirm(true)}
            />
          )}
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

      {/* ── Edit Artist Modal ── */}
      <GlobalModal
        isOpen={editModal.open}
        onClose={closeEditModal}
        title="Edit Artist"
        maxWidth="max-w-md"
        onSubmit={handleEditSave}
        submitText={isEditSaving ? "Saving..." : "Save Changes"}
        loading={isEditSaving}
        disabled={isEditSaving || !editForm.name?.trim()}
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-chino block mb-1">Artist Name</label>
            <input
              type="text"
              className="py-2 w-full"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          {/* Phase */}
          <div>
            <label className="text-xs text-chino block mb-2">
              Announcement Phase
            </label>
            <div className="flex gap-2 flex-wrap">
              {["first phase", "second phase", "third phase"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setEditForm((f) => ({
                      ...f,
                      phase: f.phase === p ? null : p,
                    }))
                  }
                  className={`px-3 py-1 text-xs font-semibold border capitalize duration-200 ${
                    editForm.phase === p
                      ? phaseStyle(p) + " opacity-100"
                      : "bg-stone-800 border-stone-600 text-stone-400 hover:border-stone-500"
                  }`}
                >
                  {p.replace(" phase", "")} Phase
                </button>
              ))}
            </div>
          </div>

          {/* Stage (if festival has stages) */}
          {existingStages.length > 0 && (
            <div>
              <label className="text-xs text-chino block mb-1">Stage</label>
              <select
                className="py-2 w-full"
                value={editForm.stage_id}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, stage_id: e.target.value }))
                }
              >
                <option value="">No stage assigned</option>
                {existingStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stage_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day */}
          <div>
            <label className="text-xs text-chino block mb-1">Day</label>
            <select
              className="py-2 w-full"
              value={editForm.day}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, day: e.target.value }))
              }
            >
              <option value="">No day assigned</option>
              {FESTIVAL_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Support Act */}
          <div className="flex flex-col items-start">
            <label className="text-xs text-chino secondary">Support Act</label>
            <SwitchButton
              checked={editForm.support_act}
              onChange={(v) => setEditForm((f) => ({ ...f, support_act: v }))}
            />
          </div>
        </div>
      </GlobalModal>

      {/* ── Delete Confirmation Modal ── */}
      <GlobalModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, artist: null })}
        title="Delete Artist"
        maxWidth="max-w-sm"
        hideSubmit
      >
        <div className="space-y-5">
          <p className="text-cream text-sm text-center secondary">
            Are you sure you want to remove{" "}
            <span className="text-gold font-bold uppercase">
              {deleteConfirm.artist?.name}
            </span>{" "}
            from the lineup?
          </p>
          <div className="flex justify-center gap-3">
            <Button
              text="No, Cancel"
              type="success"
              size="small"
              onClick={() => setDeleteConfirm({ open: false, artist: null })}
            />
            <Button
              size="small"
              text="Yes, Delete"
              type="remove"
              onClick={performDelete}
            />
          </div>
        </div>
      </GlobalModal>

      {/* ── Delete Full Lineup Confirmation Modal ── */}
      <GlobalModal
        isOpen={deleteFullConfirm}
        onClose={() => setDeleteFullConfirm(false)}
        title="Delete Full Lineup"
        maxWidth="max-w-sm"
        hideSubmit
      >
        <div className="space-y-5">
          <p className="text-cream text-sm text-center secondary">
            This will permanently remove{" "}
            <span className="text-gold font-bold">all artists and stages</span>{" "}
            for <span className="text-gold font-bold">{festivalName}</span>.
            This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              text="No, Keep It"
              type="success"
              size="small"
              onClick={() => setDeleteFullConfirm(false)}
            />
            <Button
              size="small"
              text="Yes, Delete All"
              type="remove"
              onClick={handleDeleteFullLineup}
            />
          </div>
        </div>
      </GlobalModal>
    </SectionContainer>
  );
};

export default AddFestivalLineupForm;
