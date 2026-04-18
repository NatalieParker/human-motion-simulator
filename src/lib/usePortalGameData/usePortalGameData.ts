import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { fetchGameData, initPortalBridge, saveGameData } from "../portalBridge/portalBridge";

type JsonRecord = Record<string, unknown>;

export function usePortalGameData() {
  const [data, setData] = useState<JsonRecord>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = initPortalBridge();
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await fetchGameData();
        if (!cancelled) {
          setData(loaded);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load game data");
          setData({});
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const persist = useCallback((nextData: JsonRecord) => {
    setData(nextData);
    saveGameData(nextData);
  }, []);

  const mergeAndPersist = useCallback((patch: JsonRecord) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveGameData(next);
      return next;
    });
  }, []);

  return useMemo(
    () => ({ data, isLoading, error, persist, mergeAndPersist }),
    [data, isLoading, error, persist, mergeAndPersist],
  );
}
