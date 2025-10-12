"use client";
import Button from "@/app/components/buttons/Button";
import SectionContainer from "@/app/components/containers/SectionContainer";
import AbsoluteLogo from "@/app/components/materials/AbsoluteLogo";
import { formatBirthdate, markdownToHtml, truncateBio } from "@/app/helpers/utils";
import { useState } from "react";

const Bio = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewLength = 2000;
  const paragraphs = data.bio.replace(/\\n/g, "\n").split("\n\n");
  const fullBio = paragraphs.join("\n\n");
  const previewBio = truncateBio(fullBio, previewLength);

  return (
    <SectionContainer title="Artist Biography" className="bg-stone-900" description={`Born • ${formatBirthdate(data.birth)}`}>
      <div className="px-5 lg:px-[15%] py-10 text-cream bg-stone-900 space-y-3 relative">
        <AbsoluteLogo y="bottom-10" x="right-10" size="md" />
        <div
          className="secondary pointer-events-none text-[10px] lg:text-sm pr-4"
          dangerouslySetInnerHTML={{
            __html: markdownToHtml(isExpanded ? fullBio : previewBio)
          }}
        />

        {fullBio.length > previewLength && (
          <Button
            text={isExpanded ? "Read Less" : "Read More"}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        )}
      </div>
    </SectionContainer>
  );
};

export default Bio;