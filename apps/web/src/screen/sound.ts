import type { GameView } from "@defuse/shared";
import { useEffect, useRef, useState } from "react";

/**
 * FR-16, synthesized with WebAudio so there are no sound files to ship. Browsers only allow audio after a click
 * on the page, so /screen asks for one ("Enable sound") and remembers nothing: a reload asks again.
 */
let ctx: AudioContext | null = null;

function tone(freq: number, at: number, length: number, type: OscillatorType = "square", volume = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length);
}

const sounds = {
  tick(high: boolean) {
    if (ctx) tone(high ? 1400 : 1000, ctx.currentTime, 0.05, "square", 0.08);
  },
  boom() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const noise = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = noise;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 1.4);
    gain.gain.value = 0.9;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    tone(60, t, 1.2, "sine", 0.6);
  },
  defused() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.35, "triangle", 0.2));
  },
};

export function useSound(game: GameView | null | undefined, remainingMs: number | null) {
  const [enabled, setEnabled] = useState(() => ctx?.state === "running");
  const on = enabled && !!game?.soundOn;
  const status = game?.turn ? `${game.turn.id}:${game.turn.status}` : null;
  const lastStatus = useRef(status);
  const lastSecond = useRef<number | null>(null);

  useEffect(() => {
    const prev = lastStatus.current;
    lastStatus.current = status;
    if (!on || !status || prev === status) return;
    // Only a change seen live plays: reconnecting to a finished turn stays quiet.
    if (prev?.split(":")[0] !== status.split(":")[0]) return;
    if (status.endsWith(":boom")) sounds.boom();
    else if (status.endsWith(":defused")) sounds.defused();
  }, [status, on]);

  // Tick-tock in the last 30 seconds, once per whole second shown on the timer.
  const running = game?.turn?.timer.running ?? false;
  const second = remainingMs === null ? null : Math.ceil(remainingMs / 1000);
  useEffect(() => {
    const prev = lastSecond.current;
    lastSecond.current = second;
    if (!on || !running || second === null || second === prev || second > 30 || second <= 0) return;
    sounds.tick(second % 2 === 0);
  }, [second, running, on]);

  async function enable() {
    ctx ??= new AudioContext();
    await ctx.resume();
    setEnabled(ctx.state === "running");
  }
  return { enabled, enable };
}
