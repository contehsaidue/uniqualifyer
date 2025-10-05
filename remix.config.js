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
  // Remove serverBuildTarget as it's deprecated in v2
  server: process.env.NODE_ENV === "production" ? "./server.js" : undefined,
  tailwind: true,
  postcss: true,
  
  // Add publicPath configuration
  publicPath: process.env.NODE_ENV === "production" ? "/build/" : "/build/",
};