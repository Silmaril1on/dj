"use client";
import SectionContainer from "@/app/components/containers/SectionContainer";
import FlexBox from "@/app/components/containers/FlexBox";
import SubmittionCard from "./card/SubmittionCard";
import ImageUploadAutomation from "./ImageUploadAutomation";

const Submittions = ({ submissions, type = "artist" }) => {
  const isClub = type === "club";
  const isEvent = type === "event";
  const isFestival = type === "festival";
  const title = isClub
    ? "Club Submissions"
    : isEvent
      ? "Event Submissions"
      : isFestival
        ? "Festival Submissions"
        : "Artist Submissions";
  const description = isClub
    ? "Review and approve pending club submissions"
    : isEvent
      ? "Review and approve pending event submissions"
      : isFestival
        ? "Review and approve pending festival submissions"
        : "Review and approve pending artist submissions";

  if (submissions.length === 0) {
    return (
      <SectionContainer title={title} description={description}>
        {type === "artist" && <ImageUploadAutomation />}
        <FlexBox type="center-col" className="py-20">
          <p className="text-gold/70 text-lg">No pending submissions</p>
        </FlexBox>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer title={title} description={description}>
      <div className="w-full flex flex-col">
        {type === "artist" && <ImageUploadAutomation />}
        <SubmittionCard submissions={submissions} type={type} />
      </div>
    </SectionContainer>
  );
};

export default Submittions;
