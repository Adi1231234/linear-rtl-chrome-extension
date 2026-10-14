// Direction control - applies/reverts text direction for a single element. Owns per-element state.
import { isRtlLine } from "./rtl-text";
import { isInlineRef } from "./layout";
import { linePlacement, type Placement } from "./placement";
import { inlineRefPlacement } from "./inline-ref/placement";
import { isEditorContent } from "./editor/root";

/** Elements this extension turned RTL, with the placement that was applied to them. */
const flipped = new WeakMap<HTMLElement, Placement>();

/** Decide and apply direction for one element that directly holds text. Idempotent, self-healing. */
export const updateDirection = (el: Element): void => {
  if (!(el instanceof HTMLElement) || isEditorContent(el)) return; // editors: see editor/
  const placement = flipped.get(el) ?? (isInlineRef(el) ? inlineRefPlacement : linePlacement);

  if (isRtlLine(placement.text(el))) {
    if (flipped.has(el) && el.getAttribute("dir") === "rtl") return; // re-apply only if stripped
    el.setAttribute("dir", "rtl");
    placement.apply(el);
    flipped.set(el, placement);
  } else if (flipped.has(el)) {
    el.removeAttribute("dir");
    placement.revert(el);
    flipped.delete(el);
  }
};
