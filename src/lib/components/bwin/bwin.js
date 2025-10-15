var L = Object.defineProperty;
var $ = (i, t, e) => t in i ? L(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var f = (i, t, e) => $(i, typeof t != "symbol" ? t + "" : t, e);
function I(i = 0.7, t = 128) {
  const e = 256 - t, n = Math.floor(Math.random() * e + t), s = Math.floor(Math.random() * e + t), o = Math.floor(Math.random() * e + t), h = Math.max(0.5, Math.random() * i);
  return `rgba(${n}, ${s}, ${o}, ${h})`;
}
function C(i = 2, t = 3) {
  if (i < 0 || t < 0)
    throw new Error("Parameters must be non-negative numbers");
  const e = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", n = "0123456789";
  let s = "";
  for (let o = 0; o < i; o++) {
    const h = Math.floor(Math.random() * e.length);
    s += e[h];
  }
  s += "-";
  for (let o = 0; o < t; o++) {
    const h = Math.floor(Math.random() * n.length);
    s += n[h];
  }
  return s;
}
function S(i, t) {
  for (; t.firstChild; )
    i.append(t.firstChild);
}
function W(i, t) {
  const e = document.createElement("div");
  S(e, i), S(i, t), S(t, e);
}
function b(i) {
  if (typeof i == "number" && !isNaN(i))
    return i;
  if (typeof i == "string") {
    const t = i.trim();
    if (t.endsWith("%")) {
      const e = t.slice(0, -1);
      if (!e) return NaN;
      const n = Number(e);
      return isNaN(n) ? NaN : n / 100;
    }
    if (t.endsWith("px")) {
      const e = t.slice(0, -2);
      if (!e) return NaN;
      const n = Number(e);
      return isNaN(n) ? NaN : n;
    }
    return Number(t);
  }
  return NaN;
}
function H(i) {
  return i !== null && typeof i == "object" && !Array.isArray(i) && Object.getPrototypeOf(i) === Object.prototype;
}
function O(i, t) {
  for (const e in t) {
    if (Object.hasOwn(i, e))
      throw new Error(`Key "${e}" already exists in target object`);
    i[e] = t[e];
  }
  return i;
}
function P(i) {
  const t = document.createElement("template");
  return t.innerHTML = i.trim(), t.content;
}
function m(i) {
  if (i == null || i === "")
    return null;
  if (typeof i == "string")
    try {
      const t = P(i);
      return t.childNodes.length === 1 ? t.firstChild : t;
    } catch {
      return document.createTextNode(i);
    }
  return i instanceof Node ? i : document.createTextNode(String(i));
}
function M(i) {
  const t = parseFloat(i.style.left) || 0, e = parseFloat(i.style.top) || 0, n = parseFloat(i.style.width) || 0, s = parseFloat(i.style.height) || 0;
  return { left: t, top: e, width: n, height: s };
}
const r = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
  Center: "center",
  Root: "root",
  Unknown: "unknown",
  Outside: "outside"
};
function G(i) {
  switch (i) {
    case r.Top:
      return r.Bottom;
    case r.Right:
      return r.Left;
    case r.Bottom:
      return r.Top;
    case r.Left:
      return r.Right;
    default:
      throw new Error(`[bwin] Invalid position: ${i}`);
  }
}
function F({ width: i, height: t, x: e }) {
  return t / i * e;
}
function _({ width: i, height: t, y: e }) {
  return i / t * e;
}
function k({ width: i, height: t, x: e }) {
  return t - t / i * e;
}
function U({ width: i, height: t, y: e }) {
  return i - i / t * e;
}
function q(i, { clientX: t, clientY: e }) {
  const n = i.getBoundingClientRect(), { width: s, height: o } = n, h = t - n.left, l = e - n.top;
  if (h < 0 || h > s || l < 0 || l > o)
    return r.Outside;
  const d = 0.3, c = F({ width: s, height: o, x: h }), a = k({ width: s, height: o, x: h }), p = _({ width: s, height: o, y: l }), u = U({ width: s, height: o, y: l });
  return h < s * (0.5 - d / 2) && l > c && l < a ? r.Left : h > s * (0.5 + d / 2) && l < c && l > a ? r.Right : l < o * (0.5 - d / 2) && h > p && h < u ? r.Top : l > o * (0.5 + d / 2) && h < p && h > u ? r.Bottom : h > s * (0.5 - d / 2) && h < s * (0.5 + d / 2) && l > o * (0.5 - d / 2) && l < o * (0.5 + d / 2) ? r.Center : r.Unknown;
}
const Y = 100, X = 100, w = {
  left: 0,
  top: 0,
  width: 150,
  height: 150,
  // Initial min values, real min width/height is calculated based on children
  minWidth: Y,
  minHeight: X,
  // `classic` | `natural`, `natural` means only one child is updating its size
  resizeStrategy: "classic"
};
class g {
  constructor({
    left: t = w.left,
    top: e = w.top,
    width: n = w.width,
    height: s = w.height,
    minWidth: o = w.minWidth,
    minHeight: h = w.minHeight,
    resizeStrategy: l = w.resizeStrategy,
    parent: d = null,
    domNode: c = null,
    store: a = {},
    position: p,
    id: u
  } = w) {
    if (this.id = u ?? C(), !p)
      throw new Error("[bwin] Sash position is required");
    this.position = p, this.domNode = c, this.parent = d, this._top = e, this._left = t, this._width = n, this._height = s, this.children = [], this.minWidth = o, this.minHeight = h, this.resizeStrategy = l, this.store = a;
  }
  walk(t) {
    this.children.forEach((e) => e.walk(t)), t(this);
  }
  isLeaf() {
    return this.children.length === 0;
  }
  // A sash that doesn't split is a leaf, in UI it's a pane
  isSplit() {
    return this.children.length > 0;
  }
  isLeftRightSplit() {
    return this.children.some(
      (t) => t.position === r.Left || t.position === r.Right
    );
  }
  isTopBottomSplit() {
    return this.children.some(
      (t) => t.position === r.Top || t.position === r.Bottom
    );
  }
  get leftChild() {
    return this.children.find((t) => t.position === r.Left);
  }
  get rightChild() {
    return this.children.find((t) => t.position === r.Right);
  }
  get topChild() {
    return this.children.find((t) => t.position === r.Top);
  }
  get bottomChild() {
    return this.children.find((t) => t.position === r.Bottom);
  }
  getChildren() {
    let t = null, e = null, n = null, s = null;
    for (const o of this.children)
      o.position === r.Left ? t = o : o.position === r.Right ? e = o : o.position === r.Top ? n = o : o.position === r.Bottom && (s = o);
    return [n, e, s, t];
  }
  getAllLeafDescendants() {
    const t = [];
    return this.walk((e) => {
      e.children.length === 0 && t.push(e);
    }), t;
  }
  calcMinWidth() {
    if (this.isLeaf())
      return this.minWidth;
    const [t, e, n, s] = this.getChildren();
    if (s && e) {
      const o = s.calcMinWidth() + e.calcMinWidth();
      return Math.max(this.minWidth, o);
    }
    if (t && n) {
      const o = Math.max(t.calcMinWidth(), n.calcMinWidth());
      return Math.max(this.minWidth, o);
    }
  }
  calcMinHeight() {
    if (this.isLeaf())
      return this.minHeight;
    const [t, e, n, s] = this.getChildren();
    if (s && e) {
      const o = Math.max(s.calcMinHeight(), e.calcMinHeight());
      return Math.max(this.minHeight, o);
    }
    if (t && n) {
      const o = t.calcMinHeight() + n.calcMinHeight();
      return Math.max(this.minHeight, o);
    }
  }
  // Get self or descendant by id
  getById(t) {
    if (this.id === t)
      return this;
    for (const e of this.children) {
      const n = e.getById(t);
      if (n)
        return n;
    }
    return null;
  }
  swapIds(t, e) {
    const n = this.getById(t), s = this.getById(e);
    if (!n || !s)
      throw new Error("[bwin] Sash not found when swapping IDs");
    const o = n.id;
    n.id = s.id, s.id = o;
  }
  // Get all ids of self and descendants
  getAllIds() {
    const t = [this.id];
    for (const e of this.children)
      t.push(...e.getAllIds());
    return t;
  }
  addChild(t) {
    if (this.children.length >= 2)
      throw new Error("[bwin] Maximum 2 children allowed");
    this.children.push(t);
  }
  getDescendantParentById(t) {
    for (const e of this.children) {
      if (e.id === t)
        return this;
      const n = e.getDescendantParentById(t);
      if (n)
        return n;
    }
    return null;
  }
  getChildSiblingById(t) {
    return this.children.find((e) => e.id !== t);
  }
  get top() {
    return this._top;
  }
  set top(t) {
    const e = t - this._top;
    this._top = t;
    const [n, s, o, h] = this.getChildren();
    n && o && (n.top += e, o.top += e), h && s && (h.top += e, s.top += e);
  }
  get left() {
    return this._left;
  }
  set left(t) {
    const e = t - this._left;
    this._left = t;
    const [n, s, o, h] = this.getChildren();
    h && s && (h.left += e, s.left += e), n && o && (n.left += e, o.left += e);
  }
  get width() {
    return this._width;
  }
  set width(t) {
    const e = t - this._width;
    this._width = t;
    const [n, s, o, h] = this.getChildren();
    if (h && s) {
      const l = h.width + s.width, d = e * (h.width / l), c = l + e;
      let a, p, u;
      if (this.resizeStrategy === "natural" && this.position === r.Left ? (a = h.width, p = s.width + e, u = s.left) : this.resizeStrategy === "natural" && this.position === r.Right ? (a = h.width + e, p = s.width, u = h.left + a) : (a = h.width + d, p = c - a, u = s.left + d), e < 0) {
        const y = h.calcMinWidth(), E = s.calcMinWidth();
        a < y && p > E ? (a = h.width, p = c - a, u = h.left + a) : p < E && a > y && (p = s.width, a = c - p, u = h.left + a);
      }
      h.width = a, s.width = p, s.left = u;
    }
    n && o && (n.width += e, o.width += e);
  }
  get height() {
    return this._height;
  }
  set height(t) {
    const e = t - this._height;
    this._height = t;
    const [n, s, o, h] = this.getChildren();
    if (n && o) {
      const l = n.height + o.height, d = e * (n.height / l), c = l + e;
      let a, p, u;
      if (this.resizeStrategy === "natural" && this.position === r.Top ? (a = n.height, p = o.height + e, u = o.top) : this.resizeStrategy === "natural" && this.position === r.Bottom ? (a = n.height + e, p = o.height, u = n.top + a) : (a = n.height + d, p = c - a, u = o.top + d), e < 0) {
        const y = n.calcMinHeight(), E = o.calcMinHeight();
        a < y && p > E ? (a = n.height, p = c - a, u = n.top + a) : p < E && a > y && (p = o.height, a = c - p, u = n.top + a);
      }
      n.height = a, o.height = p, o.top = u;
    }
    h && s && (h.height += e, s.height += e);
  }
}
const v = {
  size: "50%",
  position: r.Left
};
class z {
  constructor({
    parentRect: t,
    children: e,
    siblingConfigNode: n,
    id: s,
    minWidth: o,
    minHeight: h,
    position: l,
    size: d,
    resizeStrategy: c,
    ...a
  }) {
    f(this, "left");
    f(this, "top");
    f(this, "width");
    f(this, "height");
    this.parentRect = t, this.children = e, this.siblingConfigNode = n, this.id = s, this.minWidth = o, this.minHeight = h, this.position = this.getPosition(l), this.size = this.getSize(d), this.resizeStrategy = c, this.nonCoreData = a, this.setBounds();
  }
  getPosition(t) {
    if (!this.siblingConfigNode)
      return t;
    const e = G(this.siblingConfigNode.position);
    if (!t)
      return e;
    if (t !== e)
      throw new Error("[bwin] Sibling position and current position are not opposite");
    return t;
  }
  getSize(t) {
    if (!this.siblingConfigNode)
      return b(t);
    if (!t) {
      if (this.siblingConfigNode.size < 1)
        return 1 - this.siblingConfigNode.size;
      if (this.siblingConfigNode.position === r.Left || this.siblingConfigNode.position === r.Right)
        return this.parentRect.width - this.siblingConfigNode.width;
      if (this.siblingConfigNode.position === r.Top || this.siblingConfigNode.position === r.Bottom)
        return this.parentRect.height - this.siblingConfigNode.height;
    }
    const e = b(t);
    if (e < 1) {
      if (e + this.siblingConfigNode.size !== 1)
        throw new Error("[bwin] Sum of sibling sizes is not equal to 1");
    } else {
      if ((this.position === r.Left || this.position === r.Right) && e + this.siblingConfigNode.size !== this.parentRect.width)
        throw new Error("[bwin] Sum of sibling sizes is not equal to parent width");
      if ((this.position === r.Top || this.position === r.Bottom) && e + this.siblingConfigNode.size !== this.parentRect.height)
        throw new Error("[bwin] Sum of sibling sizes is not equal to parent height");
    }
    return e;
  }
  setBounds() {
    if (this.position === r.Root)
      this.left = 0, this.top = 0, this.width = this.parentRect.width, this.height = this.parentRect.height;
    else if (this.position === r.Left) {
      const t = this.size < 1 ? this.parentRect.width * this.size : this.size;
      this.left = this.parentRect.left, this.top = this.parentRect.top, this.width = t, this.height = this.parentRect.height;
    } else if (this.position === r.Right) {
      const t = this.size < 1 ? this.parentRect.width * this.size : this.size;
      this.left = this.parentRect.left + this.parentRect.width - t, this.top = this.parentRect.top, this.width = t, this.height = this.parentRect.height;
    } else if (this.position === r.Top) {
      const t = this.size < 1 ? this.parentRect.height * this.size : this.size;
      this.left = this.parentRect.left, this.top = this.parentRect.top, this.width = this.parentRect.width, this.height = t;
    } else if (this.position === r.Bottom) {
      const t = this.size < 1 ? this.parentRect.height * this.size : this.size;
      this.left = this.parentRect.left, this.top = this.parentRect.top + this.parentRect.height - t, this.width = this.parentRect.width, this.height = t;
    }
  }
  createSash({ resizeStrategy: t } = {}) {
    return new g({
      left: this.left,
      top: this.top,
      width: this.width,
      height: this.height,
      position: this.position,
      id: this.id,
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      resizeStrategy: t || this.resizeStrategy,
      store: this.nonCoreData
    });
  }
  normConfig(t) {
    if (H(t))
      return t;
    if (Array.isArray(t))
      return {
        children: t
      };
    if (typeof t == "string" || typeof t == "number") {
      const e = b(t);
      if (isNaN(e))
        throw new Error(`[bwin] Invalid size value: ${e}`);
      return {
        size: t
      };
    } else {
      if (t == null)
        return {};
      throw new Error(`[bwin] Invalid config value: ${t}`);
    }
  }
  createPrimaryConfigNode({ size: t, position: e, children: n, id: s, minWidth: o, minHeight: h, ...l }) {
    return new z({
      parentRect: this,
      size: t ?? v.size,
      position: e ?? v.position,
      children: n,
      id: s,
      minWidth: o,
      minHeight: h,
      ...l
    });
  }
  createSecondaryConfigNode({ size: t, position: e, children: n, id: s, minWidth: o, minHeight: h, ...l }, d) {
    return new z({
      parentRect: this,
      size: t,
      position: e,
      children: n,
      siblingConfigNode: d,
      id: s,
      minWidth: o,
      minHeight: h,
      ...l
    });
  }
  buildSashTree({ resizeStrategy: t } = {}) {
    const e = this.createSash({ resizeStrategy: t });
    if (!Array.isArray(this.children) || this.children.length === 0)
      return e;
    const n = this.normConfig(this.children[0]), s = this.normConfig(this.children.at(1));
    let o, h;
    if (!n.size && !n.position && s ? (s.position || (s.position = r.Right), o = this.createPrimaryConfigNode(s), h = this.createSecondaryConfigNode(
      n,
      o
    )) : (o = this.createPrimaryConfigNode(n), h = this.createSecondaryConfigNode(
      s,
      o
    )), o && h) {
      const l = o.buildSashTree({ resizeStrategy: t }), d = h.buildSashTree({ resizeStrategy: t });
      l.parent = e, d.parent = e, e.children.push(l), e.children.push(d);
    }
    return e;
  }
}
const R = {
  width: 333,
  height: 333
}, D = {
  fitContainer: !1
};
class j extends z {
  constructor({
    id: t,
    children: e,
    width: n = R.width,
    height: s = R.height,
    fitContainer: o = D.fitContainer,
    ...h
  } = {
    ...R,
    ...D
  }) {
    super({
      id: t,
      children: e,
      size: NaN,
      position: r.Root,
      parentRect: { width: n, height: s },
      ...h
    }), this.fitContainer = o;
  }
}
class K extends g {
  constructor(t = w) {
    super({ ...t, position: r.Root }), Object.assign(this, D);
  }
}
function V(i) {
  const t = document.createElement("bw-pane");
  return t.style.top = `${i.top}px`, t.style.left = `${i.left}px`, t.style.width = `${i.width}px`, t.style.height = `${i.height}px`, t.setAttribute("sash-id", i.id), t.setAttribute("position", i.position), t;
}
function J(i) {
  const t = i.domNode;
  return t.style.top = `${i.top}px`, t.style.left = `${i.left}px`, t.style.width = `${i.width}px`, t.style.height = `${i.height}px`, t.setAttribute("position", i.position), t;
}
function Q(i, { size: t, id: e }) {
  const n = b(t);
  let s = i.width / 2;
  n && (n < 1 ? s = i.width * n : s = n);
  const o = new g({
    id: e,
    top: i.top,
    left: i.left,
    width: s,
    height: i.height,
    position: r.Left
  }), h = new g({
    id: i.id,
    top: i.top,
    left: i.left + o.width,
    width: i.width - s,
    height: i.height,
    position: r.Right,
    domNode: i.domNode
  });
  return i.addChild(o), i.addChild(h), i.domNode = null, i.id = C(), o;
}
function Z(i, { size: t, id: e }) {
  const n = b(t);
  let s = i.width / 2;
  n && (n < 1 ? s = i.width * n : s = n);
  const o = new g({
    id: i.id,
    left: i.left,
    top: i.top,
    width: i.width - s,
    height: i.height,
    position: r.Left,
    domNode: i.domNode
  }), h = new g({
    id: e,
    left: i.left + o.width,
    top: i.top,
    width: s,
    height: i.height,
    position: r.Right
  });
  return i.addChild(o), i.addChild(h), i.domNode = null, i.id = C(), h;
}
function tt(i, { size: t, id: e }) {
  const n = b(t);
  let s = i.height / 2;
  n && (n < 1 ? s = i.height * n : s = n);
  const o = new g({
    id: e,
    left: i.left,
    top: i.top,
    width: i.width,
    height: s,
    position: r.Top
  }), h = new g({
    id: i.id,
    left: i.left,
    top: i.top + o.height,
    width: i.width,
    height: i.height - s,
    position: r.Bottom,
    domNode: i.domNode
  });
  return i.addChild(o), i.addChild(h), i.domNode = null, i.id = C(), o;
}
function it(i, { size: t, id: e }) {
  const n = b(t);
  let s = i.height / 2;
  n && (n < 1 ? s = i.height * n : s = n);
  const o = new g({
    id: i.id,
    top: i.top,
    left: i.left,
    width: i.width,
    height: i.height - s,
    position: r.Top,
    domNode: i.domNode
  }), h = new g({
    id: e,
    top: i.top + o.height,
    left: i.left,
    width: i.width,
    height: s,
    position: r.Bottom
  });
  return i.addChild(o), i.addChild(h), i.domNode = null, i.id = C(), h;
}
function et(i, { position: t, size: e, id: n, minWidth: s, minHeight: o }) {
  if (t === r.Left)
    return Q(i, { size: e, id: n });
  if (t === r.Right)
    return Z(i, { size: e, id: n });
  if (t === r.Top)
    return tt(i, { size: e, id: n });
  if (t === r.Bottom)
    return it(i, { size: e, id: n });
}
function A(i) {
  if (i.tagName === "BW-PANE")
    return i.getAttribute("sash-id");
  const t = i.closest("bw-pane");
  if (!t)
    throw new Error("[bwin] Pane element not found");
  return t.getAttribute("sash-id");
}
const nt = {
  createPane(i) {
    const t = V(i);
    return i.store.droppable === !1 && t.setAttribute("can-drop", "false"), t;
  },
  // Intended to be overridden
  onPaneCreate(i, t) {
    t.store.content && i.append(m(t.store.content)), this != null && this.debug && (i.style.backgroundColor = I(), i.innerHTML = "", i.append(x(i)));
  },
  updatePane(i) {
    return J(i);
  },
  // Intended to be overridden
  onPaneUpdate(i, t) {
    this != null && this.debug && (i.innerHTML = "", i.append(x(i)));
  },
  /**
   * Add a pane into the target pane. The two panes become next to each other
   *
   * @param {string} targetPaneSashId - The Sash ID of the target pane that the new pane moves into
   * @param {'top'|'right'|'bottom'|'left'} position - The position of the new pane relative to the target pane
   * @returns {Sash} - The newly created sash
   */
  addPane(i, { position: t, size: e, id: n }) {
    if (!t) throw new Error("[bwin] Position is required when adding pane");
    const s = this.rootSash.getById(i);
    if (!s) throw new Error("[bwin] Parent sash not found when adding pane");
    const o = et(s, { position: t, size: e, id: n });
    return this.update(), o;
  },
  /**
   * Remove a pane
   *
   * @param {string} sashId - The Sash ID of the pane to be removed
   */
  removePane(i) {
    const t = this.rootSash.getDescendantParentById(i);
    if (!t) throw new Error("[bwin] Parent sash not found when removing pane");
    const e = t.getChildSiblingById(i);
    e.children.length === 0 ? (t.id = e.id, t.domNode = e.domNode, t.domNode.setAttribute("sash-id", e.id), t.children = []) : (t.id = C(), t.children = e.children, e.position === r.Left ? e.width = t.width : e.position === r.Right ? (e.width = t.width, e.left = t.left) : e.position === r.Top ? e.height = t.height : e.position === r.Bottom && (e.height = t.height, e.top = t.top)), this.update();
  },
  swapPanes(i, t) {
    const e = A(i), n = A(t), s = i.getAttribute("can-drop") !== "false", o = t.getAttribute("can-drop") !== "false";
    this.rootSash.swapIds(e, n), W(i, this.activeDropPaneEl), i.setAttribute("sash-id", n), t.setAttribute("sash-id", e), i.setAttribute("can-drop", o), t.setAttribute("can-drop", s);
  }
};
function x(i) {
  const t = document.createElement("pre");
  t.style.fontSize = "10px";
  const e = `
${i.getAttribute("sash-id")}
${i.getAttribute("position")}
top: ${i.style.top}
left: ${i.style.left}
width: ${i.style.width}
height: ${i.style.height}
`;
  return t.innerHTML = e.trim(), t;
}
const st = {
  createWindow() {
    const i = document.createElement("bw-window");
    return i.style.width = `${this.rootSash.width}px`, i.style.height = `${this.rootSash.height}px`, i.setAttribute("root-sash-id", this.rootSash.id), i;
  },
  glaze() {
    this.rootSash.walk((i) => {
      let t = null;
      i.children.length > 0 ? (t = this.createMuntin(i), this.onMuntinCreate(t, i), this.windowElement.append(t)) : (t = this.createPane(i), this.onPaneCreate(t, i), this.windowElement.prepend(t)), i.domNode = t;
    });
  },
  update() {
    this.windowElement.style.width = `${this.rootSash.width}px`, this.windowElement.style.height = `${this.rootSash.height}px`;
    const i = this.rootSash.getAllIds(), t = [];
    this.windowElement.querySelectorAll("[sash-id]").forEach((e) => {
      const n = e.getAttribute("sash-id");
      t.push(n), i.includes(n) || e.remove();
    }), this.rootSash.walk((e) => {
      e.children.length > 0 ? t.includes(e.id) ? (this.updateMuntin(e), this.onMuntinUpdate(e.domNode, e)) : (e.domNode = this.createMuntin(e), this.windowElement.append(e.domNode)) : t.includes(e.id) ? (this.updatePane(e), this.onPaneUpdate(e.domNode, e)) : (e.domNode || (e.domNode = this.createPane(e)), this.windowElement.prepend(e.domNode));
    });
  }
}, ot = {
  muntinSize: 4,
  createMuntin(i) {
    const t = document.createElement("bw-muntin"), e = i.leftChild, n = i.topChild;
    return e ? (t.style.width = `${this.muntinSize}px`, t.style.height = `${i.height}px`, t.style.top = `${i.top}px`, t.style.left = `${i.left + e.width - this.muntinSize / 2}px`, t.setAttribute("vertical", "")) : n && (t.style.width = `${i.width}px`, t.style.height = `${this.muntinSize}px`, t.style.top = `${i.top + n.height - this.muntinSize / 2}px`, t.style.left = `${i.left}px`, t.setAttribute("horizontal", "")), t.setAttribute("sash-id", i.id), i.store.resizable === !1 && t.setAttribute("resizable", "false"), t;
  },
  onMuntinCreate(i, t) {
  },
  updateMuntin(i) {
    const t = i.domNode, e = i.leftChild, n = i.topChild;
    e ? (t.style.height = `${i.height}px`, t.style.top = `${i.top}px`, t.style.left = `${i.left + e.width - this.muntinSize / 2}px`) : n && (t.style.width = `${i.width}px`, t.style.top = `${i.top + n.height - this.muntinSize / 2}px`, t.style.left = `${i.left}px`);
  },
  onMuntinUpdate(i, t) {
  }
}, ht = {
  fitContainer: !1,
  fit() {
    this.rootSash.width = this.containerElement.clientWidth, this.rootSash.height = this.containerElement.clientHeight, this.update();
  },
  enableFitContainer() {
    new ResizeObserver((t) => {
      requestAnimationFrame(() => {
        for (const e of t)
          e.target === this.containerElement && this.fitContainer && this.fit();
      });
    }).observe(this.containerElement);
  }
}, rt = {
  activeMuntinSash: null,
  isResizeStarted: !1,
  isDropStarted: !1,
  lastX: 0,
  lastY: 0,
  applyResizeStyles() {
    this.activeMuntinSash.domNode.hasAttribute("vertical") ? document.body.classList.add("body--bw-resize-x") : this.activeMuntinSash.domNode.hasAttribute("horizontal") && document.body.classList.add("body--bw-resize-y");
  },
  revertResizeStyles() {
    document.body.classList.remove("body--bw-resize-x"), document.body.classList.remove("body--bw-resize-y");
  },
  enableResize() {
    document.addEventListener("mousedown", (i) => {
      if (i.target.tagName !== "BW-MUNTIN" || i.target.getAttribute("resizable") === "false") return;
      const t = i.target.getAttribute("sash-id");
      this.activeMuntinSash = this.rootSash.getById(t), this.activeMuntinSash && (this.isResizeStarted = !0, this.lastX = i.pageX, this.lastY = i.pageY, this.applyResizeStyles());
    }), document.addEventListener("mousemove", (i) => {
      if (!this.isResizeStarted || !this.activeMuntinSash) return;
      const [t, e, n, s] = this.activeMuntinSash.getChildren(), o = this.activeMuntinSash.isLeftRightSplit(), h = this.activeMuntinSash.isTopBottomSplit();
      if (o && s && e) {
        const l = i.pageX - this.lastX, d = s.width + l, c = e.width - l;
        if (l > 0 && c <= e.calcMinWidth() || l < 0 && d <= s.calcMinWidth()) return;
        s.width = d, e.width = c, e.left = e.left + l, this.update(), this.lastX = i.pageX;
      } else if (h && t && n) {
        const l = i.pageY - this.lastY, d = t.height + l, c = n.height - l;
        if (l > 0 && c <= n.calcMinHeight() || l < 0 && d <= t.calcMinHeight()) return;
        t.height = d, n.height = c, n.top = n.top + l, this.update(), this.lastY = i.pageY;
      }
    }), document.addEventListener("mouseup", () => {
      this.isResizeStarted = !1, this.activeMuntinSash = null, this.revertResizeStyles();
    });
  }
}, lt = {
  activeDropPaneEl: null,
  // Intended to be overridden in `BinaryWindow` class
  onPaneDrop(i, t) {
  },
  enableDrop() {
    this.windowElement.addEventListener("dragover", (i) => {
      i.preventDefault();
      const t = i.target.matches("bw-pane") ? i.target : i.target.closest("bw-pane");
      if (!t || (t !== this.activeDropPaneEl && (this.activeDropPaneEl && this.activeDropPaneEl.removeAttribute("drop-area"), this.activeDropPaneEl = t), t.getAttribute("can-drop") === "false")) return;
      const e = q(t, i);
      t.setAttribute("drop-area", e);
    }), this.windowElement.addEventListener("dragleave", (i) => {
      i.currentTarget.contains(i.relatedTarget) && i.currentTarget !== i.relatedTarget || this.activeDropPaneEl && (this.activeDropPaneEl.removeAttribute("drop-area"), this.activeDropPaneEl = null);
    }), this.windowElement.addEventListener("drop", (i) => {
      if (!this.activeDropPaneEl || this.activeDropPaneEl.getAttribute("can-drop") === "false") return;
      const t = this.activeDropPaneEl.getAttribute("sash-id"), e = this.rootSash.getById(t);
      this.onPaneDrop(i, e), typeof e.store.onDrop == "function" && e.store.onDrop(i, e), this.activeDropPaneEl.removeAttribute("drop-area"), this.activeDropPaneEl = null;
    });
  }
}, dt = !1;
class B {
  constructor(t) {
    f(this, "windowElement", null);
    f(this, "containerElement", null);
    f(this, "debug", dt);
    let e = null;
    t instanceof K ? (e = t, this.rootSash = t) : (e = new j(t), this.rootSash = e.buildSashTree({ resizeStrategy: e.resizeStrategy })), this.fitContainer = e.fitContainer;
  }
  frame(t) {
    this.containerElement = t, this.windowElement = this.createWindow(), this.glaze(), this.containerElement.append(this.windowElement);
  }
  // Features can work independently to each other
  enableFeatures() {
    this.enableResize(), this.enableDrop(), this.fitContainer && this.enableFitContainer();
  }
  mount(t) {
    this.frame(t), this.enableFeatures();
  }
  static assemble(...t) {
    t.forEach((e) => {
      O(this.prototype, e);
    });
  }
}
B.assemble(
  st,
  ot,
  nt,
  ht,
  lt,
  rt
);
const at = {
  label: "",
  className: "bw-glass-action--close",
  onClick: (i, t) => {
    const e = A(i.target);
    t.removePane(e);
  }
}, ct = {
  label: "",
  className: "bw-glass-action--minimize",
  onClick: (i, t) => {
    const e = t.sillElement;
    if (!e) throw new Error("[bwin] Sill element not found when minimizing");
    const n = m('<button class="bw-minimized-glass" />');
    e.append(n);
    const s = i.target.closest("bw-pane"), o = i.target.closest("bw-glass"), h = s.getAttribute("sash-id"), l = s.getAttribute("position");
    n.bwGlassElement = o, n.bwOriginalPosition = l, n.bwOriginalBoundingRect = M(s), n.bwOriginalSashId = h, t.removePane(h);
  }
}, pt = {
  label: "",
  className: "bw-glass-action--maximize",
  onClick: (i) => {
    const t = i.target.closest("bw-pane");
    t.hasAttribute("maximized") ? (t.removeAttribute("maximized"), t.style.left = `${t.bwOriginalBoundingRect.left}px`, t.style.top = `${t.bwOriginalBoundingRect.top}px`, t.style.width = `${t.bwOriginalBoundingRect.width}px`, t.style.height = `${t.bwOriginalBoundingRect.height}px`) : (t.setAttribute("maximized", ""), t.bwOriginalBoundingRect = M(t), t.style.left = "0", t.style.top = "0", t.style.width = "100%", t.style.height = "100%");
  }
};
function ut(i, t) {
  const e = i.left + i.width, n = i.top + i.height, s = t.left + t.width, o = t.top + t.height;
  if (i.left >= s || t.left >= e || i.top >= o || t.top >= n)
    return null;
  const h = Math.max(i.left, t.left), l = Math.max(i.top, t.top), d = Math.min(e, s), c = Math.min(n, o);
  return {
    left: h,
    top: l,
    width: d - h,
    height: c - l
  };
}
const ft = [ct, pt, at], gt = {
  enableActions() {
    this.handleMinimizedGlassClick(), this.observeActionButtons();
  },
  restoreGlass(i) {
    const t = i.bwOriginalBoundingRect;
    let e = 0, n = null;
    if (this.windowElement.querySelectorAll("bw-pane").forEach((s) => {
      const o = M(s), h = ut(t, o);
      if (h) {
        const l = h.width * h.height;
        l > e && (e = l, n = s);
      }
    }), n) {
      const s = i.bwOriginalPosition, o = M(n), h = n.getAttribute("sash-id"), l = this.rootSash.getById(h);
      let d = 0;
      if (s === r.Left || s === r.Right)
        d = o.width - t.width < l.minWidth ? o.width / 2 : t.width;
      else if (s === r.Top || s === r.Bottom)
        d = o.height - t.height < l.minHeight ? o.height / 2 : t.height;
      else
        throw new Error("[bwin] Invalid position when restoring glass");
      const c = i.bwOriginalSashId;
      this.addPane(n.getAttribute("sash-id"), {
        id: c,
        position: s,
        size: d
      }).domNode.append(i.bwGlassElement);
    }
  },
  handleMinimizedGlassClick() {
    this.sillElement.addEventListener("click", (i) => {
      if (!i.target.matches(".bw-minimized-glass")) return;
      const t = i.target;
      this.restoreGlass(t), t.remove();
    });
  },
  updateDisabledStateOfActionButtons() {
    this.updateDisabledState(".bw-glass-action--close"), this.updateDisabledState(".bw-glass-action--minimize"), this.updateDisabledState(".bw-glass-action--maximize");
  },
  updateDisabledState(i) {
    if (this.windowElement.querySelectorAll("bw-pane").length === 1) {
      const e = this.windowElement.querySelector(i);
      e && e.setAttribute("disabled", "");
    } else
      this.windowElement.querySelectorAll(i).forEach((e) => {
        e.removeAttribute("disabled");
      });
  },
  getMinimizedGlassElementBySashId(i) {
    const t = this.windowElement.querySelectorAll(".bw-minimized-glass");
    return Array.from(t).find((e) => e.bwOriginalSashId === i);
  },
  observeActionButtons() {
    this.updateDisabledStateOfActionButtons(), new MutationObserver((t) => {
      t.forEach((e) => {
        e.type === "childList" && this.updateDisabledStateOfActionButtons();
      });
    }).observe(this.windowElement, {
      childList: !0
    });
  }
}, N = {
  title: null,
  content: null,
  tabs: [],
  actions: void 0,
  draggable: !0
};
class T {
  constructor({
    title: t = N.title,
    content: e = N.content,
    tabs: n = N.tabs,
    actions: s = N.actions,
    draggable: o = N.draggable,
    sash: h,
    binaryWindow: l
  }) {
    f(this, "domNode");
    this.title = t, this.content = e, this.tabs = n, this.actions = s, this.sash = h, this.draggable = o, this.binaryWindow = l, this.build();
  }
  build() {
    const t = document.createElement("bw-glass-header");
    if (Array.isArray(this.tabs) && this.tabs.length > 0)
      t.append(this.createTabs());
    else if (this.title) {
      const s = document.createElement("bw-glass-title");
      s.append(m(this.title)), t.append(s);
    }
    t.setAttribute("can-drag", this.draggable), t.append(this.createActions());
    const e = document.createElement("bw-glass-content"), n = m(this.content);
    n && e.append(n), this.domNode = document.createElement("bw-glass"), this.domNode.append(t, e);
  }
  createTabs() {
    const t = document.createElement("bw-glass-tab-container");
    for (const e of this.tabs) {
      const n = (e == null ? void 0 : e.label) ?? e, s = m(`<button class="bw-glass-tab">${n}</button>`);
      t.append(s);
    }
    return t;
  }
  createActions() {
    const t = document.createElement("bw-glass-action-container"), e = this.actions === void 0 ? ft : Array.isArray(this.actions) ? this.actions : [];
    for (const n of e) {
      const s = (n == null ? void 0 : n.label) ?? n, o = n.className ? `bw-glass-action ${n.className}` : "bw-glass-action", h = m(`<button class="${o}">${s}</button>`);
      typeof n.onClick == "function" && h.addEventListener("click", (l) => {
        n.onClick(l, this.binaryWindow);
      }), t.append(h);
    }
    return t;
  }
  get contentElement() {
    return this.domNode.querySelector("bw-glass-content");
  }
  get headerElement() {
    return this.domNode.querySelector("bw-glass-header");
  }
}
const wt = {
  activeDragGlassEl: null,
  activeDragGlassPaneCanDrop: !1,
  onPaneDrop(i, t) {
    if (!this.activeDragGlassEl) return;
    const e = this.activeDropPaneEl.getAttribute("drop-area");
    if (e === "center") {
      const n = this.activeDragGlassEl.closest("bw-pane");
      this.swapPanes(n, this.activeDropPaneEl);
      return;
    } else {
      const n = A(this.activeDragGlassEl);
      this.removePane(n), this.addPane(t.id, { position: e, id: n }).domNode.append(this.activeDragGlassEl);
    }
  },
  enableDrag() {
    document.addEventListener("mousedown", (i) => {
      if (i.button !== 0 || !i.target.matches("bw-glass-header")) return;
      if (i.target.getAttribute("can-drag") === "false") {
        i.preventDefault();
        return;
      }
      const e = i.target.closest("bw-glass");
      e.setAttribute("draggable", !0), this.activeDragGlassEl = e;
    }), document.addEventListener("mouseup", () => {
      this.activeDragGlassEl && (this.activeDragGlassEl.removeAttribute("draggable"), this.activeDragGlassEl = null);
    }), this.windowElement.addEventListener("dragstart", (i) => {
      if (!(i.target instanceof HTMLElement) || !i.target.matches("bw-glass") || !this.activeDragGlassEl)
        return;
      i.dataTransfer.effectAllowed = "move";
      const t = this.activeDragGlassEl.closest("bw-pane");
      this.activeDragGlassPaneCanDrop = t.getAttribute("can-drop") !== "false", t.setAttribute("can-drop", !1);
    }), this.windowElement.addEventListener("dragend", () => {
      this.activeDragGlassEl && (this.activeDragGlassEl.removeAttribute("draggable"), this.activeDragGlassEl.closest("bw-pane").setAttribute("can-drop", this.activeDragGlassPaneCanDrop), this.activeDragGlassEl = null);
    });
  }
}, mt = {
  trimMuntin(i) {
    i.hasAttribute("vertical") ? (i.style.top = `${parseFloat(i.style.top) + this.muntinSize / 2}px`, i.style.height = `${parseFloat(i.style.height) - this.muntinSize}px`) : i.hasAttribute("horizontal") && (i.style.left = `${parseFloat(i.style.left) + this.muntinSize / 2}px`, i.style.width = `${parseFloat(i.style.width) - this.muntinSize}px`);
  },
  onMuntinCreate(i) {
    this.trimMuntin(i);
  },
  onMuntinUpdate(i) {
    this.trimMuntin(i);
  }
};
class bt extends B {
  constructor() {
    super(...arguments);
    f(this, "sillElement", null);
  }
  frame() {
    super.frame(...arguments);
    const e = m("<bw-sill />");
    this.windowElement.append(e), this.sillElement = e;
  }
  enableFeatures() {
    super.enableFeatures(), this.enableDrag(), this.enableActions();
  }
  onPaneCreate(e, n) {
    const s = new T({ ...n.store, sash: n, binaryWindow: this });
    e.innerHTML = "", e.append(s.domNode), this.debug && s.contentElement.prepend(`${n.id}`);
  }
  onPaneUpdate() {
  }
  /**
   * Add a pane with glass into the target pane.
   *
   * @param {string} targetPaneSashId - The Sash ID of the target pane
   * @param {Object} props - The pane and glass properties grouped together
   * @returns {Sash} - The newly created Sash
   */
  addPane(e, n) {
    const { position: s, size: o, id: h, ...l } = n, d = super.addPane(e, { position: s, size: o, id: h }), c = new T({ ...l, sash: d, binaryWindow: this });
    return d.domNode.append(c.domNode), d;
  }
  removePane(e) {
    if (this.windowElement.querySelector(`[sash-id="${e}"]`)) {
      super.removePane(e);
      return;
    }
    const s = this.getMinimizedGlassElementBySashId(e);
    s && s.remove();
  }
}
bt.assemble(wt, mt, gt);
export {
  ft as BUILTIN_ACTIONS,
  bt as BinaryWindow,
  j as ConfigRoot,
  B as Frame,
  r as Position,
  g as Sash,
  K as SashConfig
};