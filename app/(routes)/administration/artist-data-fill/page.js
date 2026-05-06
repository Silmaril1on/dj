"use client";
import { useEffect, useState, useCallback } from "react";
import { resolveImage } from "@/app/helpers/utils";
import Link from "next/link";

const FIELDS = ["country", "city", "birth", "description", "artist_slug"];

function isEmptyValue(v) {
  return v === null || v === undefined || v === "";
}

const ArtistRow = ({ artist, onChange, onSave, saving }) => {
  const imageSrc = resolveImage(artist.image_url, "sm");
  const displayName = artist.stage_name || artist.name;

  return (
    <div className="flex flex-col lg:flex-row gap-3 border border-gold/20 bg-stone-900 p-3">
      {/* Image + name */}
      <div className="flex items-start gap-3 min-w-[200px]">
        <div className="w-14 h-14 shrink-0 overflow-hidden bg-stone-800 border border-gold/20">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={displayName}
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
            {displayName}
          </p>

          <Link
            href={`/artists/${artist.artist_slug}`}
            target="_blank"
            className="text-gold/70 text-xs hover:text-gold underline"
          >
            {artist.artist_slug || "—"}
          </Link>
        </div>
      </div>

      {/* 🔥 ALWAYS RENDER ALL FIELDS */}
      <div className="flex flex-wrap gap-2 flex-1">
        {FIELDS.map((field) => (
          <div key={field} className="flex flex-col gap-0.5 min-w-[140px]">
            <label className="text-chino text-[10px] uppercase">{field}</label>

            <input
              type="text"
              value={artist[field] ?? ""}
              onChange={(e) => onChange(artist.id, field, e.target.value)}
              placeholder={`Enter ${field}`}
              className={`px-2 py-1 border ${
                isEmptyValue(artist[field])
                  ? "border-red-500"
                  : "border-green-500"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex flex-row lg:flex-col gap-2 items-start">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(artist.id)}
          className="px-3 py-1.5 bg-gold text-black text-xs font-bold uppercase hover:bg-gold/80 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

const ArtistDataFill = () => {
  const [tab, setTab] = useState("pending");
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState(new Set());

  const fetchArtists = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/artists-fill?status=${status}`, {
        cache: "no-store",
      });
      const json = await res.json();
      setArtists(json.artists || []);
    } catch {
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtists(tab);
  }, [tab, fetchArtists]);

  const handleChange = useCallback((id, field, value) => {
    setArtists((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  }, []);

  const handleSave = useCallback(
    async (id) => {
      const artist = artists.find((a) => a.id === id);
      if (!artist) return;

      setSavingIds((prev) => new Set(prev).add(id));

      try {
        const res = await fetch("/api/admin/artists-fill", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: [
              {
                id,
                country: artist.country || null,
                city: artist.city || null,
                birth: artist.birth || null,
                description: artist.description || null,
                artist_slug: artist.artist_slug || null,
              },
            ],
          }),
        });

        if (res.ok) {
          // ✅ remove row immediately
          setArtists((prev) => prev.filter((a) => a.id !== id));
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
    [artists],
  );

  return (
    <div className="min-h-screen bg-black text-cream px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-gold text-2xl font-bold uppercase">
          Artist Data Fill
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
        ) : artists.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            No artists found
          </div>
        ) : (
          <div className="space-y-2">
            {artists.map((artist) => (
              <ArtistRow
                key={artist.id}
                artist={artist}
                onChange={handleChange}
                onSave={handleSave}
                saving={savingIds.has(artist.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistDataFill;
