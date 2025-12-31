"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import Button from "@/app/components/buttons/Button";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import { SiMusicbrainz } from "react-icons/si";
import { MdCloudDownload } from "react-icons/md";

const ImportAlbumsButton = ({
  artistId,
  artistName,
  onSuccess,
  variant = "button",
}) => {
  const dispatch = useDispatch();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImport = async () => {
    if (!artistId) {
      dispatch(
        setError({
          message: "Artist ID is required",
          type: "error",
        })
      );
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/automation/import-albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artistId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import albums");
      }

      const result = await response.json();
      setImportResult(result);

      if (result.imported > 0) {
        dispatch(
          setError({
            message: result.message,
            type: "success",
          })
        );

        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(result);
          }, 2000);
        }
      } else {
        dispatch(
          setError({
            message: result.message || "No new albums to import",
            type: "info",
          })
        );
      }
    } catch (error) {
      console.error("Error importing albums:", error);
      dispatch(
        setError({
          message: error.message,
          type: "error",
        })
      );
    } finally {
      setIsImporting(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleImport}
        disabled={isImporting}
        className="bg-gold/30 hover:bg-gold/40 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-1 text-sm px-2 py-1 font-bold duration-300"
        title="Import albums from MusicBrainz"
      >
        {isImporting ? (
          <div className="animate-spin">⏳</div>
        ) : (
          <MdCloudDownload size={18} />
        )}
        <span>{isImporting ? "Importing..." : "Import Albums"}</span>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleImport}
        loading={isImporting}
        text={
          isImporting
            ? "Importing from MusicBrainz..."
            : "Import Albums from MusicBrainz"
        }
        icon={<SiMusicbrainz />}
      />

      {importResult && (
        <div className="bg-stone-900 p-4 rounded-md border border-gold/30">
          <Title text="Import Results" size="sm" className="mb-2" />
          <div className="space-y-1 text-sm">
            <Paragraph text={`Total found: ${importResult.totalFound || 0}`} />
            <Paragraph
              text={`✅ Imported: ${importResult.imported || 0}`}
              color="green"
            />
            <Paragraph
              text={`⏭️ Skipped (already exist): ${importResult.skipped || 0}`}
              color="yellow"
            />
            {importResult.mbArtistName && (
              <Paragraph
                text={`MusicBrainz Artist: ${importResult.mbArtistName}`}
                color="chino"
              />
            )}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2">
                <Paragraph text="Errors:" color="red" />
                <ul className="list-disc list-inside text-red-400 text-xs">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportAlbumsButton;
