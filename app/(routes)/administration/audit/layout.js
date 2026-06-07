import React from "react";
import SectionContainer from "@/app/components/containers/SectionContainer";

export const dynamic = "force-dynamic";

const AuditLayout = ({
  headerStatsSlug,
  tableStatsSlug,
  tableStorageSlug,
  bucketStorageSlug,
}) => {
  return (
    <SectionContainer title="Soundfolio analytics" description="Platform Audit">
      <div className="grid w-full gap-3">
        {headerStatsSlug}
        {tableStatsSlug}
        <div className="grid w-full gap-3 grid-cols-2">
          {tableStorageSlug}
          {bucketStorageSlug}
        </div>
      </div>
    </SectionContainer>
  );
};

export default AuditLayout;
