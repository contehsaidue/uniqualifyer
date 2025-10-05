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
  server: process.env.NODE_ENV === "production" ? "./server.js" : undefined,
  
  // Explicitly tell Remix to not bundle server dependencies
  serverDependenciesToBundle: [
    // Only add packages that are safe for browser
    // Keep this empty or only add browser-safe packages
  ],
  
  // Add this to be explicit about build directories
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildPath: "build/index.js",
};