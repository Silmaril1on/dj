"use client";

import {
  AuditPanel,
  Card,
  SectionTitle,
  StatRow,
  formatBytes,
} from "../AuditPanels";

const TableStorageSlug = () => (
  <AuditPanel endpoint="/api/admin/audit/table-storage">
    {(data) => {
      const storage = data.storage;
      const sizeLabel = (bytes) =>
        storage.isExact ? formatBytes(bytes) : "Size pending";

      return (
        <Card>
          <SectionTitle text="Table Storage Usage" />
          {!storage.isExact && (
            <p className="mb-3 border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-300">
              {storage.message}
            </p>
          )}
          <div className="mb-2">
            <StatRow
              label={
                storage.isExact
                  ? "Tracked table storage"
                  : "Tracked rows, exact bytes pending"
              }
              value={sizeLabel(storage.totalBytes)}
              accent
            />
          </div>

          <div className="divide-y divide-gold/10">
            {storage.groups.map((group) => (
              <div key={group.key} className="py-3">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 text-sm">
                  <span className="font-semibold uppercase text-cream">
                    {group.label}
                  </span>
                  <span className="tabular-nums text-cream/70">
                    {group.rowEstimate.toLocaleString()} rows est.
                  </span>
                  <span className="font-bold tabular-nums text-gold">
                    {sizeLabel(group.totalBytes)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {group.tables.map((table) => (
                    <span
                      key={table.tableName}
                      className="secondary border border-gold/15 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-chino"
                    >
                      {storage.isExact
                        ? `${table.tableName}: ${formatBytes(table.totalBytes)}`
                        : `${table.tableName}: ${table.rowEstimate.toLocaleString()} rows est.`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }}
  </AuditPanel>
);

export default TableStorageSlug;
