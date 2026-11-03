import type { ReactNode } from "react";

export type Led = "off" | "active" | "solved" | "failed";
const LED_FILL: Record<Led, string> = { off: "#212733", active: "#FFB020", solved: "#3DDC84", failed: "#FF4D4F" };
const LED_X = [926, 992, 1058];

/**
 * defuse-assets/bomb/chassis.svg as JSX, so the LEDs and serial follow the bomb state.
 * The active module renders in the bay (x=60 y=160 w=1080 h=560 of the 1200×800 viewBox).
 */
export function Chassis({ leds, serial, bayActive, children }: {
  leds: Led[];
  serial: string;
  bayActive: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative h-[800px] w-[1200px]">
      <svg viewBox="0 0 1200 800" width="1200" height="800" className="absolute inset-0" aria-hidden>
        <defs>
          <pattern id="hazard" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="28" height="28" fill="#0E1116" />
            <rect width="14" height="28" fill="#FFB020" />
          </pattern>
        </defs>
        <rect x="16" y="16" width="1168" height="768" rx="20" fill="#2A303C" stroke="#5A6578" strokeWidth="2" />
        <rect x="32" y="32" width="1136" height="736" rx="14" fill="none" stroke="#3A4252" strokeWidth="1.5" />
        <g fill="#3A4252" stroke="#5A6578" strokeWidth="2">
          <circle cx="56" cy="56" r="13" /><circle cx="1144" cy="56" r="13" />
          <circle cx="56" cy="744" r="13" /><circle cx="1144" cy="744" r="13" />
        </g>
        <path d="M49 49l14 14M1137 49l14 14M49 737l14 14M1137 737l14 14" stroke="#8A94A6" strokeWidth="3" strokeLinecap="round" />

        <rect x="96" y="54" width="300" height="72" rx="8" fill="#171B22" stroke="#3A4252" strokeWidth="1.5" />
        <text x="118" y="84" fontFamily="'JetBrains Mono', monospace" fontSize="16" fontWeight="600" letterSpacing="2" fill="#9AA4B2">DEVICE</text>
        <text x="118" y="111" fontFamily="'JetBrains Mono', monospace" fontSize="22" fontWeight="700" letterSpacing="2" fill="#E8ECF2">{serial}</text>

        <rect x="760" y="54" width="344" height="72" rx="8" fill="#171B22" stroke="#3A4252" strokeWidth="1.5" />
        <text x="782" y="96" fontFamily="'Inter', sans-serif" fontSize="15" fontWeight="600" letterSpacing="2" fill="#9AA4B2">MODULES</text>
        {LED_X.map((cx, i) => (
          <circle key={cx} cx={cx} cy="90" r="15" fill={LED_FILL[leds[i] ?? "off"]} stroke="#5A6578" strokeWidth="2" />
        ))}

        <rect x="60" y="140" width="1080" height="12" rx="3" fill="url(#hazard)" opacity="0.85" />
        <rect x="60" y="160" width="1080" height="560" rx="12" fill="#171B22" stroke="#3A4252" strokeWidth="2" />
        <rect x="72" y="172" width="1056" height="536" rx="8" fill="none" stroke="#212733" strokeWidth="1.5" />

        <path d="M96 750h120M96 734h120M984 750h120M984 734h120" stroke="#3A4252" strokeWidth="6" strokeLinecap="round" />
        <rect x="420" y="728" width="360" height="32" rx="6" fill="#FFB020" />
        <text x="600" y="750" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="14" fontWeight="700" letterSpacing="1.5" fill="#1A1200">HANDLE WITH CARE · SPEAK ENGLISH</text>
      </svg>

      <div
        className={`absolute top-[160px] left-[60px] flex h-[560px] w-[1080px] items-center justify-center rounded-lg ${bayActive ? "module-active" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
