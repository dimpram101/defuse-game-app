import type { Manual, SymbolsManual, WiresManual, WordManual } from "@defuse/shared";
import { glyphs, symbolName } from "../lib/glyphs";

export const MODULE_TITLES = { wires: "Wires", symbols: "Strange Symbols", word: "Say the Word" } as const;

function NewTag() {
  return (
    <span className="ml-2 inline-block rounded-sm border border-secondary px-1.5 py-0.5 align-middle text-xs font-semibold tracking-[0.08em] text-secondary">
      NEW
    </span>
  );
}

/** Manual pages share one frame: a teal header strip, then the content (DESIGN.md › manual-page). */
function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-outline bg-surface">
      <h3 className="bg-surface-raised px-4 py-2 text-xs font-semibold tracking-[0.08em] text-secondary">{title}</h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Wires({ manual }: { manual: WiresManual }) {
  return (
    <>
      <p className="text-base text-on-surface-muted">
        Ask how many wires there are first. Check the rules in order: the first rule that matches decides.
      </p>
      {manual.pages.map((page) => (
        <Page key={page.wireCount} title={`${page.wireCount} WIRES`}>
          <ol className="flex flex-col gap-3">
            {page.rules.map((rule, i) => (
              <li key={i} className="flex gap-3 text-lg leading-normal font-medium">
                <span className="w-6 shrink-0 font-mono text-on-surface-muted">{i + 1}.</span>
                <span>
                  {rule.text}
                  {rule.isNew && <NewTag />}
                </span>
              </li>
            ))}
          </ol>
        </Page>
      ))}
    </>
  );
}

function Symbols({ manual }: { manual: SymbolsManual }) {
  const upward = manual.order === "bottomToTop";
  return (
    <>
      <p className="text-lg leading-normal font-medium">
        Find the column that has all four symbols. Press them from{" "}
        <strong>{upward ? "bottom to top" : "top to bottom"}</strong>.
        {manual.orderIsNew && <NewTag />}
      </p>
      <Page title="COLUMNS">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${manual.columns.length}, minmax(0, 1fr))` }}>
          {manual.columns.map((col) => (
            <section key={col.id} aria-label={`Column ${col.id}`} className="flex min-w-0 flex-col items-center gap-1.5">
              <h4 className="font-display text-lg font-semibold text-secondary">{col.id}</h4>
              {/* Columns are drawn the same way every round; only the reading direction changes in the Final. */}
              <ol className="flex w-full flex-col gap-1.5">
                {col.symbols.map((id) => (
                  <li
                    key={id}
                    aria-label={symbolName(id)}
                    className="grid aspect-square w-full place-items-center rounded-sm bg-wire-white text-neutral [&_svg]:size-[70%]"
                    dangerouslySetInnerHTML={{ __html: glyphs[id] ?? "" }}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-on-surface-muted">{upward ? "↑ press order: bottom first" : "↓ press order: top first"}</p>
      </Page>
    </>
  );
}

function Words({ manual }: { manual: WordManual }) {
  return (
    <>
      <p className="text-lg leading-normal font-medium">
        Find the word on the screen. Press the button next to it. Ask the Defuser to spell it.
        {manual.tableIsNew && <NewTag />}
      </p>
      {manual.groups.map((group, i) => (
        <Page key={group.id} title={`GROUP ${i + 1}`}>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs tracking-[0.08em] text-on-surface-muted">
                <th className="pb-2 font-semibold">ON SCREEN</th>
                <th className="pb-2 font-semibold">PRESS</th>
              </tr>
            </thead>
            <tbody className="font-display text-xl">
              {group.rows.map((row) => (
                <tr key={row.display} className="border-t border-outline">
                  <td className="py-2 pr-2">{row.display}</td>
                  <td className="py-2 font-bold text-secondary">{row.press}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Page>
      ))}
    </>
  );
}

export function ManualView({ manual }: { manual: Manual }) {
  return (
    <div className="flex flex-col gap-4">
      {manual.module === "wires" && <Wires manual={manual} />}
      {manual.module === "symbols" && <Symbols manual={manual} />}
      {manual.module === "word" && <Words manual={manual} />}
    </div>
  );
}
