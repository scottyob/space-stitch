// next.config.js

const basePath = "/space-stitch"

module.exports = {
  // ... rest of the configuration.
  output: "export",
  trailingSlash: true,
  basePath,
  env: {
    basePath
  }
};
