// scripts/notarize.js
const path = require("path");
const { notarize } = require("@electron/notarize");

module.exports = async function (context) {
  if (process.platform !== "darwin") return;

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  // HARD-CODING SECRETS (⚠️ not recommended, but per your request)
  const appleId = "monokaijs@gmail.com";
  const appleIdPassword = "nmvs-blyg-rart-equy";  // app-specific password
  const teamId = "V59Z6S9A36";

  await notarize({
    tool: "notarytool",
    appBundleId: "com.monokaijs.dcws",
    appPath,
    appleId,
    appleIdPassword,
    teamId
  });
  // electron-builder will staple the ticket automatically after notarization
};
