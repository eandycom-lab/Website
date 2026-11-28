export type TriStateStatus = "confirmed" | "not_reported" | "unknown";

export type RadarEventType =
  | "security"
  | "breaking_changes"
  | "feature"
  | "bugfix"
  | "unclear";

export type ReleaseProcessingStatus =
  | "pending_analysis"
  | "needs_review"
  | "approved"
  | "rejected"
  | "error";

export interface EvidenceItem {
  field: string;
  quote: string;
}

export interface ReleaseSummaryPayload {
  title_de: string;
  summary_de: string;
  changes: string[];
  upgrade_notes: string[];
  security_status: TriStateStatus;
  breaking_changes_status: TriStateStatus;
  event_types: RadarEventType[];
  evidence: EvidenceItem[];
  needs_review: boolean;
}

export interface PublishedRadarItem {
  id: string;
  appId: string;
  appSlug: string;
  appName: string;
  domainCategory: string;
  version: string;
  publishedAt: string;
  sourceUrl: string;
  revision: number;
  titleDe: string;
  summaryDe: string;
  changes: string[];
  upgradeNotes: string[];
  securityStatus: TriStateStatus;
  breakingChangesStatus: TriStateStatus;
  eventTypes: RadarEventType[];
}

const VALID_TRI_STATE = new Set<TriStateStatus>(["confirmed", "not_reported", "unknown"]);
const VALID_EVENT_TYPES = new Set<RadarEventType>([
  "security",
  "breaking_changes",
  "feature",
  "bugfix",
  "unclear",
]);

export function sanitizePlainText(input: unknown, maxLen = 600): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function validateReleaseSummary(
  raw: unknown,
  rawNotesSource: string
): { ok: true; value: ReleaseSummaryPayload } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "LLM output is not an object" };
  }
  const obj = raw as Record<string, unknown>;

  const title_de = sanitizePlainText(obj.title_de, 160);
  const summary_de = sanitizePlainText(obj.summary_de, 900);
  if (!title_de || !summary_de) {
    return { ok: false, reason: "Missing title_de or summary_de" };
  }

  const security_status = VALID_TRI_STATE.has(obj.security_status as TriStateStatus)
    ? (obj.security_status as TriStateStatus)
    : "unknown";
  const breaking_changes_status = VALID_TRI_STATE.has(
    obj.breaking_changes_status as TriStateStatus
  )
    ? (obj.breaking_changes_status as TriStateStatus)
    : "unknown";

  const changes = Array.isArray(obj.changes)
    ? obj.changes.map((c) => sanitizePlainText(c, 280)).filter(Boolean).slice(0, 12)
    : [];
  const upgrade_notes = Array.isArray(obj.upgrade_notes)
    ? obj.upgrade_notes.map((u) => sanitizePlainText(u, 320)).filter(Boolean).slice(0, 10)
    : [];

  const rawEvents = Array.isArray(obj.event_types) ? obj.event_types : [];
  const eventTypesSet = new Set<RadarEventType>(
    rawEvents.filter((e): e is RadarEventType => VALID_EVENT_TYPES.has(e as RadarEventType))
  );
  if (security_status === "confirmed") eventTypesSet.add("security");
  if (breaking_changes_status === "confirmed") eventTypesSet.add("breaking_changes");
  if (eventTypesSet.size === 0) eventTypesSet.add("unclear");

  const normalizedSource = rawNotesSource.toLowerCase().replace(/\s+/g, " ");
  const evidence: EvidenceItem[] = [];
  if (Array.isArray(obj.evidence)) {
    for (const item of obj.evidence.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      const ev = item as Record<string, unknown>;
      const field = sanitizePlainText(ev.field, 80);
      const quote = sanitizePlainText(ev.quote, 220);
      if (!field || !quote) continue;
      if (normalizedSource.includes(quote.toLowerCase())) {
        evidence.push({ field, quote });
      }
    }
  }

  const requiresReview =
    obj.needs_review === true ||
    security_status === "confirmed" ||
    breaking_changes_status === "confirmed" ||
    upgrade_notes.length > 0 ||
    evidence.length === 0;

  return {
    ok: true,
    value: {
      title_de,
      summary_de,
      changes,
      upgrade_notes,
      security_status,
      breaking_changes_status,
      event_types: Array.from(eventTypesSet),
      evidence,
      needs_review: requiresReview,
    },
  };
}
