import { useEffect, useState, type ReactNode } from "react";

const W = 1920;
const H = 1080;

/** Fixed 1920×1080 canvas scaled to the display and letterboxed, never reflowed (DESIGN.md › Layout). */
export function Stage({ children }: { children: ReactNode }) {
  const fit = () => Math.min(innerWidth / W, innerHeight / H);
  const [scale, setScale] = useState(fit);
  useEffect(() => {
    const onResize = () => setScale(fit());
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div
        className="absolute top-1/2 left-1/2 bg-neutral p-12"
        style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
