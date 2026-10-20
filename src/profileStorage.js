// Optional, opt-in saving of demo profiles in this browser's localStorage.
// Nothing is written unless the person turns saving on. Every access is wrapped
// because storage can be blocked (private windows, strict settings) or full.

export const STORAGE_KEY = 'recover-well:saved-profiles';
const STORAGE_VERSION = 1;

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadSavedProfiles() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version !== STORAGE_VERSION || !Array.isArray(data.profiles)) return null;
    const profiles = data.profiles.filter(
      (profile) => profile && typeof profile.id === 'string' && typeof profile.name === 'string',
    );
    const nextProfileId = Number.isInteger(data.nextProfileId) && data.nextProfileId > 0
      ? data.nextProfileId
      : profiles.length + 1;
    return { profiles, nextProfileId };
  } catch {
    return null;
  }
}

export function saveProfiles(profiles, nextProfileId) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, profiles, nextProfileId }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearSavedProfiles() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is unavailable; there is nothing saved to clear.
  }
}

export function isStorageAvailable() {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const probe = `${STORAGE_KEY}:probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
