"use client";
import { useEffect, useState, useCallback } from "react";
import { resolveImage } from "@/app/helpers/utils";
import Link from "next/link";

const FIELDS = ["name", "address", "description", "capacity", "venue_email"];

function isEmptyValue(v) {
  if (Array.isArray(v)) return v.length === 0;
  return v === null || v === undefined || v === "";
}

const ClubRow = ({ club, onChange, onSave, saving }) => {
  const imageSrc = resolveImage(club.image_url, "sm");

  // social_links is text[] – edit as newline-separated textarea
  const linksText = Array.isArray(club.social_links)
    ? club.social_links.join("\n")
    : (club.social_links ?? "");

  const handleLinksChange = (e) => {
    // Keep empty lines so the user can press Enter and type on the next line.
    // Empty lines are stripped only on save.
    const lines = e.target.value.split("\n").map((l) => l.trim());
    onChange(club.id, "social_links", lines);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 border border-gold/20 bg-stone-900 p-3">
      {/* Image + name */}
      <div className="flex items-start gap-3 min-w-[200px]">
        <div className="w-14 h-14 shrink-0 overflow-hidden bg-stone-800 border border-gold/20">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs">
              No img
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-cream font-bold text-sm uppercase leading-none">
            {club.name}
          </p>
          <Link
            href={`/clubs/${club.club_slug}`}
            target="_blank"
            className="text-gold/70 text-xs hover:text-gold underline"
          >
            {club.club_slug || "—"}
          </Link>
        </div>
      </div>

      {/* Editable fields */}
      <div className="flex flex-col gap-2 w-full">
        <div className="grid grid-cols-5 gap-2 w-full">
          {FIELDS.map((field) => (
            <div key={field} className="">
              <label className="text-chino text-[10px] uppercase">
                {field}
              </label>
              <input
                type={field === "capacity" ? "number" : "text"}
                value={
                  field === "capacity"
                    ? (club[field] ?? "")
                    : (club[field] ?? "")
                }
                onChange={(e) =>
                  onChange(
                    club.id,
                    field,
                    field === "capacity"
                      ? e.target.value === ""
                        ? null
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
                placeholder={`Enter ${field}`}
                className={`px-2 py-1 border bg-black text-cream text-sm ${
                  isEmptyValue(club[field])
                    ? "border-red-500"
                    : "border-green-500"
                }`}
              />
            </div>
          ))}
        </div>
        {/* social_links – textarea, one URL per line */}
        <div className="flex flex-col gap-0.5 w-full">
          <label className="text-chino text-[10px] uppercase">
            social_links (one per line)
          </label>
          <textarea
            rows={3}
            value={linksText}
            onChange={handleLinksChange}
            placeholder="https://instagram.com/…"
            className={`px-2 py-1 border bg-black text-cream text-sm resize-y ${
              isEmptyValue(club.social_links)
                ? "border-red-500"
                : "border-green-500"
            }`}
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex flex-row lg:flex-col gap-2 items-start">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(club.id)}
          className="px-3 py-1.5 bg-gold text-black text-xs font-bold uppercase hover:bg-gold/80 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

const ClubsDataFill = () => {
  const [tab, setTab] = useState("pending");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState(new Set());

  const fetchClubs = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clubs-fill?status=${status}`, {
        cache: "no-store",
      });
      const json = await res.json();
      setClubs(json.clubs || []);
    } catch {
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs(tab);
  }, [tab, fetchClubs]);

  const handleChange = useCallback((id, field, value) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  }, []);

  const handleSave = useCallback(
    async (id) => {
      const club = clubs.find((c) => c.id === id);
      if (!club) return;

      setSavingIds((prev) => new Set(prev).add(id));

      try {
        const res = await fetch("/api/admin/clubs-fill", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: [
              {
                id,
                name: club.name || null,
                address: club.address || null,
                description: club.description || null,
                capacity: club.capacity ?? null,
                venue_email: club.venue_email || null,
                social_links: (() => {
                  const filtered = Array.isArray(club.social_links)
                    ? club.social_links.filter((s) => s !== "")
                    : [];
                  return filtered.length > 0 ? filtered : null;
                })(),
              },
            ],
          }),
        });

        if (res.ok) {
          setClubs((prev) => prev.filter((c) => c.id !== id));
        }
      } catch {
        // ignore
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [clubs],
  );

  return (
    <div className="min-h-screen bg-black text-cream px-4 py-8">
      <div className="w-full space-y-6">
        <h1 className="text-gold text-2xl font-bold uppercase">
          Club Data Fill
        </h1>

        {/* Tabs */}
        <div className="flex gap-2">
          {["pending", "approved"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={`px-4 py-2 text-sm font-bold uppercase ${
                tab === s
                  ? "bg-gold text-black"
                  : "border border-gold/30 text-gold"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-stone-900 animate-pulse border border-gold/10"
              />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="py-16 text-center text-stone-500">No clubs found</div>
        ) : (
          <div className="space-y-2">
            {clubs.map((club) => (
              <ClubRow
                key={club.id}
                club={club}
                onChange={handleChange}
                onSave={handleSave}
                saving={savingIds.has(club.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsDataFill;
