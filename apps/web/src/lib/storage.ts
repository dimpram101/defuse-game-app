// localStorage can throw (private mode, blocked storage). Treat that as "nothing saved".
export const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch {}
  },
  remove(key: string) {
    try { localStorage.removeItem(key); } catch {}
  },
};

export const DEVICE_TOKEN = "defuse.deviceToken";
export const GM_TOKEN = "defuse.gmToken";
