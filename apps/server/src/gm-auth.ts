import { timingSafeEqual } from "node:crypto";

const sha256 = (s: string) => new Bun.CryptoHasher("sha256").update(s).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b));

/**
 * The GM PIN lives only in the environment. A successful login returns a token
 * derived from the PIN, so it survives server restarts and changing the PIN
 * logs every GM device out.
 */
export function createGmAuth(pin: string, failDelayMs = 1000) {
  const token = new Bun.CryptoHasher("sha256", pin).update("defuse-gm-v1").digest("hex");
  // Wrong guesses are serialised behind a delay, so parallel requests can't brute-force the PIN.
  let queue: Promise<unknown> = Promise.resolve();

  return {
    login(attempt: string): Promise<string | null> {
      const result = queue.then(async () => {
        if (sameSecret(attempt, pin)) return token;
        await Bun.sleep(failDelayMs);
        return null;
      });
      queue = result.catch(() => {});
      return result;
    },
    verify(header: string | undefined | null): boolean {
      const given = header?.startsWith("Bearer ") ? header.slice(7) : "";
      return given.length > 0 && sameSecret(given, token);
    },
  };
}
export type GmAuth = ReturnType<typeof createGmAuth>;
