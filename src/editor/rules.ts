// Editor CSS text. The base rule gives every paragraph automatic direction from its first strong
// letter (unicode-bidi: plaintext); it applies instantly and survives re-renders. The generated
// rules then apply the page-wide line rule per block and mirror Linear's list/quote chrome, which
// Linear positions with physical (left-side) properties, for blocks that read right-to-left.
import type { EditorBlocks } from "./decide";

const LINES = ":is([contenteditable],.ProseMirror) :is(.text-node,p,div,li,h1,h2,h3,h4,blockquote)";

export const BASE_CSS = `${LINES}{unicode-bidi:plaintext;text-align:start;}`;

// Right-side mirrors of Linear's own editor rules (same custom properties).
const MIRROR = [
  ":is(ul){padding-left:0;padding-right:var(--editor-list-inset)}",
  ":is(ul:not([data-type=todo_list]))>li::before" +
    "{left:auto;right:calc((-1 * var(--editor-list-inset)) + (var(--editor-bullet-disc-offset) / 2))}",
  ":is([data-type=todo_list])>li>.todo-checkbox-container" +
    "{left:auto;right:calc(-1 * var(--editor-list-inset));flex-direction:row-reverse}",
  ":is(ol){grid-template-columns:1fr max-content}",
  ":is(ol)>li>*{grid-column:1/2}",
  ":is(ol)>li::before{grid-column:2/3;grid-row:1;direction:rtl;transform:translate(0.55em)}",
  ":is(blockquote){padding-left:0;padding-right:var(--editor-block-spacing)}",
  ":is(blockquote)::before{left:auto;right:0}",
];

/** What each kind of block gets, appended to the selector that matches those blocks. */
const RULES: Record<keyof EditorBlocks, string[]> = {
  rtlLines: ["{direction:rtl;unicode-bidi:isolate}"],
  rtlContainers: MIRROR,
  alignRight: ["{text-align:right}"],
  alignLeft: ["{text-align:left}"],
};

/** The generated rules for one editor's blocks, each block matched by `selectorOf`. */
export const editorCss = (blocks: EditorBlocks, selectorOf: (el: Element) => string): string =>
  (Object.keys(RULES) as Array<keyof EditorBlocks>)
    .filter((kind) => blocks[kind].length)
    .map((kind) => {
      const matched = `:is(${blocks[kind].map(selectorOf).join(",")})`;
      return RULES[kind].map((rule) => matched + rule).join("");
    })
    .join("");
