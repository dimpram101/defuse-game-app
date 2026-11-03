import { useEffect } from "react";

/** Keeps the phone screen on while an Expert or Defuser is mid-turn. Silently skipped where unsupported. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () => {
      if (document.visibilityState === "visible")
        navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    };
    acquire();
    // The browser drops the lock when the tab is hidden; take it again on return.
    document.addEventListener("visibilitychange", acquire);
    return () => {
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
