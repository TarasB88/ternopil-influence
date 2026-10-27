const RESPIRATORY_DEFAULT_CSV_URL = "https://docs.google.com/spreadsheets/d/1Oxri7kz6UMFpkTENTjoQUHwY5yCuhczJY22c0K5fqbI/export?format=csv&gid=1951237247";
const VACCINATION_CSV_URL = "https://docs.google.com/spreadsheets/d/1Oxri7kz6UMFpkTENTjoQUHwY5yCuhczJY22c0K5fqbI/export?format=csv&gid=1503721021";

const SOURCE_CONFIG = {
  "/api/respiratory": "RESPIRATORY_CSV_URL",
  "/api/vaccination": "VACCINATION_CSV_URL"
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        app: "ternopil-influence",
        generatedAt: new Date().toISOString(),
        dataSource: "Google Sheets",
        sourceEndpoint: "/api/source"
      }, { headers: corsHeaders });
    }

    // New two-sheet integration is configured with Worker variables:
    // RESPIRATORY_CSV_URL and VACCINATION_CSV_URL. URLs must be published CSV exports.
    const configuredKey = SOURCE_CONFIG[url.pathname];
    if (url.pathname === "/api/vaccination" && !env.VACCINATION_CSV_URL && !VACCINATION_CSV_URL) {
      return Response.json({
        status: "not_configured",
        message: "Set the " + configuredKey + " Worker variable to the published CSV URL for the matching sheet.",
        checkedAt: new Date().toISOString()
      }, { status: 503, headers: corsHeaders });
    }

    // Keep the legacy endpoint during migration; it is not the new two-sheet source.
    if (url.pathname === "/api/source" || configuredKey) {
      try {
        const configuredUrl = configuredKey
          ? (env[configuredKey] || (url.pathname === "/api/respiratory" ? RESPIRATORY_DEFAULT_CSV_URL : VACCINATION_CSV_URL))
          : RESPIRATORY_DEFAULT_CSV_URL;
        const sourceUrl = new URL(configuredUrl);
        sourceUrl.searchParams.set("refresh", String(Date.now()));
        const upstream = await fetch(sourceUrl.toString(), {
          headers: {
            "Accept": "text/csv,text/plain;q=0.9,*/*;q=0.8",
            "Cache-Control": "no-cache"
          },
          cache: "no-store"
        });
        if (!upstream.ok) {
          return Response.json({
            status: "error",
            message: "Google Sheets source is unavailable",
            upstreamStatus: upstream.status,
            checkedAt: new Date().toISOString()
          }, { status: 502, headers: corsHeaders });
        }

        const csv = await upstream.text();
        if (!csv.trim() || /<!doctype html|<html/i.test(csv.slice(0, 500))) {
          return Response.json({
            status: "error",
            message: "Google Sheets did not return CSV. Check that the selected sheet is published for viewing.",
            checkedAt: new Date().toISOString()
          }, { status: 502, headers: corsHeaders });
        }

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv; charset=utf-8",
            "X-Data-Source": configuredKey || "Google Sheets legacy source",
            "X-Source-Checked-At": new Date().toISOString()
          }
        });
      } catch (error) {
        return Response.json({
          status: "error",
          message: "Could not fetch the Google Sheets source",
          checkedAt: new Date().toISOString()
        }, { status: 502, headers: corsHeaders });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
