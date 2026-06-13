// Editor styling - rich-text editors (e.g. ProseMirror) strip injected dir attributes, so editors
// get a CSS rule instead: per-paragraph auto direction that survives re-renders.
const SELECTOR =
  ":is([contenteditable],.ProseMirror) :is(.text-node,p,div,li,h1,h2,h3,h4,blockquote)";

export const injectEditorCss = (): void => {
  const style = document.createElement("style");
  style.textContent = `${SELECTOR}{unicode-bidi:plaintext;text-align:start;}`;
  (document.head ?? document.documentElement).appendChild(style);
};
