import type { ClientMessage, GameView, GmSnapshot, TeamView } from "@defuse/shared";
import { AWARD_MAX, CORRECTION_MAX, HINT_PENALTY, NOTE_MAX, roundLabel, TALK_BONUS } from "@defuse/shared/api";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, inputClass, TeamDot } from "../ui";

type Send = (msg: ClientMessage) => void;
const teamName = (game: GameView, id: number) => game.teams.find((t) => t.id === id)?.name ?? "?";

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-outline bg-surface p-4">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-on-surface-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Confirm({ label, question, detail, confirmLabel, onConfirm, disabled }: {
  label: string; question: string; detail: string; confirmLabel: string; onConfirm: () => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!open) return <Button variant="secondary" className="w-full" disabled={disabled} onClick={() => setOpen(true)}>{label}</Button>;
  return (
    <div role="alertdialog" aria-label={question} className="rounded-lg border border-error-container p-4" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <p className="font-semibold">{question}</p>
      <p className="mt-1 text-on-surface-muted">{detail}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button variant="danger" autoFocus onClick={() => { setOpen(false); onConfirm(); }}>{confirmLabel}</Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function TeamSelect({ id, teams, value, onChange, placeholder }: {
  id: string; teams: TeamView[]; value: number | null; onChange: (id: number | null) => void; placeholder: string;
}) {
  return (
    <select id={id} className={`${inputClass} mt-2`} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">{placeholder}</option>
      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}

/** FR-31. Every button asks first; the strike one says when it means BOOM. */
export function Penalties({ game, send }: { game: GameView; send: Send }) {
  const turn = game.turn;
  const bombOn = turn && (turn.status === "playing" || turn.status === "paused");
  const playing = turn && ["betting", "playing", "paused"].includes(turn.status) ? turn.teamId : null;
  const watchers = game.teams.filter((t) => t.id !== playing);
  const [hintTeam, setHintTeam] = useState<number | null>(null);
  const team = turn ? teamName(game, turn.teamId) : "";

  return (
    <Group title="PENALTIES">
      <div className="grid gap-3 sm:grid-cols-2">
        <Confirm
          label="English only: −10 s"
          disabled={!bombOn}
          question={`Take 10 seconds off ${team}'s timer?`}
          detail="For speaking another language during the turn."
          confirmLabel="Yes, −10 seconds"
          onConfirm={() => send({ type: "gm_penalty", penalty: "english" })}
        />
        <Confirm
          label="Peeking: +1 strike"
          disabled={!bombOn}
          question={`Give ${team} one strike?`}
          detail={turn?.strikes === 2 ? "They already have 2 strikes. This will cause BOOM." : `For looking at the other side. Strike ${(turn?.strikes ?? 0) + 1} of 3.`}
          confirmLabel={turn?.strikes === 2 ? "Yes, BOOM" : "Yes, +1 strike"}
          onConfirm={() => send({ type: "gm_penalty", penalty: "peeking" })}
        />
      </div>
      {!bombOn && <p className="mt-2 text-sm text-on-surface-muted">Time and strike penalties work once the bomb has started.</p>}

      <div className="mt-4">
        <label htmlFor="hint-team" className="font-semibold">Spectator hint: −{HINT_PENALTY} points</label>
        <TeamSelect id="hint-team" teams={watchers} value={hintTeam} onChange={setHintTeam} placeholder="Which team gave a hint?" />
        <div className="mt-3">
          <Confirm
            label={hintTeam ? `−${HINT_PENALTY} to ${teamName(game, hintTeam)}…` : "Pick a team first"}
            disabled={!hintTeam || !watchers.some((t) => t.id === hintTeam)}
            question={`Take ${HINT_PENALTY} points from ${hintTeam ? teamName(game, hintTeam) : ""}?`}
            detail="For giving the playing team a hint or an answer."
            confirmLabel={`Yes, −${HINT_PENALTY} points`}
            onConfirm={() => { send({ type: "gm_penalty", penalty: "hint", teamId: hintTeam! }); setHintTeam(null); }}
          />
        </div>
      </div>
    </Group>
  );
}

export function TalkBonus({ snapshot, send }: { snapshot: GmSnapshot; send: Send }) {
  const game = snapshot.game!;
  const turn = game.turn;
  if (game.status !== "result" || !turn) return null;
  return (
    <Button
      variant="secondary"
      disabled={snapshot.talkBonusGiven}
      onClick={() => send({ type: "gm_talk_bonus" })}
    >
      {snapshot.talkBonusGiven ? "Talk bonus given" : `Talk bonus +${TALK_BONUS} to ${teamName(game, turn.teamId)}`}
    </Button>
  );
}

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** FR-36 and the score history behind every number on the leaderboard. */
export function Scores({ snapshot, send }: { snapshot: GmSnapshot; send: Send }) {
  const game = snapshot.game!;
  const [teamId, setTeamId] = useState<number | null>(null);
  const [sign, setSign] = useState<1 | -1>(1);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<number | null>(null);
  const points = Number(amount);
  const valid = teamId !== null && Number.isInteger(points) && points > 0 && points <= CORRECTION_MAX && note.trim() !== "";
  const history = snapshot.history.filter((e) => filter === null || e.teamId === filter);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    send({ type: "gm_correction", teamId: teamId!, points: sign * points, note: note.trim() });
    setAmount("");
    setNote("");
  }

  return (
    <Group title="CORRECTIONS">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="fix-team" className="font-semibold">Team</label>
          <TeamSelect id="fix-team" teams={game.teams} value={teamId} onChange={setTeamId} placeholder="Pick a team" />
        </div>
        <fieldset>
          <legend className="font-semibold">Points</legend>
          <div className="mt-2 grid grid-cols-[1fr_1fr_1.2fr] gap-2">
            {([1, -1] as const).map((s) => (
              <label key={s} className="flex h-14 items-center justify-center rounded-md border border-outline font-semibold has-checked:border-primary has-checked:bg-surface-raised has-checked:text-primary has-focus-visible:outline-3 has-focus-visible:outline-primary">
                <input type="radio" name="sign" className="sr-only" checked={sign === s} onChange={() => setSign(s)} />
                {s === 1 ? "Add" : "Take away"}
              </label>
            ))}
            <input
              aria-label="Number of points"
              inputMode="numeric"
              className={`${inputClass} font-mono`}
              value={amount}
              placeholder="0"
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
        </fieldset>
        <div>
          <label htmlFor="fix-note" className="font-semibold">Why</label>
          <input id="fix-note" className={`${inputClass} mt-2`} maxLength={NOTE_MAX} value={note} placeholder="e.g. strike counted twice" onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button type="submit" disabled={!valid}>
          {valid ? `${sign === 1 ? "Add" : "Take"} ${points} ${sign === 1 ? "to" : "from"} ${teamName(game, teamId!)}` : "Fill in team, points and why"}
        </Button>
      </form>

      <div className="mt-6 flex items-end justify-between gap-3">
        <h3 className="font-semibold">Score history</h3>
        <select aria-label="Show history for" className={`${inputClass} h-11 w-auto text-base`} value={filter ?? ""} onChange={(e) => setFilter(e.target.value ? Number(e.target.value) : null)}>
          <option value="">All teams</option>
          {game.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {history.length === 0 ? (
        <p className="mt-3 text-on-surface-muted">No points yet.</p>
      ) : (
        <ol className="mt-3 flex max-h-[360px] flex-col overflow-y-auto">
          {history.map((e) => {
            const team = game.teams.find((t) => t.id === e.teamId);
            return (
              <li key={e.id} className="flex items-baseline gap-3 border-t border-outline py-2 first:border-t-0">
                <span className="shrink-0 font-mono text-sm text-on-surface-muted">{time(e.at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    {team && <TeamDot color={team.color} />} <span className="truncate">{team?.name ?? "?"}</span>
                  </span>
                  <span className="block text-sm text-on-surface-muted">
                    {e.turnNumber !== null ? `Turn ${e.turnNumber} · ` : ""}{e.note ?? e.kind}
                  </span>
                </span>
                <span className={`shrink-0 font-mono tabular-nums ${e.points < 0 ? "text-error" : ""}`}>
                  {e.points > 0 ? "+" : ""}{e.points}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Group>
  );
}

/** FR-35 (show a bomb again) and the sound switch for /screen. */
export function ScreenTools({ snapshot, send }: { snapshot: GmSnapshot; send: Send }) {
  const game = snapshot.game!;
  const bombOn = game.status === "playing" || game.status === "paused";
  const [pick, setPick] = useState<number | null>(null);
  const showing = snapshot.reviewable.find((t) => t.id === snapshot.reviewTurnId);
  return (
    <Group title="SCREEN">
      <Button variant="secondary" className="w-full" aria-pressed={game.soundOn} onClick={() => send({ type: "gm_sound", on: !game.soundOn })}>
        Sound on screen: {game.soundOn ? "on" : "off"}
      </Button>
      <div className="mt-4">
        <label htmlFor="review-turn" className="font-semibold">Show a finished bomb again</label>
        {showing ? (
          <div className="mt-2 flex flex-col gap-3">
            <p>On screen now: turn {showing.number}, {teamName(game, showing.teamId)}.</p>
            <Button variant="secondary" onClick={() => send({ type: "gm_review", turnId: null })}>Back to the game</Button>
          </div>
        ) : snapshot.reviewable.length === 0 ? (
          <p className="mt-2 text-on-surface-muted">No finished bomb yet.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select id="review-turn" className={inputClass} value={pick ?? ""} onChange={(e) => setPick(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Pick a turn</option>
              {snapshot.reviewable.map((t) => (
                <option key={t.id} value={t.id}>
                  Turn {t.number} · {teamName(game, t.teamId)} · {roundLabel(t.phase, t.round)} · {t.status === "defused" ? "DEFUSED" : "BOOM"}
                </option>
              ))}
            </select>
            <Button variant="secondary" disabled={!pick || bombOn} onClick={() => send({ type: "gm_review", turnId: pick })}>Show on screen</Button>
          </div>
        )}
        {bombOn && !showing && <p className="mt-2 text-sm text-on-surface-muted">Available once the bomb on screen is finished.</p>}
      </div>
    </Group>
  );
}

/** FR-04, FR-05: players in Defuser order. A team whose bomb is running can't be changed. */
export function Players({ game, send }: { game: GameView; send: Send }) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const turn = game.turn;
  const locked = (teamId: number) => !!turn && (turn.status === "playing" || turn.status === "paused") && turn.teamId === teamId;
  const small = "h-11 rounded-md border border-outline-strong bg-surface px-3 text-sm font-semibold active:bg-surface-raised disabled:cursor-not-allowed disabled:text-on-surface-muted";

  return (
    <Group title="TEAMS">
      <ul className="flex flex-col gap-4">
        {[...game.teams].sort((a, b) => b.score - a.score).map((t) => (
          <li key={t.id}>
            <p className="flex items-center gap-3 font-display text-[20px] font-semibold">
              <TeamDot color={t.color} />
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              <span className="font-mono">{t.score}</span>
            </p>
            {!editing ? (
              <p className="mt-1 text-sm text-on-surface-muted">
                {t.players.length === 0 ? "No players yet." : t.players.map((p) => `${p.nickname}${p.online ? "" : " (offline)"}`).join(", ")}
              </p>
            ) : t.players.length === 0 ? (
              <p className="mt-1 text-sm text-on-surface-muted">No players yet.</p>
            ) : (
              <>
                {locked(t.id) && <p className="mt-1 text-sm text-on-surface-muted">Their bomb is running. Edit after the turn.</p>}
                <ol className="mt-2 flex flex-col gap-2">
                  {t.players.map((p, i) => (
                    <li key={p.id} className="rounded-md bg-surface-raised p-2">
                      <p className="flex items-baseline gap-2 px-1">
                        <span className="w-6 shrink-0 font-mono text-on-surface-muted">{i + 1}</span>
                        <span className="min-w-0 truncate font-semibold">{p.nickname}</span>
                        {!p.online && <span className="shrink-0 text-sm text-on-surface-muted">offline</span>}
                      </p>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        <button className={small} aria-label={`Move ${p.nickname} up`} disabled={i === 0 || locked(t.id)} onClick={() => send({ type: "gm_player", playerId: p.id, action: "up" })}>Up</button>
                        <button className={small} aria-label={`Move ${p.nickname} down`} disabled={i === t.players.length - 1 || locked(t.id)} onClick={() => send({ type: "gm_player", playerId: p.id, action: "down" })}>Down</button>
                        <select
                          aria-label={`Move ${p.nickname} to another team`}
                          className={small}
                          value=""
                          disabled={locked(t.id)}
                          onChange={(e) => e.target.value && send({ type: "gm_player", playerId: p.id, action: "move", teamId: Number(e.target.value) })}
                        >
                          <option value="">Move</option>
                          {game.teams.filter((o) => o.id !== t.id && !locked(o.id)).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <button className={`${small} text-error`} disabled={locked(t.id)} onClick={() => setRemoving(p.id)}>Remove</button>
                      </div>
                      {removing === p.id && (
                        <div role="alertdialog" aria-label={`Remove ${p.nickname}?`} className="mt-2 rounded-md border border-error-container p-3" onKeyDown={(e) => e.key === "Escape" && setRemoving(null)}>
                          <p>Remove {p.nickname}? Their phone goes back to the join screen.</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Button variant="danger" autoFocus onClick={() => { send({ type: "gm_player", playerId: p.id, action: "delete" }); setRemoving(null); }}>Remove</Button>
                            <Button variant="secondary" onClick={() => setRemoving(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-muted">Join link <span className="font-mono [overflow-wrap:anywhere] text-on-surface">{game.joinUrl}</span></p>
        <Button variant="secondary" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>{editing ? "Done editing" : "Edit players"}</Button>
      </div>
      {editing && <p className="mt-2 text-sm text-on-surface-muted">Order is the Defuser order: 1, 2, 3 defuse in Round 1, then 4, 5, … in the next round.</p>}
    </Group>
  );
}

/** FR-42: names for the winners screen after the Final. */
export function Awards({ game, send }: { game: GameView; send: Send }) {
  const [defuser, setDefuser] = useState(game.awards.bestDefuser ?? "");
  const [expert, setExpert] = useState(game.awards.bestExpert ?? "");
  useEffect(() => {
    setDefuser(game.awards.bestDefuser ?? "");
    setExpert(game.awards.bestExpert ?? "");
  }, [game.awards.bestDefuser, game.awards.bestExpert]);
  const saved = defuser.trim() === (game.awards.bestDefuser ?? "") && expert.trim() === (game.awards.bestExpert ?? "");

  return (
    <Group title="AWARDS">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => { e.preventDefault(); send({ type: "gm_awards", bestDefuser: defuser, bestExpert: expert }); }}
      >
        <p className="text-on-surface-muted">Shown on the screen with the winners once the game is finished.</p>
        <div>
          <label htmlFor="best-defuser" className="font-semibold">Best Defuser</label>
          <input id="best-defuser" className={`${inputClass} mt-2`} maxLength={AWARD_MAX} value={defuser} onChange={(e) => setDefuser(e.target.value)} />
        </div>
        <div>
          <label htmlFor="best-expert" className="font-semibold">Best Expert</label>
          <input id="best-expert" className={`${inputClass} mt-2`} maxLength={AWARD_MAX} value={expert} onChange={(e) => setExpert(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary" disabled={saved}>
          {!saved ? "Save names" : game.awards.bestDefuser || game.awards.bestExpert ? "Saved" : "Type a name to save"}
        </Button>
      </form>
    </Group>
  );
}
