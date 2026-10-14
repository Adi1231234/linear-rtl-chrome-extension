"use strict";
(() => {
  // src/editor/rules.ts
  var LINES = ":is([contenteditable],.ProseMirror) :is(.text-node,p,div,li,h1,h2,h3,h4,blockquote)";
  var BASE_CSS = `${LINES}{unicode-bidi:plaintext;text-align:start;}`;
  var MIRROR = [
    ":is(ul){padding-left:0;padding-right:var(--editor-list-inset)}",
    ":is(ul:not([data-type=todo_list]))>li::before{left:auto;right:calc((-1 * var(--editor-list-inset)) + (var(--editor-bullet-disc-offset) / 2))}",
    ":is([data-type=todo_list])>li>.todo-checkbox-container{left:auto;right:calc(-1 * var(--editor-list-inset));flex-direction:row-reverse}",
    ":is(ol){grid-template-columns:1fr max-content}",
    ":is(ol)>li>*{grid-column:1/2}",
    ":is(ol)>li::before{grid-column:2/3;grid-row:1;direction:rtl;transform:translate(0.55em)}",
    ":is(blockquote){padding-left:0;padding-right:var(--editor-block-spacing)}",
    ":is(blockquote)::before{left:auto;right:0}"
  ];
  var RULES = {
    rtlLines: ["{direction:rtl;unicode-bidi:isolate}"],
    rtlContainers: MIRROR,
    alignRight: ["{text-align:right}"],
    alignLeft: ["{text-align:left}"]
  };
  var editorCss = (blocks, selectorOf) => Object.keys(RULES).filter((kind) => blocks[kind].length).map((kind) => {
    const matched = `:is(${blocks[kind].map(selectorOf).join(",")})`;
    return RULES[kind].map((rule) => matched + rule).join("");
  }).join("");

  // src/rtl-text.ts
  var RTL_RANGES = [
    [1424, 2303],
    [64285, 65023],
    [65136, 65279]
  ];
  var RTL = new RegExp(
    `[${RTL_RANGES.map(([lo, hi]) => `${String.fromCharCode(lo)}-${String.fromCharCode(hi)}`).join("")}]`
  );
  var hasRtl = (text) => RTL.test(text);
  var LTR = /[A-Za-zÀ-ʯ]/;
  var firstStrongDir = (text) => {
    for (const ch of text) {
      if (RTL.test(ch)) return "rtl";
      if (LTR.test(ch)) return "ltr";
    }
    return null;
  };
  var rtlWordCount = (text) => {
    let count = 0;
    for (const token of text.split(/\s+/)) {
      if (RTL.test(token) && ++count > 1) return count;
    }
    return count;
  };
  var isRtlLine = (text) => firstStrongDir(text) === "rtl" || rtlWordCount(text) > 1;
  var lineDirection = (text) => isRtlLine(text) ? "rtl" : firstStrongDir(text);

  // src/editor/decide.ts
  var LINES2 = "p, h1, h2, h3, h4, h5, h6";
  var CONTAINERS = "ol, ul, blockquote";
  var majority = (dirs) => {
    const rtl = dirs.filter((d) => d === "rtl").length;
    const ltr = dirs.filter((d) => d === "ltr").length;
    if (rtl !== ltr) return rtl > ltr ? "rtl" : "ltr";
    return dirs.find((d) => d !== null) ?? null;
  };
  var editorBlocks = (root) => {
    const holderOf = (el) => {
      const container = el.parentElement?.closest(CONTAINERS);
      return container && root.contains(container) ? container : root;
    };
    const lines = [...root.querySelectorAll(LINES2)];
    const own = new Map(lines.map((line) => [line, lineDirection(line.textContent ?? "")]));
    const holder = new Map(lines.map((line) => [line, holderOf(line)]));
    const directLines = /* @__PURE__ */ new Map();
    for (const [line, held] of holder) {
      const group = directLines.get(held);
      if (group) group.push(line);
      else directLines.set(held, [line]);
    }
    const dirsOf = (els) => [...els].map((el) => own.get(el) ?? null);
    const resolved = /* @__PURE__ */ new Map([[root, majority([...own.values()])]]);
    for (const container of root.querySelectorAll(CONTAINERS)) {
      const dir = majority(dirsOf(directLines.get(container) ?? [])) ?? majority(dirsOf(container.querySelectorAll(LINES2))) ?? resolved.get(holderOf(container)) ?? null;
      resolved.set(container, dir);
    }
    const holderDir = (line) => resolved.get(holder.get(line) ?? root) ?? null;
    const lineDir = (line) => own.get(line) ?? holderDir(line);
    const sideOf = (line) => holder.get(line) === root ? lineDir(line) : holderDir(line);
    const misaligned = (side) => lines.filter((line) => sideOf(line) === side && lineDir(line) !== side);
    return {
      rtlLines: lines.filter((line) => lineDir(line) === "rtl"),
      rtlContainers: [...resolved].filter(([container, dir]) => container !== root && dir === "rtl").map(([container]) => container),
      alignRight: misaligned("rtl"),
      alignLeft: misaligned("ltr")
    };
  };

  // src/editor/root.ts
  var EDITOR_ROOT = ".ProseMirror";
  var ROOT_ATTR = "data-rtl-editor";
  var nextId = 0;
  var isEditorContent = (el) => el.isContentEditable || el.closest(EDITOR_ROOT) !== null;
  var editorRootOf = (node) => (node instanceof Element ? node : node.parentElement)?.closest(EDITOR_ROOT) ?? null;
  var editorRootsIn = (node) => {
    if (!(node instanceof Element)) return [];
    const roots = [...node.querySelectorAll(EDITOR_ROOT)];
    return node.matches(EDITOR_ROOT) ? [node, ...roots] : roots;
  };
  var rootSelector = (root) => {
    if (!root.hasAttribute(ROOT_ATTR)) root.setAttribute(ROOT_ATTR, String(++nextId));
    return `${EDITOR_ROOT}[${ROOT_ATTR}="${root.getAttribute(ROOT_ATTR)}"]`;
  };
  var pathSelectors = (root) => {
    const positions = /* @__PURE__ */ new Map();
    const position = (node, parent) => {
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

  // src/editor/sheet.ts
  var perEditor = /* @__PURE__ */ new Map();
  var style = null;
  var current = "";
  var render = () => {
    for (const root of perEditor.keys()) if (!root.isConnected) perEditor.delete(root);
    const css = BASE_CSS + [...perEditor.values()].join("");
    if (style && css !== current) style.textContent = current = css;
  };
  var cssFor = (root) => editorCss(editorBlocks(root), pathSelectors(root));
  var installEditorSheet = () => {
    style = document.createElement("style");
    style.textContent = current = BASE_CSS;
    (document.head ?? document.documentElement).appendChild(style);
  };
  var refreshEditors = (roots) => {
    for (const root of roots) if (root.isConnected) perEditor.set(root, cssFor(root));
    render();
  };
  var refreshEditorsIn = (node) => {
    const roots = editorRootsIn(node);
    if (roots.length) refreshEditors(roots);
  };
  var refreshAllEditors = () => refreshEditors(editorRootsIn(document.body));

  // src/layout.ts
  var SKIP_TAGS = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE", "NOSCRIPT"]);
  var BLOCK_DISPLAYS = /* @__PURE__ */ new Set(["block", "flex", "grid", "list-item", "table-cell", "flow-root"]);
  var ISSUE_LINK = 'a[href*="/issue/"], a[href*="/issues/"]';
  var isSkippableTag = (tagName) => SKIP_TAGS.has(tagName);
  var isSkipped = (el) => {
    for (let node = el; node; node = node.parentElement) {
      if (SKIP_TAGS.has(node.tagName)) return true;
    }
    return false;
  };
  var isBlock = (el) => BLOCK_DISPLAYS.has(getComputedStyle(el).display);
  var boardCard = (el) => {
    const link = el.closest(`${ISSUE_LINK}, a[href*="/project/"]`);
    if (!link || getComputedStyle(link).display === "grid") return null;
    return link.getBoundingClientRect().height > 56 ? link : null;
  };
  var listMasterGrid = (el) => {
    const row = el.closest(ISSUE_LINK);
    if (!row || getComputedStyle(row).display !== "grid") return null;
    let grid = row;
    while (grid && /subgrid|none/.test(getComputedStyle(grid).gridTemplateColumns)) {
      grid = grid.parentElement;
    }
    return grid;
  };
  var isInlineRef = (el) => {
    const link = el.closest(`${ISSUE_LINK}, a[href*="/project/"]`);
    if (!link || getComputedStyle(link).display === "grid") return false;
    return link.getBoundingClientRect().height <= 56;
  };

  // src/placement.ts
  var flippedCard = /* @__PURE__ */ new WeakMap();
  var linePlacement = {
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
    }
  };

  // src/inline-ref/placement.ts
  var floated = /* @__PURE__ */ new WeakMap();
  var leadingBadges = (el) => {
    const badges = [];
    for (const node of el.childNodes) {
      if (node instanceof HTMLElement) badges.push(node);
      else if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) break;
    }
    return badges;
  };
  var title = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const badge = leadingBadges(el).at(-1);
    if (badge) range.setStartAfter(badge);
    return range.toString();
  };
  var inlineRefPlacement = {
    text: title,
    apply: (el) => {
      const badges = leadingBadges(el);
      for (const badge of badges) badge.style.float = "left";
      floated.set(el, badges);
    },
    revert: (el) => {
      for (const badge of floated.get(el) ?? []) badge.style.float = "";
      floated.delete(el);
    }
  };

  // src/direction.ts
  var flipped = /* @__PURE__ */ new WeakMap();
  var updateDirection = (el) => {
    if (!(el instanceof HTMLElement) || isEditorContent(el)) return;
    const placement = flipped.get(el) ?? (isInlineRef(el) ? inlineRefPlacement : linePlacement);
    if (isRtlLine(placement.text(el))) {
      if (flipped.has(el) && el.getAttribute("dir") === "rtl") return;
      el.setAttribute("dir", "rtl");
      placement.apply(el);
      flipped.set(el, placement);
    } else if (flipped.has(el)) {
      el.removeAttribute("dir");
      placement.revert(el);
      flipped.delete(el);
    }
  };

  // src/scanner.ts
  var addParent = (textNode, set) => {
    const el = textNode.parentElement;
    if (el && !isSkipped(el)) set.add(el);
  };
  var collectRtlElements = (root) => {
    const found = /* @__PURE__ */ new Set();
    if (root.nodeType === Node.TEXT_NODE) {
      if (hasRtl(root.nodeValue ?? "")) addParent(root, found);
      return found;
    }
    if (!(root instanceof Element) || isSkippableTag(root.tagName)) return found;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => hasRtl(n.nodeValue ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    for (let node = walker.nextNode(); node; node = walker.nextNode()) addParent(node, found);
    return found;
  };
  var scan = (root) => collectRtlElements(root).forEach(updateDirection);
  var processTextNode = (textNode) => {
    const el = textNode.parentElement;
    if (el && !isSkipped(el)) updateDirection(el);
  };

  // src/observer.ts
  var pending = /* @__PURE__ */ new Set();
  var scheduled = false;
  var flush = () => {
    scheduled = false;
    const items = [...pending];
    pending.clear();
    for (const item of items) {
      if (!item.isConnected) continue;
      try {
        if (item.nodeType === Node.TEXT_NODE) processTextNode(item);
        else {
          scan(item);
          refreshEditorsIn(item);
        }
      } catch {
      }
    }
  };
  var schedule = (node) => {
    pending.add(node);
    if (!scheduled) {
      scheduled = true;
      setTimeout(flush, 0);
    }
  };
  var watch = (target) => {
    new MutationObserver((mutations) => {
      const editors = /* @__PURE__ */ new Set();
      for (const mutation of mutations) {
        const editor = editorRootOf(mutation.target);
        if (editor) editors.add(editor);
        else if (mutation.type === "characterData") schedule(mutation.target);
        else if (mutation.type === "childList") mutation.addedNodes.forEach(schedule);
      }
      if (editors.size) refreshEditors(editors);
    }).observe(target, { subtree: true, childList: true, characterData: true });
  };
  var startSafetyRescan = (intervalMs) => {
    setInterval(() => {
      if (document.hidden) return;
      try {
        scan(document.body);
        refreshAllEditors();
      } catch {
      }
    }, intervalMs);
  };

  // src/main.ts
  var SAFETY_RESCAN_MS = 2e3;
  var start = () => {
    installEditorSheet();
    scan(document.body);
    refreshAllEditors();
    watch(document.body);
    startSafetyRescan(SAFETY_RESCAN_MS);
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
