import { createServerFn } from "@tanstack/react-start";

const SHEET_ID = "1Oxri7kz6UMFpkTENTjoQUHwY5yCuhczJY22c0K5fqbI";
const RESPIRATORY_GID = "1951237247";
const VACCINATION_GID = "1503721021";

export type Row = Record<string, string | null>;
export interface DashboardData {
  respiratory: Row[];
  vaccination: Row[];
  fetchedAt: string;
  error?: string;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => {
    const result: Row = {};
    headers.forEach((header, i) => {
      const value = (values[i] ?? "").trim();
      result[header] = value === "" || value === "-" ? null : value;
    });
    return result;
  });
}

async function fetchSheet(gid: string): Promise<Row[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url, { headers: { Accept: "text/csv" } });
  if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}`);
  return parseCsv(await response.text());
}

export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const fetchedAt = new Date().toISOString();
    try {
      const [respiratory, vaccination] = await Promise.all([
        fetchSheet(RESPIRATORY_GID),
        fetchSheet(VACCINATION_GID),
      ]);
      return { respiratory, vaccination, fetchedAt };
    } catch (error) {
      console.error("Failed to load Google Sheets:", error);
      return {
        respiratory: [],
        vaccination: [],
        fetchedAt,
        error: "Не вдалося завантажити дані з Google Sheets. Перевірте доступність джерела.",
      };
    }
  },
);
