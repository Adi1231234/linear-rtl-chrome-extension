// Placement - how a line that turned RTL sits in its layout, and which of its text decides it.
import { boardCard, isBlock, listMasterGrid } from "./layout";

export interface Placement {
  /** The text whose direction decides the element's direction. */
  text(el: HTMLElement): string;
  apply(el: HTMLElement): void;
  revert(el: HTMLElement): void;
}

const flippedCard = new WeakMap<HTMLElement, HTMLElement>();

/** A regular line: right-align it for the layout it lives in (board card, list grid, block). */
export const linePlacement: Placement = {
  text: (el) => el.textContent ?? "",
  apply: (el) => {
    if (isBlock(el)) el.style.textAlign = "right";

    const card = boardCard(el);
    if (card && card !== el && !card.isContentEditable && card.getAttribute("dir") !== "rtl") {
      card.setAttribute("dir", "rtl");
      flippedCard.set(el, card);
      return;
    }
    if (!card) {
      const grid = listMasterGrid(el);
      if (grid && grid.style.direction !== "rtl") grid.style.direction = "rtl";
    }
  },
  revert: (el) => {
    el.style.textAlign = "";
    const card = flippedCard.get(el);
    if (card) {
      card.removeAttribute("dir");
      flippedCard.delete(el);
    }
  },
};
