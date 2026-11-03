// Strange Symbols SVGs (defuse-assets/symbols), keyed by id. They draw with currentColor.
export const glyphs: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>("../assets/symbols/*.svg", { query: "?raw", import: "default", eager: true }))
    .map(([path, svg]) => [path.split("/").pop()!.replace(".svg", ""), svg]),
);

export const symbolName = (id: string) => id.replace(/-/g, " ");
