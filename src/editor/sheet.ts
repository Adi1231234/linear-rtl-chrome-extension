// The editor stylesheet - one <style> this extension owns, outside every editor: the static base
// rule plus, per live editor, the generated rules for its right-to-left blocks.
import { BASE_CSS, editorCss } from "./rules";
import { editorBlocks } from "./decide";
import { editorRootsIn, pathSelectors } from "./root";

const perEditor = new Map<HTMLElement, string>();
let style: HTMLStyleElement | null = null;
let current = "";

const render = (): void => {
  for (const root of perEditor.keys()) if (!root.isConnected) perEditor.delete(root);
  const css = BASE_CSS + [...perEditor.values()].join("");
  if (style && css !== current) style.textContent = current = css;
};

const cssFor = (root: HTMLElement): string => editorCss(editorBlocks(root), pathSelectors(root));

export const installEditorSheet = (): void => {
  style = document.createElement("style");
  style.textContent = current = BASE_CSS;
  (document.head ?? document.documentElement).appendChild(style);
};

/** Recompute the given editors' rules (and drop editors that left the page). */
export const refreshEditors = (roots: Iterable<HTMLElement>): void => {
  for (const root of roots) if (root.isConnected) perEditor.set(root, cssFor(root));
  render();
};

/** Find and refresh the editors inside newly added content. */
export const refreshEditorsIn = (node: Node): void => {
  const roots = editorRootsIn(node);
  if (roots.length) refreshEditors(roots);
};

/** Safety re-scan: every editor on the page, so a missed change or a removed editor heals. */
export const refreshAllEditors = (): void => refreshEditors(editorRootsIn(document.body));
