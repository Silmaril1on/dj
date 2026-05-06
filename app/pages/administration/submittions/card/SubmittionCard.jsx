"use client";
import { useState } from "react";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import ArtistName from "@/app/components/materials/ArtistName";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Paragraph from "@/app/components/ui/Paragraph";
import FlexBox from "@/app/components/containers/FlexBox";
import Button from "@/app/components/buttons/Button";
import { setError } from "@/app/features/modalSlice";
import { slideTop } from "@/app/framer-motion/motionValues";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MdCheck } from "react-icons/md";
import { useDispatch } from "react-redux";
import ActionButtons from "./ActionButtons";
import Title from "@/app/components/ui/Title";
import { truncateString } from "@/app/helpers/utils";

const SubmittionCard = ({ submissions, type = "artist" }) => {
  const dispatch = useDispatch();
  const [loadingStates, setLoadingStates] = useState({});
  const [submissionsList, setSubmissionsList] = useState(submissions);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const isClub = type === "club";
  const isEvent = type === "event";
  const isFestival = type === "festival";
  const apiEndpoint = `/api/admin/submitted-data/${type}`;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getEditHref = (submissionId) => {
    const idParamByType = {
      artist: "artistId",
      club: "clubId",
      event: "eventId",
      festival: "festivalId",
    };

    const idParam = idParamByType[type] || `${type}Id`;
    return `/add-product/${type}?edit=true&${idParam}=${encodeURIComponent(submissionId)}`;
  };

  const handleApproveAll = async () => {
    if (submissionsList.length === 0) return;

    setIsBulkApproving(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_all" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to approve all submissions");
      }

      setSubmissionsList([]);
      dispatch(
        setError({
          message:
            result?.message ||
            `${type.charAt(0).toUpperCase() + type.slice(1)} submissions approved successfully`,
          type: "success",
        }),
      );
    } catch (error) {
      dispatch(
        setError({
          message: error.message || "Failed to approve all submissions",
          type: "error",
        }),
      );
      console.error("Error approving all submissions:", error);
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsApproving(true);
    const selected = submissionsList.filter((s) => selectedIds.has(s.id));
    try {
      await Promise.all(
        selected.map((submission) =>
          fetch(apiEndpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: submission.id, action: "approve" }),
          }),
        ),
      );
      setSubmissionsList((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      dispatch(
        setError({
          message: `${selected.length} submission${selected.length !== 1 ? "s" : ""} approved successfully`,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        setError({
          message: "Failed to approve selected submissions",
          type: "error",
        }),
      );
    } finally {
      setIsApproving(false);
    }
  };

  if (submissionsList.length === 0) {
    return (
      <FlexBox type="center-col" className="py-14">
        <p className="text-gold/70 text-lg">No pending submissions</p>
      </FlexBox>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-gold/80 text-sm">
          {submissionsList.length} pending submission
          {submissionsList.length !== 1 ? "s" : ""}
          {selectedIds.size > 0 && (
            <span className="ml-2 text-cream/60">
              · {selectedIds.size} selected
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              text={`Approve Selected (${selectedIds.size})`}
              icon={<MdCheck />}
              size="small"
              type="success"
              onClick={handleApproveSelected}
              loading={isApproving}
            />
          )}
          <Button
            text="Approve All"
            icon={<MdCheck />}
            size="small"
            type="success"
            onClick={handleApproveAll}
            loading={isBulkApproving}
            disabled={submissionsList.length === 0}
          />
        </div>
      </div>

      <div className="gap-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 overflow-hidden">
        {submissionsList?.map((submission, index) => (
          <motion.div
            key={submission.id}
            variants={slideTop}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
            className={`relative bg-stone-900 bordered p-2 group space-y-3 ${
              selectedIds.has(submission.id) ? "ring-1 ring-gold/60" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSelect(submission.id)}
              className={`absolute top-2 left-2 z-20 w-5 h-5 border flex items-center justify-center transition-colors ${
                selectedIds.has(submission.id)
                  ? "bg-gold border-gold text-black"
                  : "bg-black/60 border-gold/40 text-transparent"
              }`}
              aria-label="Select submission"
            >
              <MdCheck className="text-xs" />
            </button>
            <Link
              href={getEditHref(submission.id)}
              className="absolute top-2 right-2 z-20 text-xs uppercase tracking-wide bg-black/80 border border-gold/50 text-gold hover:text-black hover:bg-gold px-2 py-1 duration-200"
            >
              Edit
            </Link>
            <div className="relative w-full h-48 mb-4 overflow-hidden shadow-lg">
              <Image
                src={submission.artist_image}
                alt={submission.name}
                fill
                className="object-cover brightness-90 group-hover:brightness-100 duration-300"
              />
            </div>
            <div>
              {isClub || isEvent || isFestival ? (
                <Title
                  className="uppercase"
                  text={truncateString(submission.name, 20)}
                />
              ) : (
                <ArtistName artistName={submission} />
              )}
              <ArtistCountry artistCountry={submission} />
              {isClub && submission.capacity && (
                <div className="mt-2">
                  <p className="text-gold/80 text-sm font-medium">
                    Capacity:{" "}
                    <span className="text-cream">{submission.capacity}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-gold/20 pt-3">
              <Paragraph text="Submitted by:" />
              <FlexBox type="row-start" className="gap-2 items-center">
                <ProfilePicture
                  avatar_url={submission?.submitter?.user_avatar}
                  type="icon"
                />
                <div className="flex-1 text-xs min-w-0">
                  <p className="text-gold ">{submission.submitter?.userName}</p>
                  <p className=" text-gold/60">{submission.submitter?.email}</p>
                </div>
              </FlexBox>
            </div>
            <ActionButtons
              submission={submission}
              loadingStates={loadingStates}
              setLoadingStates={setLoadingStates}
              submissionsList={submissionsList}
              setSubmissionsList={setSubmissionsList}
              type={type}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SubmittionCard;
