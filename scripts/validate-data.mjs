import { readFileSync } from "node:fs";

function readJson(path) {
  try {
    return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
  } catch (error) {
    console.error(`FAIL ${path}: ${error.message}`);
    process.exitCode = 1;
    return null;
  }
}

const weekly = readJson("../public/data/weekly.json");
const dictionary = readJson("../public/data/data-dictionary.json");
const geo = readJson("../public/data/ternopil-hromadas.geojson");

if (weekly) {
  if (!Array.isArray(weekly.periods) || weekly.periods.length === 0) {
    console.error("FAIL weekly.json: periods must be a non-empty array");
    process.exitCode = 1;
  } else {
    const seen = new Set();
    for (const [i, row] of weekly.periods.entries()) {
      const label = `weekly.json periods[${i}]`;
      if (!Number.isInteger(row.year) || row.year < 2000 || row.year > 2100) {
        console.error(`FAIL ${label}: invalid year`); process.exitCode = 1;
      }
      if (!Number.isInteger(row.week) || row.week < 1 || row.week > 53) {
        console.error(`FAIL ${label}: week must be an integer from 1 to 53`); process.exitCode = 1;
      }
      if (!Number.isFinite(row.cases_total) || row.cases_total < 0) {
        console.error(`FAIL ${label}: cases_total must be a non-negative number`); process.exitCode = 1;
      }
      const key = `${row.year}-${row.week}`;
      if (seen.has(key)) {
        console.error(`FAIL weekly.json: duplicate reporting period ${key}`); process.exitCode = 1;
      }
      seen.add(key);
      if (row.period_start && row.period_end && row.period_start > row.period_end) {
        console.error(`FAIL ${label}: period_start is after period_end`); process.exitCode = 1;
      }
    }
  }
}

if (dictionary && (!dictionary.target_schema || !dictionary.source)) {
  console.error("FAIL data-dictionary.json: missing source or target_schema");
  process.exitCode = 1;
}

if (geo) {
  if (geo.type !== "FeatureCollection" || !Array.isArray(geo.features) || geo.features.length === 0) {
    console.error("FAIL ternopil-hromadas.geojson: expected a non-empty FeatureCollection");
    process.exitCode = 1;
  } else {
    const codes = new Set();
    for (const [i, feature] of geo.features.entries()) {
      const code = feature?.properties?.ADM3_PCODE;
      if (!code) {
        console.error(`FAIL GeoJSON feature[${i}]: missing ADM3_PCODE`); process.exitCode = 1;
      } else if (codes.has(code)) {
        console.error(`FAIL GeoJSON: duplicate ADM3_PCODE ${code}`); process.exitCode = 1;
      } else {
        codes.add(code);
      }
      if (!feature.geometry || !["Polygon", "MultiPolygon"].includes(feature.geometry.type)) {
        console.error(`FAIL GeoJSON feature[${i}]: invalid polygon geometry`); process.exitCode = 1;
      }
    }
    console.log(`GeoJSON: ${geo.features.length} features; ${codes.size} unique community codes`);
  }
}

if (process.exitCode) {
  console.error("Data validation failed.");
} else {
  console.log(`Data validation passed: ${weekly?.periods?.length ?? 0} reporting period(s).`);
}
