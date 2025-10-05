/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  future: {
    v2_routeConvention: true,
    v2_meta: true,
    v2_errorBoundary: true,
    v2_normalizeFormMethod: true,
  },
 serverModuleFormat: "esm",
  serverPlatform: "node",
  serverBuildTarget: "vercel",
  // Vercel-specific config
  server: process.env.NODE_ENV === "production" ? "./server.js" : undefined
};