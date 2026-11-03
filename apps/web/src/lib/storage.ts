// localStorage can throw (private mode, blocked storage). Treat that as "nothing saved".
function wrap(get: () => Storage) {
  return {
    get(key: string): string | null {
      try { return get().getItem(key); } catch { return null; }
    },
    set(key: string, value: string) {
      try { get().setItem(key, value); } catch {}
    },
    remove(key: string) {
      try { get().removeItem(key); } catch {}
    },
  };
}

export const storage = wrap(() => localStorage);

/**
 * /play?test=1 keeps the player per tab (sessionStorage), so one laptop can act as
 * several players while testing. Real participants open /play from the QR without it.
 */
export const isTestMode = new URLSearchParams(location.search).has("test");
export const deviceStorage = isTestMode ? wrap(() => sessionStorage) : storage;

export const DEVICE_TOKEN = "defuse.deviceToken";
export const GM_TOKEN = "defuse.gmToken";
