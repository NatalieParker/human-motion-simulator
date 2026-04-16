const STORAGE_KEY = "hms_learn_completion";

function readMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getLearnCompletionMap() {
  return readMap();
}

export function isLevelCompleted(levelId) {
  const map = readMap();
  return map[levelId] === true;
}

export function markLevelCompleted(levelId) {
  const map = readMap();
  map[levelId] = true;
  writeMap(map);
}
