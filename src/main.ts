// Bootstrap - wires the modules together and starts once the document body exists.
import { injectEditorCss } from "./editor-css";
import { scan } from "./scanner";
import { startSafetyRescan, watch } from "./observer";

const SAFETY_RESCAN_MS = 2000;

const start = (): void => {
  injectEditorCss();
  scan(document.body);
  watch(document.body);
  startSafetyRescan(SAFETY_RESCAN_MS);
};

if (document.body) start();
else document.addEventListener("DOMContentLoaded", start, { once: true });
