// Right-to-left text detection - pure, reusable, no DOM.

// RTL Unicode blocks (every right-to-left script) plus their presentation forms, as code-point
// ranges. The matcher is built at runtime from numbers, so no script is named and no RTL glyph
// ever appears in the source.
const RTL_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0590, 0x08ff],
  [0xfb1d, 0xfdff],
  [0xfe70, 0xfeff],
];

const RTL = new RegExp(
  `[${RTL_RANGES.map(([lo, hi]) => `${String.fromCharCode(lo)}-${String.fromCharCode(hi)}`).join("")}]`,
);

export const hasRtl = (text: string): boolean => RTL.test(text);

// A strong left-to-right letter (Latin and its common extensions). Built as a range so the matcher
// stays data-driven; digits, punctuation and symbols are neutral and deliberately excluded.
const LTR = /[A-Za-zÀ-ʯ]/;

/** Direction of the first strong-directional character, skipping neutrals. Null if none. */
const firstStrongDir = (text: string): "rtl" | "ltr" | null => {
  for (const ch of text) {
    if (RTL.test(ch)) return "rtl";
    if (LTR.test(ch)) return "ltr";
  }
  return null;
};

/** Count whitespace-delimited tokens that contain an RTL character. Stops early at 2. */
export const rtlWordCount = (text: string): number => {
  let count = 0;
  for (const token of text.split(/\s+/)) {
    if (RTL.test(token) && ++count > 1) return count;
  }
  return count;
};

/**
 * The rule for turning a line RTL: it reads right-to-left when its first strong-directional
 * character is RTL (a Hebrew-led line, even one whose other words are English technical terms), or
 * when it simply contains more than one RTL word (so an English-led, mostly-Hebrew line still flips).
 */
export const isRtlLine = (text: string): boolean =>
  firstStrongDir(text) === "rtl" || rtlWordCount(text) > 1;
