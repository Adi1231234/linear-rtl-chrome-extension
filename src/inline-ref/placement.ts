// Inline issue/project references (breadcrumbs, mentions): an id badge followed by the title.
// The title flips like any line, so a mixed Hebrew/English title reads in order, while the leading
// badge floats to the left edge - where the LTR interface keeps the id - with its spacing intact.
import type { Placement } from "../placement";

const floated = new WeakMap<HTMLElement, HTMLElement[]>();

/** The element children before the first text - the reference's id badge. */
const leadingBadges = (el: HTMLElement): HTMLElement[] => {
  const badges: HTMLElement[] = [];
  for (const node of el.childNodes) {
    if (node instanceof HTMLElement) badges.push(node);
    else if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) break;
  }
  return badges;
};

/** The title alone: the reference's text after its badge, which must not sway the direction. */
const title = (el: HTMLElement): string => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const badge = leadingBadges(el).at(-1);
  if (badge) range.setStartAfter(badge);
  return range.toString();
};

export const inlineRefPlacement: Placement = {
  text: title,
  apply: (el) => {
    const badges = leadingBadges(el);
    for (const badge of badges) badge.style.float = "left";
    floated.set(el, badges);
  },
  revert: (el) => {
    for (const badge of floated.get(el) ?? []) badge.style.float = "";
    floated.delete(el);
  },
};
