// Phase 7 small load test: 24 phones + /screen + /gm on one server, measures how long each GM command
// takes to reach every socket. Creates a NEW session, so never run it against the server during the event.
//   BASE_URL=http://localhost:3001 GM_PIN=... bun scripts/load-test.ts [--replace]
import type { ClientMessage, ServerMessage } from "@defuse/shared";

const base = (process.env.BASE_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const pin = process.env.GM_PIN;
const PLAYERS = 24;
if (!pin) throw new Error("Set GM_PIN.");

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

if ((await fetch(base + "/api/game")).ok && !process.argv.includes("--replace"))
  throw new Error("A session is already running on this server. Pass --replace to overwrite it.");

const { token } = await api<{ token: string }>("/api/gm/login", { method: "POST", body: JSON.stringify({ pin }) });
const game = await api<{ teams: { id: number }[] }>("/api/gm/games", {
  method: "POST",
  headers: { authorization: `Bearer ${token}` },
  body: JSON.stringify({ teams: ["Load A", "Load B", "Load C", "Load D"].map((name, i) => ({ name, color: `team-${i + 1}` })) }),
});
const devices: string[] = [];
for (let i = 0; i < PLAYERS; i++) {
  const { deviceToken } = await api<{ deviceToken: string }>("/api/players", {
    method: "POST",
    body: JSON.stringify({ nickname: `load${i + 1}`, teamId: game.teams[i % game.teams.length]!.id }),
  });
  devices.push(deviceToken);
}

type Sock = { ws: WebSocket; snapshots: number; waiter?: () => void };
const wsUrl = base.replace(/^http/, "ws") + "/ws";
function open(hello: ClientMessage): Promise<Sock> {
  return new Promise((resolve, reject) => {
    const s: Sock = { ws: new WebSocket(wsUrl), snapshots: 0 };
    s.ws.onopen = () => s.ws.send(JSON.stringify(hello));
    s.ws.onerror = () => reject(new Error("WebSocket failed"));
    s.ws.onmessage = (e) => {
      const msg = JSON.parse(String(e.data)) as ServerMessage;
      if (msg.type === "error") console.error("server error:", msg.message);
      if (msg.type !== "snapshot") return;
      if (++s.snapshots === 1) resolve(s);
      s.waiter?.();
    };
  });
}

const gmSock = await open({ type: "hello", role: "gm", gmToken: token });
const socks = await Promise.all([
  open({ type: "hello", role: "screen" }),
  ...devices.map((deviceToken) => open({ type: "hello", role: "play", deviceToken })),
]);
console.log(`connected: ${socks.length + 1} sockets`);

/** Sends a GM command and returns, per socket, the ms until its next snapshot arrived. */
async function measure(msg: ClientMessage): Promise<number[]> {
  const t0 = performance.now();
  const arrivals = socks.map((s) => new Promise<number>((resolve) => {
    s.waiter = () => { s.waiter = undefined; resolve(performance.now() - t0); };
  }));
  gmSock.ws.send(JSON.stringify(msg));
  return Promise.race([
    Promise.all(arrivals),
    Bun.sleep(5_000).then(() => { throw new Error(`no snapshot within 5 s after ${JSON.stringify(msg)}`); }),
  ]);
}

const steps: ClientMessage[] = [
  { type: "gm", command: "next" }, // open turn
  { type: "gm", command: "next" }, // start turn
  { type: "gm", command: "pause" },
  { type: "gm", command: "resume" },
  { type: "gm", command: "pause" },
  { type: "gm", command: "resume" },
];
const all: number[] = [];
for (const step of steps) {
  const ms = (await measure(step)).sort((a, b) => a - b);
  all.push(...ms);
  console.log(`${JSON.stringify(step).padEnd(36)} p50 ${ms[ms.length >> 1]!.toFixed(0)} ms · max ${ms.at(-1)!.toFixed(0)} ms`);
  await Bun.sleep(300);
}
all.sort((a, b) => a - b);
const p95 = all[Math.floor(all.length * 0.95)]!;
console.log(`overall: ${all.length} deliveries · p95 ${p95.toFixed(0)} ms · max ${all.at(-1)!.toFixed(0)} ms`);
gmSock.ws.send(JSON.stringify({ type: "gm", command: "end" } satisfies ClientMessage));
await Bun.sleep(300);
for (const s of [gmSock, ...socks]) s.ws.close();
// NFR-01 target is about 1 s on the venue network; local runs should be far below that.
process.exit(all.at(-1)! <= 1_000 ? 0 : 1);
