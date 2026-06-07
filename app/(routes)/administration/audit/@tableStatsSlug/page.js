"use client";

import { AuditPanel, ContentStatsCard } from "../AuditPanels";

const TableStatsSlug = () => (
  <AuditPanel endpoint="/api/admin/audit/middle">
    {(data) => (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ContentStatsCard title="Artists" stats={data.artists} />
        <ContentStatsCard title="Clubs" stats={data.clubs} />
        <ContentStatsCard
          title="Festivals"
          stats={data.festivals}
          showDateStatus
        />
        <ContentStatsCard title="Events" stats={data.events} showDateStatus />
      </div>
    )}
  </AuditPanel>
);

export default TableStatsSlug;
