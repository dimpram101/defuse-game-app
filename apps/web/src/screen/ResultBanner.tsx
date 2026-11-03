import type { ReactNode } from "react";
import boomUrl from "../assets/fx/boom.svg?url";
import defusedUrl from "../assets/fx/defused.svg?url";

/** DEFUSED / BOOM over the chassis. The banner SVGs carry the word; `detail` adds time, strikes and points. */
export function ResultBanner({ defused, detail, children }: { defused: boolean; detail: string; children?: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-xl bg-neutral/95" role="status">
      <img src={defused ? defusedUrl : boomUrl} alt={defused ? "Defused" : "Boom"} width={640} height={416} />
      <p className="font-mono text-screen-md text-on-surface-muted">{detail}</p>
      {children}
    </div>
  );
}
