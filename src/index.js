export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        app: "ternopil-influence",
        generatedAt: new Date().toISOString()
      }, {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
