module.exports = {
  source: "dist",
  minifyHtml: {
    collapseWhitespace: false,
    removeComments: false,
  },
  include: [
    "/dashboard-preview",
    "/dashboard-preview?tab=overview",
    "/dashboard-preview?tab=deals",
    "/dashboard-preview?tab=payments",
    "/dashboard-preview?tab=protection",
  ],
  skipThirdPartyRequests: true,
  cacheAjaxRequests: false,
  puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  fixWebpackChunksIssue: false,
  removeStyleTags: false,
  removeScriptTags: false,
  // Wait for React to hydrate
  waitFor: 2000,
  // Crawl from these routes
  crawlFrom: "/dashboard-preview",
};

