import { createServerFn } from "@tanstack/react-start";

const SHEET_ID = "1Oxri7kz6UMFpkTENTjoQUHwY5yCuhczJY22c0K5fqbI";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

export type Row = Record<string, string | null>;
export interface DashboardData {
  respiratory: Row[];
  vaccination: Row[];
  fetchedAt: string;
  error?: string;
}

function toRows(values: string[][] | undefined): Row[] {
  if (!values || values.length < 2) return [];
  const [header, ...rest] = values;
  return rest
    .filter((r) => r.some((c) => c !== ""))
    .map((r) => {
      const o: Row = {};
      header.forEach((h, i) => {
        const v = r[i];
        o[h] = v === undefined || v === "" || v === "-" ? null : v;
      });
      return o;
    });
}

export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const lovable = process.env["LOVABLE_API_KEY"];
    const conn = process.env["GOOGLE_SHEETS_API_KEY"];
    const fetchedAt = new Date().toISOString();
    if (!lovable || !conn)
      return { respiratory: [], vaccination: [], fetchedAt, error: "Не налаштовано доступ до таблиці" };
    const url = `${GATEWAY_URL}/spreadsheets/${SHEET_ID}/values:batchGet?ranges=weekly_respiratory!A1:Z2000&ranges=weekly_vaccination!A1:Z5000`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn },
    });
    if (!res.ok) {
      console.error(`Sheets ${res.status}: ${await res.text()}`);
      return { respiratory: [], vaccination: [], fetchedAt, error: `Помилка джерела даних (${res.status})` };
    }
    const j = (await res.json()) as { valueRanges: { values?: string[][] }[] };
    return {
      respiratory: toRows(j.valueRanges[0]?.values),
      vaccination: toRows(j.valueRanges[1]?.values),
      fetchedAt,
    };
  },
);
