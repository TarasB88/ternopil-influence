const SOURCE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2Ykj8zO9do27houb1St5VTtPx1gltVf9OBaic3Hp8G13FB9FJ-oYOOYF5dlbV_CdrszMdIiWaMVnd/pub?output=csv";

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

    // Live CSV proxy: keeps browser requests same-origin and avoids CORS issues.
    if (url.pathname === "/api/source") {
      try {
        const sourceUrl = new URL(SOURCE_CSV_URL);
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
            "X-Data-Source": "Google Sheets",
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
