"use client";

import {
  AuditPanel,
  Card,
  SectionTitle,
  StatRow,
} from "../AuditPanels";

const HeaderStatsSlug = () => (
  <AuditPanel endpoint="/api/admin/audit/header">
    {(data) => (
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: "Artists", value: data.totals.artists },
            { label: "Clubs", value: data.totals.clubs },
            { label: "Festivals", value: data.totals.festivals },
            { label: "Events", value: data.totals.events },
            { label: "News", value: data.totals.news },
          ].map((stat) => (
            <Card key={stat.label} className="flex flex-col gap-1 p-4">
              <span className="secondary text-[10px] font-bold uppercase tracking-widest text-cream">
                {stat.label}
              </span>
              <span className="text-2xl font-bold tabular-nums text-gold">
                {stat.value?.toLocaleString() ?? "-"}
              </span>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col gap-3">
          <SectionTitle text="Users" />
          <StatRow label="Total registered" value={data.users.total} accent />
          <StatRow label="New today" value={data.users.today} />
          <StatRow label="New last 7 days" value={data.users.lastWeek} />
          <StatRow label="New last 30 days" value={data.users.lastMonth} />
        </Card>
      </div>
    )}
  </AuditPanel>
);

export default HeaderStatsSlug;
