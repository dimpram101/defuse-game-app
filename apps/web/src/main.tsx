import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GmPage } from "./gm/GmPage";
import { PlayPage } from "./play/PlayPage";
import { ScreenPage } from "./screen/ScreenPage";

const pages: Record<string, () => React.JSX.Element> = {
  "/screen": ScreenPage,
  "/play": PlayPage,
  "/gm": GmPage,
};

// Anyone who types the bare domain is almost always a participant.
const path = location.pathname.replace(/\/+$/, "") || "/";
if (!pages[path]) history.replaceState(null, "", "/play");
const Page = pages[path] ?? PlayPage;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
