import type { BombView, Color } from "@defuse/shared";
import { glyphs } from "../lib/glyphs";

const WIRE_HEX: Record<Color, string> = {
  red: "#E53935",
  blue: "#1E88E5",
  yellow: "#FDD835",
  white: "#F5F5F5",
  black: "#111111",
};

/** wire.svg / wire-cut.svg from defuse-assets, drawn inline so the spark can play once per cut. */
function WireGraphic({ color, cut }: { color: Color; cut: boolean }) {
  if (cut)
    return (
      <svg viewBox="0 0 680 56" width="680" height="56" aria-hidden>
        <path d="M46 28 H300 C312 28 318 32 322 38" stroke="#3A4252" strokeWidth="24" strokeLinecap="round" fill="none" />
        <path d="M634 28 H380 C368 28 362 32 358 38" stroke="#3A4252" strokeWidth="24" strokeLinecap="round" fill="none" />
        <g fill="#3A4252" stroke="#5A6578" strokeWidth="2">
          <rect x="2" y="12" width="36" height="32" rx="6" />
          <rect x="642" y="12" width="36" height="32" rx="6" />
        </g>
        <g fill="#8A94A6"><circle cx="20" cy="28" r="5" /><circle cx="660" cy="28" r="5" /></g>
        <g stroke="#C98A3E" strokeWidth="3" strokeLinecap="round">
          <path d="M330 38 l8 -6 M330 42 l9 1 M328 46 l7 6" />
          <path d="M350 38 l-8 -6 M350 42 l-9 1 M352 46 l-7 6" />
        </g>
        <path className="wire-spark" d="M340 8 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="#FFB020" />
      </svg>
    );
  return (
    <svg viewBox="0 0 680 56" width="680" height="56" aria-hidden>
      <g fill="#3A4252" stroke="#5A6578" strokeWidth="2">
        <rect x="2" y="12" width="36" height="32" rx="6" />
        <rect x="642" y="12" width="36" height="32" rx="6" />
      </g>
      <g fill="#8A94A6"><circle cx="20" cy="28" r="5" /><circle cx="660" cy="28" r="5" /></g>
      <rect
        x="34" y="16" width="612" height="24" rx="12"
        fill={WIRE_HEX[color]}
        stroke={color === "black" ? "#8A94A6" : "transparent"}
        strokeWidth="2"
      />
      <rect x="48" y="20" width="584" height="5" rx="2.5" fill="#FFFFFF" opacity="0.28" />
    </svg>
  );
}

export function WiresModule({ wires, cut, onCut }: { wires: Color[]; cut: number[]; onCut?: (wire: number) => void }) {
  return (
    <ul className="flex flex-col gap-2" aria-label={`${wires.length} wires`}>
      {wires.map((color, i) => {
        const n = i + 1;
        const isCut = cut.includes(n);
        return (
          <li key={n}>
            <button
              type="button"
              disabled={isCut || !onCut}
              onClick={() => onCut?.(n)}
              aria-label={`Wire ${n}, ${color}${isCut ? ", cut" : ""}`}
              className="block rounded-md px-3 py-2 enabled:cursor-crosshair enabled:hover:bg-surface-raised"
            >
              <WireGraphic color={color} cut={isCut} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}


export function SymbolsModule({ symbols, progress, onPress }: { symbols: string[]; progress: number; onPress?: (id: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-12">
      <ul className="flex gap-8">
        {symbols.map((id) => (
          <li key={id}>
            <button
              type="button"
              disabled={!onPress}
              onClick={() => onPress?.(id)}
              aria-label={`Symbol ${id.replace(/-/g, " ")}`}
              className="grid size-40 place-items-center rounded-md border-4 border-transparent bg-wire-white text-neutral enabled:cursor-pointer enabled:hover:border-primary [&_svg]:size-28"
              dangerouslySetInnerHTML={{ __html: glyphs[id] ?? "" }}
            />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-4" role="img" aria-label={`${progress} of 4 pressed in order`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-7 rounded-full border-2 ${i < progress ? "border-success bg-success" : "border-outline-strong bg-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function WordModule({ word, onPick }: { word: BombView["word"]; onPick?: (word: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-10">
      <p className="min-w-[560px] rounded-md bg-neutral px-6 py-6 text-center font-display text-screen-lg leading-none font-bold tracking-[0.04em] text-success">
        {word.display}
      </p>
      <ul className="grid grid-cols-3 gap-6">
        {word.buttons.map((w) => (
          <li key={w}>
            <button
              type="button"
              disabled={!onPick}
              onClick={() => onPick?.(w)}
              className="h-24 w-[280px] rounded-md border-2 border-outline bg-surface-raised font-display text-screen-md font-semibold tracking-[0.02em] enabled:cursor-pointer enabled:hover:border-primary"
            >
              {w}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
