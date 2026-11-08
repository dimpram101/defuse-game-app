import { BET_POINTS, HINT_PENALTY, TALK_BONUS, TWISTS, type Manual, type ModuleNo, type Phase, type PublicGame } from "@defuse/shared";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { GM_TOKEN, storage } from "../lib/storage";
import { ManualView, MODULE_TITLES } from "../play/ManualView";
import { Button } from "../ui";

const PHASES: { id: Phase; label: string }[] = [
  { id: "round1", label: "Round 1" },
  { id: "round2", label: "Round 2" },
  { id: "final", label: "Final" },
];
const MODULE_NOS: ModuleNo[] = [1, 2, 3];
type Part = "manual" | "qr" | "scores";
const PARTS: { id: Part; label: string; hint: string }[] = [
  { id: "manual", label: "Manual", hint: "Round 1, Round 2 and Final. One set per team." },
  { id: "qr", label: "Join QR", hint: "One sheet for the entrance or the stage." },
  { id: "scores", label: "Score sheet", hint: "For the GM if the system can't be used at all." },
];

/** One sheet of paper. Every sheet starts on a new printed page. */
function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <section className="paper mx-auto w-full max-w-[794px] break-before-page border border-outline p-8 print:max-w-none print:border-0 print:p-0">
      {children}
    </section>
  );
}

function ManualSheets({ manuals }: { manuals: Record<string, Manual> }) {
  return PHASES.flatMap((phase) =>
    MODULE_NOS.map((m) => {
      const manual = manuals[`${phase.id}-${m}`]!;
      return (
        <Sheet key={`${phase.id}-${m}`}>
          <header className="mb-4 flex items-baseline justify-between gap-4 border-b-2 border-on-surface pb-2">
            <h2 className="font-display text-[28px] leading-tight font-semibold">
              {m}. {MODULE_TITLES[manual.module]}
            </h2>
            <p className="font-display text-lg font-semibold whitespace-nowrap">{phase.label} manual</p>
          </header>
          {/* Narrower on paper so a full symbol column fits on one page. */}
          <div className={manual.module === "symbols" ? "max-w-[520px]" : ""}>
            <ManualView manual={manual} />
          </div>
        </Sheet>
      );
    }),
  );
}

