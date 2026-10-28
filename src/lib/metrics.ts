import type { Row } from "./sheets.functions";

/** Parses source numbers ("265,3" → 265.3). Returns null for missing — never 0. */
export function num(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export const fmt = (v: number | null, digits = 0) =>
  v === null ? ((typeof document !== "undefined" && document.documentElement.lang === "en") ? "no data" : "немає даних") : v.toLocaleString(typeof document !== "undefined" && document.documentElement.lang === "en" ? "en-GB" : "uk-UA", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const weekKey = (r: Row) => `${r.year}-${String(r.week).padStart(2, "0")}`;

export function listWeeks(rows: Row[]) {
  return Array.from(new Set(rows.map(weekKey))).sort();
}

/** Territorial rows only — the "total" row must never be added to them. */
export const territorial = (rows: Row[]) => rows.filter((r) => r.record_type !== "total");
export const totalRow = (rows: Row[]) => rows.find((r) => r.record_type === "total");

export type Level = "below" | "low" | "medium" | "high" | "nodata";
export function intensityLevel(r: Row): Level {
  const v = num(r.incidence_per_100k);
  const lo = num(r.intensity_low_threshold);
  const md = num(r.intensity_medium_threshold);
  const hi = num(r.intensity_high_threshold);
  if (v === null || lo === null || md === null || hi === null) return "nodata";
  if (v >= hi) return "high";
  if (v >= md) return "medium";
  if (v >= lo) return "low";
  return "below";
}

export const levelLabel: Record<Level, string> = {
  below: (typeof document !== "undefined" && document.documentElement.lang === "en") ? "Below epidemic threshold" : "Нижче епідпорогу",
  low: (typeof document !== "undefined" && document.documentElement.lang === "en") ? "Low" : "Низький",
  medium: (typeof document !== "undefined" && document.documentElement.lang === "en") ? "Medium" : "Середній",
  high: (typeof document !== "undefined" && document.documentElement.lang === "en") ? "High" : "Високий",
  nodata: (typeof document !== "undefined" && document.documentElement.lang === "en") ? "Threshold data unavailable" : "Немає даних про пороги",
};

export const AGE_GROUPS = [
  ["cases_age_under_1", "до 1 року"],
  ["cases_age_1_4", "1–4"],
  ["cases_age_5_9", "5–9"],
  ["cases_age_10_14", "10–14"],
  ["cases_age_15_17", "15–17"],
] as const;

export const RISK_GROUPS = [
  ["chronic_conditions", "Хронічні захворювання"],
  ["age_over_65", "Віком 65+"],
  ["long_term_care_residents", "Заклади довгострокового догляду"],
  ["children_age_6_months_to_5_years", "Діти 6 міс – 5 років"],
  ["healthcare_workers", "Медичні працівники"],
  ["pregnant_people", "Вагітні"],
  ["other_risk_groups", "Інші групи ризику"],
] as const;

export const RECORD_TYPE_LABEL: Record<string, string> = {
  district: "район",
  city: "місто",
  total: "підсумок",
};
