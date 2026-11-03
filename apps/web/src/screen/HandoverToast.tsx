import { MODULE_NAMES } from "../bomb/BombBoard";

/**
 * "Switch Defuser" notice, pinned over the chassis top strip so the next module stays fully visible.
 * Informational only: it lets clicks through and the bomb stays playable.
 */
export function HandoverToast({ doneModule, nextDefuser, ms }: { doneModule: number; nextDefuser: string | null; ms: number }) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-4 left-1/2 flex w-[880px] -translate-x-1/2 items-center gap-6 rounded-lg border-2 border-primary bg-surface-raised px-6 py-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-success">Module {doneModule} done · {MODULE_NAMES[doneModule - 1]}</p>
        <p className="truncate font-display text-screen-md font-bold">
          Switch Defuser: <span className="text-primary">{nextDefuser ? `${nextDefuser}, you're up!` : "next Defuser, you're up!"}</span>
        </p>
      </div>
    </div>
  );
}