function QrSheet({ joinUrl }: { joinUrl: string }) {
  const display = joinUrl.replace(/^https?:\/\//, "");
  return (
    <Sheet>
      <div className="flex flex-col items-center gap-8 py-16 text-center">
        <h2 className="font-display text-[56px] leading-none font-bold">Defuse!</h2>
        <p className="text-2xl font-medium">Scan to join your team</p>
        <QRCodeSVG value={joinUrl} size={420} className="h-auto w-full max-w-[420px]" level="M" bgColor="#FFFFFF" fgColor="#0E1116" title={`Join at ${display}`} />
        <p className="font-mono text-[28px] font-bold break-all">{display}</p>
        <p className="text-lg text-on-surface-muted">Keep the page open on your phone for the whole game.</p>
      </div>
    </Sheet>
  );
}

const SCORE_COLUMNS = ["Bomb", "Strikes", "Talk", "Bet", "Sabotage", "Penalty", "Turn total", "Running total"];

function ScoreSheet({ teams }: { teams: string[] }) {
  const rows = teams.length ? teams : ["", "", "", ""];
  const sabotage = Object.values(TWISTS).map((t) => `−${t.cost}`).join(" / ");
  return (
    <Sheet>
      <header className="mb-3 border-b-2 border-on-surface pb-2">
        <h2 className="font-display text-[28px] leading-tight font-semibold">Score sheet</h2>
      </header>
      <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-semibold">Bomb</dt><dd>Defused: 100 + 1 per second left. Not defused: 30 per finished module.</dd>
        <dt className="font-semibold">Strikes</dt><dd>−20 each.</dd>
        <dt className="font-semibold">Talk</dt><dd>+{TALK_BONUS} when every member spoke during the turn.</dd>
        <dt className="font-semibold">Bet</dt><dd>Spectator teams: +{BET_POINTS.defuse} right outcome, +{BET_POINTS.strikes} right strikes.</dd>
        <dt className="font-semibold">Sabotage</dt><dd>Cost to the team that bought it: {sabotage}.</dd>
        <dt className="font-semibold">Penalty</dt><dd>Hint from a spectator: −{HINT_PENALTY} to that team.</dd>
      </dl>
      {["Round 1", "Round 2", "Round ___", "Final"].map((round) => (
        <table key={round} className="mb-5 w-full table-fixed border-collapse text-sm">
          <caption className="mb-1 text-left font-display text-lg font-semibold">{round}</caption>
          <thead>
            <tr>
              <th className="w-[22%] border border-on-surface px-2 py-1 text-left">Team</th>
              {SCORE_COLUMNS.map((c) => (
                <th key={c} className="border border-on-surface px-1 py-1 text-xs font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((name, i) => (
              <tr key={i} className="h-9">
                <td className="border border-on-surface px-2 font-medium">{name}</td>
                {SCORE_COLUMNS.map((c) => <td key={c} className="border border-on-surface" />)}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </Sheet>
  );
}

/**
 * /print: paper backups for the event (phase 7). Manuals come from the same API as /play, so a
 * reprint after changing the question bank always matches the phones. Needs the GM PIN in this browser.
 */
export function PrintPage() {
  const token = storage.get(GM_TOKEN);
  const [manuals, setManuals] = useState<Record<string, Manual> | null>(null);
  const [game, setGame] = useState<PublicGame | null>(null);
  const [error, setError] = useState("");
  const [parts, setParts] = useState<Record<Part, boolean>>({ manual: true, qr: true, scores: true });

  useEffect(() => {
    document.title = "Defuse! · Print";
    if (!token) return;
    const headers = { authorization: `Bearer ${token}` };
    Promise.all(PHASES.flatMap((p) => MODULE_NOS.map(async (m) =>
      [`${p.id}-${m}`, await api<Manual>(`/api/gm/manual?phase=${p.id}&module=${m}`, { headers })] as const)))
      .then((entries) => setManuals(Object.fromEntries(entries)))
      .catch((e) => setError(e instanceof ApiError && e.status === 401 ? "locked" : e.message));
    // No session yet is fine: the QR then points at this server and the score sheet has blank team rows.
    api<PublicGame>("/api/game").then(setGame).catch(() => {});
  }, [token]);

  if (!token || error === "locked")
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-[32px] font-semibold">Print</h1>
        <p className="mt-3 text-lg">Unlock the panel at <a className="text-primary underline" href="/gm">/gm</a> in this browser first, then come back to this page.</p>
      </main>
    );

  const joinUrl = game?.joinUrl ?? `${location.origin}/play`;
  const ready = manuals !== null || !parts.manual;
  return (
    <main className="flex flex-col gap-6 px-4 py-6 print:block print:p-0">
      <section aria-label="Print options" className="mx-auto flex w-full max-w-[794px] flex-col gap-4 print:hidden">
        <h1 className="font-display text-[32px] font-semibold">Print</h1>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-semibold tracking-[0.08em] text-on-surface-muted">WHAT TO PRINT</legend>
          {PARTS.map((p) => (
            <label key={p.id} className="flex items-start gap-3 rounded-md border border-outline p-3">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-primary"
                checked={parts[p.id]}
                onChange={(e) => setParts({ ...parts, [p.id]: e.target.checked })}
              />
              <span>
                <span className="block font-semibold">{p.label}</span>
                <span className="block text-sm text-on-surface-muted">{p.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="text-sm text-on-surface-muted">
          Join URL: <span className="font-mono text-on-surface">{joinUrl}</span>
          {!game && " (no session yet, so this is the address of this page)"}
        </p>
        {error && <p role="alert" className="text-error">{error}</p>}
        <Button type="button" disabled={!ready || !Object.values(parts).some(Boolean)} onClick={() => window.print()}>
          {ready ? "Print" : "Loading the manuals…"}
        </Button>
      </section>

      {parts.manual && manuals && <ManualSheets manuals={manuals} />}
      {parts.qr && <QrSheet joinUrl={joinUrl} />}
      {parts.scores && <ScoreSheet teams={game?.teams.map((t) => t.name) ?? []} />}
    </main>
  );
}
