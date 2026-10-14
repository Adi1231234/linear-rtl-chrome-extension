# Editor direction

Linear's rich text (issue title, description, comments, documents) is ProseMirror. This folder
gives it the same direction rule as the rest of the page, and puts the numbers, bullets, checkboxes
and quote bar of right-to-left lists and quotes on the right.

## Why a generated stylesheet, not `dir` attributes

ProseMirror re-renders any node inside the document whose attributes change: setting `dir` on a
paragraph or list item replaces that element, and re-adding it would loop forever. Only attribute
changes on the editor root itself are ignored by ProseMirror.

So nothing is written inside a document:

1. Each editor root gets a marker, `data-rtl-editor="<n>"`.
2. `decide.ts` picks the blocks that need a rule (see below).
3. `root.ts` turns each block into a selector by its position under the root, e.g.
   `.ProseMirror[data-rtl-editor="2"]>:nth-child(3)>:nth-child(1)`.
4. `sheet.ts` writes all rules into one `<style>` the extension owns.

Positions shift on every structural edit, so an editor's rules are recomputed inside the
`MutationObserver` callback (a microtask, before the next paint). A refresh costs about 0.1 ms for a
normal issue and under 1 ms for a 240-line document.

## Rules

- **Line** (paragraph, heading): RTL by the page-wide rule in `rtl-text.ts` (first letter RTL, or
  more than one RTL word). The base rule (`unicode-bidi: plaintext`) gives the first-letter part
  instantly; the generated rule adds the rest, e.g. a title like `API של המערכת`.
- **List or quote**: follows the majority of its own lines (tie: the first line). A line inside it
  keeps its own reading direction but aligns to the list's side, so an English item in a Hebrew list
  sits next to its bullet.
- **No letters yet** (empty line, new empty list): follows its list or quote, else the document.

## Linear CSS this depends on

The RTL mirrors in `rules.ts` copy Linear's own editor rules with left and right swapped: `ul`
padding, the bullet `::before`, `.todo-checkbox-container`, the `ol` marker grid column and its
`translate`, and the blockquote bar. If Linear changes those rules, the mirrors stop matching and
lists fall back to Linear's default (left-side) layout; text direction keeps working.

## Verifying

In a "New issue" draft, paste Hebrew, English and mixed paragraphs, numbered lists, bullets with
nesting, a checklist and quotes. Close the draft with **Discard** afterwards.
