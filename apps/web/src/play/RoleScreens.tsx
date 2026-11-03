import type { Manual, ModuleNo } from "@defuse/shared";
import { useWakeLock } from "../lib/useWakeLock";
import { ManualView, MODULE_TITLES } from "./ManualView";

const MODULES = ["wires", "symbols", "word"] as const;

export function ExpertScreen({ module, manual }: { module: ModuleNo; manual: Manual }) {
  useWakeLock(true);
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm font-semibold tracking-[0.08em] text-secondary">EXPERT · MODULE {module} OF 3</p>
        <h1 className="mt-1 font-display text-[32px] leading-tight font-semibold">{MODULE_TITLES[manual.module]}</h1>
        <p className="mt-1 text-sm text-on-surface-muted">Jangan menoleh ke layar. Tanyakan ke Defuser apa yang dia lihat.</p>
      </header>
      <ManualView manual={manual} />
    </div>
  );
}

export function DefuserScreen({ module }: { module: ModuleNo }) {
  useWakeLock(true);
  return (
    <div className="my-auto flex flex-col gap-4">
      <p className="text-sm font-semibold tracking-[0.08em] text-primary">DEFUSER · MODULE {module} OF 3</p>
      <h1 className="font-display text-[40px] leading-tight font-bold">Look at the big screen.</h1>
      <p className="text-lg">
        You're defusing <strong>{MODULE_TITLES[MODULES[module - 1]!]}</strong>. Tell your Experts exactly what you see. They have the manual.
      </p>
      <p className="text-sm text-on-surface-muted">Simpan HP ini. Defuser tidak boleh melihat manual.</p>
    </div>
  );
}
