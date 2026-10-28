export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "en.rank.it.kr" && url.pathname === "/") {
      const assetUrl = new URL("/en/index.html", request.url);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }
    return env.ASSETS.fetch(request);
  }
};
