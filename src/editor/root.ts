// Editor roots. Linear's rich text (issue title, description, comments) is ProseMirror, which
// re-renders any node inside the document whose attributes change, so nothing is written inside it.
// Only the root may carry a marker: ProseMirror ignores attribute changes on the root itself.
export const EDITOR_ROOT = ".ProseMirror";
const ROOT_ATTR = "data-rtl-editor";

let nextId = 0;

/** True for anything inside an editor; its direction is handled by the editor stylesheet. */
export const isEditorContent = (el: HTMLElement): boolean =>
  el.isContentEditable || el.closest(EDITOR_ROOT) !== null;

export const editorRootOf = (node: Node): HTMLElement | null =>
  (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>(EDITOR_ROOT) ?? null;

export const editorRootsIn = (node: Node): HTMLElement[] => {
  if (!(node instanceof Element)) return [];
  const roots = [...node.querySelectorAll<HTMLElement>(EDITOR_ROOT)];
  return node.matches(EDITOR_ROOT) ? [node as HTMLElement, ...roots] : roots;
};

/** The root's own selector; the editor class keeps every path more specific than the base rule. */
const rootSelector = (root: HTMLElement): string => {
  if (!root.hasAttribute(ROOT_ATTR)) root.setAttribute(ROOT_ATTR, String(++nextId));
  return `${EDITOR_ROOT}[${ROOT_ATTR}="${root.getAttribute(ROOT_ATTR)}"]`;
};

/**
 * A function giving the selector that matches a block by its position under `root` (marking the
 * root on first use). Positions are counted once per parent, so a long document stays linear.
 */
export const pathSelectors = (root: HTMLElement): ((el: Element) => string) => {
  const positions = new Map<Element, number>();
  const position = (node: Element, parent: Element): number => {
    if (!positions.has(node)) [...parent.children].forEach((child, i) => positions.set(child, i + 1));
    return positions.get(node) ?? 0;
  };
  return (el) => {
    let path = "";
    for (let node = el; node !== root && node.parentElement; node = node.parentElement) {
      path = `>:nth-child(${position(node, node.parentElement)})${path}`;
    }
    return rootSelector(root) + path;
  };
};
