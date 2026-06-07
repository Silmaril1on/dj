"use client";

import {
  AuditPanel,
  Badge,
  Card,
  SectionTitle,
  StatRow,
  formatBytes,
} from "../AuditPanels";

const BucketStorageSlug = () => (
  <AuditPanel endpoint="/api/admin/audit/bucket-storage">
    {(data) => {
      const storage = data.storage;

      return (
        <Card>
          <SectionTitle text="Supabase Storage Usage" />
          <div className="mb-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <StatRow
              label="Total image files"
              value={storage.imageCount}
              accent
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-cream/60">Total storage</span>
              <span className="font-bold tabular-nums text-gold">
                {formatBytes(storage.totalBytes)}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gold/10">
            {storage.buckets.map((bucket) => (
              <div
                key={bucket.name}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold text-cream">
                    {bucket.name}
                  </span>
                  {bucket.public && <Badge value="PUBLIC" />}
                </div>
                <span className="tabular-nums text-cream">
                  {bucket.imageCount?.toLocaleString() ?? "-"} images
                </span>
                <span className="tabular-nums text-cream/70">
                  {formatBytes(bucket.totalBytes)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      );
    }}
  </AuditPanel>
);

export default BucketStorageSlug;
