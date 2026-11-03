import type { Manual, ModuleNo, Phase } from "@defuse/shared";
import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { GM_TOKEN, storage } from "../lib/storage";
import { DefuserScreen, ExpertScreen } from "./RoleScreens";

const PHASES: { id: Phase; label: string }[] = [
  { id: "round1", label: "Round 1" },
  { id: "round2", label: "Round 2" },
  { id: "final", label: "Final" },
];

function Choice<T extends string | number>({ label, options, value, onChange }: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className="h-12 rounded-md border border-outline text-sm font-semibold text-on-surface-muted aria-pressed:border-on-surface aria-pressed:bg-surface-raised aria-pressed:text-on-surface"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * /play?preview=round1: the GM checks the Expert and Defuser phone screens before the event,
 * or shows them to volunteers during the demo. Needs the GM PIN unlocked in this browser.
 */
export function ManualPreview() {
  const params = new URLSearchParams(location.search);
  const [phase, setPhase] = useState<Phase>(PHASES.find((p) => p.id === params.get("preview"))?.id ?? "round1");
  const [module, setModule] = useState<ModuleNo>(([1, 2, 3] as const).find((m) => String(m) === params.get("module")) ?? 1);
  const [role, setRole] = useState<"expert" | "defuser">("expert");
  const [manual, setManual] = useState<Manual | null>(null);
  const [error, setError] = useState("");
  const token = storage.get(GM_TOKEN);

  useEffect(() => {
    history.replaceState(null, "", `/play?preview=${phase}&module=${module}`);
    if (!token) return;
    setManual(null);
    setError("");
    api<Manual>(`/api/gm/manual?phase=${phase}&module=${module}`, { headers: { authorization: `Bearer ${token}` } })
      .then(setManual)
      .catch((e) => setError(e instanceof ApiError && e.status === 401 ? "locked" : e.message));
  }, [phase, module, token]);

  if (!token || error === "locked")
    return (
      <div className="my-auto">
        <h1 className="font-display text-[32px] font-semibold">GM preview</h1>
        <p className="mt-3 text-lg">Unlock the panel at <a className="text-primary underline" href="/gm">/gm</a> in this browser first, then come back to this page.</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Preview controls" className="flex flex-col gap-2 rounded-lg border border-outline-strong p-3">
        <p className="text-xs font-semibold tracking-[0.08em] text-on-surface-muted">GM PREVIEW · NOT A LIVE TURN</p>
        <Choice label="Round" options={PHASES} value={phase} onChange={setPhase} />
        <Choice label="Module" options={[{ id: 1, label: "Wires" }, { id: 2, label: "Symbols" }, { id: 3, label: "Words" }]} value={module} onChange={setModule} />
        <Choice label="Phone of" options={[{ id: "expert", label: "Expert" }, { id: "defuser", label: "Defuser" }]} value={role} onChange={setRole} />
      </section>

      {error && <p role="alert" className="text-error">{error}</p>}
      {role === "defuser" ? (
        <DefuserScreen module={module} />
      ) : manual ? (
        <ExpertScreen module={module} manual={manual} />
      ) : (
        !error && <p className="text-on-surface-muted">Loading the manual…</p>
      )}
    </div>
  );
}
