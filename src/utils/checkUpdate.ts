/**
 * Utility to check for app updates against a remote version.json file.
 * Implements retry logic for robustness.
 */
export const checkForUpdate = async (retries = 3) => {
  const versionUrl = '/version.json';
  const currentVersion = import.meta.env.VITE_APP_VERSION;
  const storeUrl = "https://play.google.com/store/apps/details?id=com.panchajanya.app";

  // Skip update check in development mode to avoid CORS/404 errors on localhost
  if (import.meta.env.DEV) {
    console.log("[Version Check] Skipping in Development mode");
    return true;
  }

  console.log(`[Version Check] Local: ${currentVersion}`);

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${versionUrl}?t=${Date.now()}`);

      if (!response.ok) throw new Error("Fetch failed");
      
      const data = await response.json();
      console.log(`[Version Check] Remote: ${data.version}`);

      if (data.version !== currentVersion && currentVersion !== "0.0.0") {
        if (window.confirm("A new version of Panchajanya is available. Would you like to update now and get the latest features?")) {
          window.location.href = storeUrl;
        }
      }
      return true; // Success
    } catch (err) {
      console.warn(`Update check attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        return false; // All retries failed
      }
      // Wait before next retry (exponential backoff ideally, but simple delay for now)
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return false;
};
