// Bootstrap - wires the modules together and starts once the document body exists.
import { installEditorSheet, refreshAllEditors } from "./editor/sheet";
import { scan } from "./scanner";
import { startSafetyRescan, watch } from "./observer";

const SAFETY_RESCAN_MS = 2000;

const start = (): void => {
  installEditorSheet();
  scan(document.body);
  refreshAllEditors();
  watch(document.body);
  startSafetyRescan(SAFETY_RESCAN_MS);
};

if (document.body) start();
else document.addEventListener("DOMContentLoaded", start, { once: true });
