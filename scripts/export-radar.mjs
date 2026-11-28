import { execFileSync } from "node:child_process";
import fs from "node:fs";

const approveAll = process.argv.includes("--approve-all");

function runD1(sql) {
  const out = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "sysai-radar", "--remote", "--json", "--command", sql],
    { encoding: "utf8" }
  );
  const parsed = JSON.parse(out);
  return parsed[0]?.results ?? [];
}

if (approveAll) {
  runD1(`UPDATE releases SET processing_status = 'approved', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE processing_status = 'needs_review';`);
  runD1(`UPDATE release_summaries SET reviewed_at = COALESCE(reviewed_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')), published_at = COALESCE(published_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE release_id IN (SELECT id FROM releases WHERE processing_status = 'approved');`);
}

const rows = runD1(`
SELECT
  a.id AS appId,
  a.slug AS appSlug,
  a.name AS appName,
  a.domain_category AS domainCategory,
  r.id AS releaseDbId,
  r.version AS version,
  r.published_at AS publishedAt,
  r.source_url AS sourceUrl,
  s.revision AS revision,
  s.title_de AS titleDe,
  s.summary_de AS summaryDe,
  s.changes_json AS changesJson,
  s.upgrade_notes_json AS upgradeNotesJson,
  s.security_status AS securityStatus,
  s.breaking_changes_status AS breakingChangesStatus,
  s.event_types_json AS eventTypesJson,
  s.evidence_json AS evidenceJson
FROM releases r
JOIN applications a ON a.id = r.application_id
JOIN release_summaries s ON s.release_id = r.id
WHERE r.processing_status = 'approved'
  AND s.revision = (SELECT MAX(s2.revision) FROM release_summaries s2 WHERE s2.release_id = r.id)
ORDER BY r.published_at DESC
LIMIT 100;
`);

const items = rows.map((row) => ({
  id: `${row.appSlug}-${row.releaseDbId}`,
  appId: row.appId,
  appSlug: row.appSlug,
  appName: row.appName,
  domainCategory: row.domainCategory,
  version: row.version,
  publishedAt: row.publishedAt,
  sourceUrl: row.sourceUrl,
  revision: Number(row.revision ?? 1),
  titleDe: row.titleDe,
  summaryDe: row.summaryDe,
  changes: JSON.parse(row.changesJson || "[]"),
  upgradeNotes: JSON.parse(row.upgradeNotesJson || "[]"),
  securityStatus: row.securityStatus || "unknown",
  breakingChangesStatus: row.breakingChangesStatus || "unknown",
  eventTypes: JSON.parse(row.eventTypesJson || "[]"),
  evidence: JSON.parse(row.evidenceJson || "[]"),
}));

const snapshot = {
  generatedAt: new Date().toISOString(),
  isPreviewSample: false,
  items,
};

fs.writeFileSync("src/data/radar-snapshot.json", JSON.stringify(snapshot, null, 2) + "\n", "utf8");
console.log(`Exportiert: ${items.length} freigegebene Releases nach src/data/radar-snapshot.json`);
