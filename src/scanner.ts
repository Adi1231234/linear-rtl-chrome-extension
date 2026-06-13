// DOM scanning - finds elements that directly contain RTL text and applies direction to them.
import { hasRtl } from "./rtl-text";
import { isSkippableTag, isSkipped } from "./layout";
import { updateDirection } from "./direction";

const addParent = (textNode: Text, set: Set<HTMLElement>): void => {
  const el = textNode.parentElement;
  if (el && !isSkipped(el)) set.add(el);
};

/** Every element under `root` that is the direct parent of an RTL text node. */
export const collectRtlElements = (root: Node): Set<HTMLElement> => {
  const found = new Set<HTMLElement>();
  if (root.nodeType === Node.TEXT_NODE) {
    if (hasRtl(root.nodeValue ?? "")) addParent(root as Text, found);
    return found;
  }
  if (!(root instanceof Element) || isSkippableTag(root.tagName)) return found;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (hasRtl(n.nodeValue ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) addParent(node as Text, found);
  return found;
};

export const scan = (root: Node): void => collectRtlElements(root).forEach(updateDirection);

/** Apply direction for a single changed text node (used on characterData mutations). */
export const processTextNode = (textNode: Text): void => {
  const el = textNode.parentElement;
  if (el && !isSkipped(el)) updateDirection(el);
};
