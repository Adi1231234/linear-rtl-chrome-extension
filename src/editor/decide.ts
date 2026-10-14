// Per-block direction inside one editor. Each line (paragraph, heading) follows the same line rule
// as the rest of the page; a list or quote follows the majority of its own lines; anything with no
// letters yet (an empty line or a new empty list) follows its list or quote, or else the document.
// A line inside a list or quote keeps its own reading direction but aligns to the list's side, so
// an English item in a Hebrew list sits next to its bullet.
import { lineDirection, type Direction } from "../rtl-text";

const LINES = "p, h1, h2, h3, h4, h5, h6";
const CONTAINERS = "ol, ul, blockquote";

export interface EditorBlocks {
  rtlLines: Element[];
  rtlContainers: Element[];
  alignRight: Element[];
  alignLeft: Element[];
}

/** The more common direction; on a tie, the first one present. */
const majority = (dirs: Array<Direction | null>): Direction | null => {
  const rtl = dirs.filter((d) => d === "rtl").length;
  const ltr = dirs.filter((d) => d === "ltr").length;
  if (rtl !== ltr) return rtl > ltr ? "rtl" : "ltr";
  return dirs.find((d) => d !== null) ?? null;
};

export const editorBlocks = (root: Element): EditorBlocks => {
  /** The list or quote holding `el`, or the root itself for top-level blocks. */
  const holderOf = (el: Element): Element => {
    const container = el.parentElement?.closest(CONTAINERS);
    return container && root.contains(container) ? container : root;
  };
  const lines = [...root.querySelectorAll(LINES)];
  const own = new Map(lines.map((line) => [line, lineDirection(line.textContent ?? "")]));
  const holder = new Map(lines.map((line) => [line, holderOf(line)]));
  const directLines = new Map<Element, Element[]>();
  for (const [line, held] of holder) {
    const group = directLines.get(held);
    if (group) group.push(line);
    else directLines.set(held, [line]);
  }
  const dirsOf = (els: Iterable<Element>) => [...els].map((el) => own.get(el) ?? null);

  const resolved = new Map<Element, Direction | null>([[root, majority([...own.values()])]]);
  // Document order, so a nested list is decided after the list or quote that holds it.
  for (const container of root.querySelectorAll(CONTAINERS)) {
    const dir =
      majority(dirsOf(directLines.get(container) ?? [])) ??
      majority(dirsOf(container.querySelectorAll(LINES))) ??
      resolved.get(holderOf(container)) ??
      null;
    resolved.set(container, dir);
  }

  const holderDir = (line: Element) => resolved.get(holder.get(line) ?? root) ?? null;
  const lineDir = (line: Element) => own.get(line) ?? holderDir(line);
  /** The side a line aligns to: its list's side inside a list or quote, else its own. */
  const sideOf = (line: Element) => (holder.get(line) === root ? lineDir(line) : holderDir(line));
  const misaligned = (side: Direction) =>
    lines.filter((line) => sideOf(line) === side && lineDir(line) !== side);

  return {
    rtlLines: lines.filter((line) => lineDir(line) === "rtl"),
    rtlContainers: [...resolved]
      .filter(([container, dir]) => container !== root && dir === "rtl")
      .map(([container]) => container),
    alignRight: misaligned("rtl"),
    alignLeft: misaligned("ltr"),
  };
};
