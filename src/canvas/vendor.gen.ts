// AUTO-GENERATED — não edite. Rode: deno task vendor-quickdraw
// @quickdrawjs/core@0.2.0 (MIT — ver https://github.com/quickdrawjs/quickdraw/blob/main/LICENSE)
// Servido em /canvas/vendor/quickdraw/* (offline, da memória).
export const QUICKDRAW_VERSION = "0.2.0";

export const QUICKDRAW_FILES: Readonly<Record<string, string>> = {
  "index.js": `// Public face of the Quickdraw engine. The React and React Native SDKs build
// boards through here — same editor, same UI, same feel — and so can any
// plain web page: every module is dependency-free ESM.

export { Editor, TOOLS } from './editor.js'
export { Store, newId, isDiffEmpty, invertDiff, composeDiff } from './store.js'
export { buildUI } from './ui.js'
export {
  themeOf, THEMES, COLOR_IDS, SIZE_IDS, DASH_IDS, FILL_IDS, GEO_IDS, GRID_IDS,
  SIZES, FONT_SIZES, FONTS,
} from './palette.js'
export { pageBounds, localBounds, drawShape, hitShape } from './shapes.js'
export { strokeOutline } from './freehand.js'

import { Editor } from './editor.js'
import { buildUI } from './ui.js'

// The "made with Quickdraw" mark in the board's corner. It stays up when the
// toolbar is hidden — hosts building their own chrome still credit the
// engine — and hosts that need it gone pass watermark: false.
export function buildWatermark(editor) {
  const a = document.createElement('a')
  a.className = 'qd-watermark'
  a.href = 'https://tryquickdraw.com'
  a.target = '_blank'
  a.rel = 'noopener'
  a.setAttribute('aria-label', 'Made with Quickdraw')
  a.innerHTML =
    \`<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">\` +
    \`<path d="M6 22 C6 12, 12 6, 20 7 C27 8, 28 16, 22 19 C17 21.5, 12 20, 13 15" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" fill="none"/>\` +
    \`<circle cx="25.5" cy="25.5" r="3" fill="currentColor"/>\` +
    \`</svg><span>Quickdraw</span>\`
  a.addEventListener('pointerdown', (e) => e.stopPropagation())
  editor.container.appendChild(a)
  return a
}

// One call: editor + chrome in a container.
// opts: { container, store?, theme?, grid?, readonly?, hideUi?, camera?, styles?,
//         onSave?, themeToggle?, gridControl?, watermark? }
export function createQuickdraw(opts) {
  const editor = new Editor(opts)
  editor.container.dataset.qdTheme = editor.theme.id
  const ui = buildUI(editor, {
    hidden: opts.hideUi || opts.readonly,
    onSave: opts.onSave,
    themeToggle: opts.themeToggle,
    gridControl: opts.gridControl,
  })
  const watermark = opts.watermark === false ? null : buildWatermark(editor)
  return {
    editor,
    ui,
    destroy() {
      watermark?.remove()
      ui.destroy()
      editor.destroy()
    },
  }
}
`,
  "editor.js": `// The Quickdraw editor: camera, tools, selection, input and rendering over a
// Store. Framework-free — the React and React Native SDKs wrap it, plain
// pages use it bare, and every host gets the identical feel.
// Dependency-free ESM: runs in any modern browser as-is, no build step.

import { Store, newId } from './store.js'
import { themeOf, SIZES, FONT_SIZES, GEO_IDS, COLOR_IDS, GRID_IDS, GRID_STEP, GRID_MAJOR } from './palette.js'
import {
  localBounds, pageBounds, toLocal, drawShape, hitShape, marqueeHits,
  scaleShape, textLayout, noteLayout, NOTE_W, sampleLinePts,
} from './shapes.js'
import { boundsUnion, boundsExpand, boundsContain, clamp, rotWith } from './geometry.js'

const ZOOM_MIN = 0.05
const ZOOM_MAX = 8
const HANDLE = 8 // screen px
const RESIZE_CURSORS = {
  tl: 'nwse-resize', br: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize',
  t: 'ns-resize', b: 'ns-resize', l: 'ew-resize', r: 'ew-resize',
}
const DEFAULT_STYLES = { color: 'black', size: 'm', dash: 'draw', fill: 'none', font: 'draw' }

export const TOOLS = ['select', 'hand', 'draw', 'highlight', 'eraser', 'laser', 'arrow', 'line', 'geo', 'text', 'note']

// local position of the bend handle: the curve's midpoint (chord midpoint
// when straight — sampleLinePts collapses to the two endpoints at bend 0)
const bendMidpoint = (pr) => {
  if (!pr.bend) return { x: pr.dx / 2, y: pr.dy / 2 }
  const mid = sampleLinePts(pr, pr.bend)
  const mi = Math.floor(mid.length / 4) * 2
  return { x: mid[mi], y: mid[mi + 1] }
}

export class Editor {
  constructor({ container, store, theme = 'light', grid = 'lines', readonly = false, camera, styles, geoKind } = {}) {
    this.container = container
    this.store = store || new Store()
    this.theme = themeOf(theme)
    this.grid = GRID_IDS.includes(grid) ? grid : 'lines'
    this.readonly = !!readonly
    this.camera = camera || { x: 0, y: 0, z: 1 }
    this.styles = { ...DEFAULT_STYLES, ...(styles || {}) }
    this.geoKind = geoKind || 'rectangle'
    this.tool = 'draw'
    this.selection = new Set()
    this.session = null
    this.editing = null // { id, textarea, field: 'text' | 'label' }
    this.scribbles = [] // local laser strokes
    this.remoteScribbles = []
    this.remoteScribblesAt = 0
    this.spaceHeld = false
    this.captureCanvas = null
    // pen mode: once a stylus is seen, fingers stop drawing — a resting palm
    // is ignored, two fingers still steer the camera. setPenMode(false) opts
    // back out; auto-arm happens only once so that choice sticks.
    this.penMode = false
    this._penSeen = false
    this._penDown = false
    this._events = new Map()
    this._raf = 0
    this._camAnim = 0
    this._pointers = new Map()
    this._ptrType = new Map() // pointerId -> pointerType, for pen-mode gating
    this._destroyed = false

    // DOM
    container.classList.add('qd-root')
    container.tabIndex = 0
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'qd-canvas'
    this.overlay = document.createElement('canvas')
    this.overlay.className = 'qd-overlay'
    container.prepend(this.overlay)
    container.prepend(this.canvas)

    this._bind()
    this._unsubStore = this.store.listen(() => {
      this._pruneSelection()
      this.requestRender()
      this.emit('change')
    })
    // history moves on its own channel: the end of a gesture batch changes
    // canUndo/canRedo without emitting a document diff
    this._unsubHistory = this.store.listenHistory(() => this.emit('history'))
    this.requestRender()
  }

  // ---- events --------------------------------------------------------------
  on(ev, fn) {
    if (!this._events.has(ev)) this._events.set(ev, new Set())
    this._events.get(ev).add(fn)
    return () => this._events.get(ev).delete(fn)
  }
  emit(ev, ...args) {
    const s = this._events.get(ev)
    if (s) for (const fn of [...s]) { try { fn(...args) } catch (e) { console.warn('board event failed', e) } }
  }

  // ---- camera --------------------------------------------------------------
  viewSize() {
    return { w: this.container.clientWidth || 1, h: this.container.clientHeight || 1 }
  }
  screenToPage(sx, sy) {
    const c = this.camera
    return { x: sx / c.z - c.x, y: sy / c.z - c.y }
  }
  pageToScreen(px, py) {
    const c = this.camera
    return { x: (px + c.x) * c.z, y: (py + c.y) * c.z }
  }
  viewportPageBounds() {
    const { w, h } = this.viewSize()
    const c = this.camera
    return { x: -c.x, y: -c.y, w: w / c.z, h: h / c.z }
  }
  setCamera(cam, { animate = 0 } = {}) {
    this._cancelFitEase()
    cancelAnimationFrame(this._camAnim)
    if (!animate) {
      this.camera = { ...cam }
      this._afterCamera()
      return
    }
    const from = { ...this.camera }
    const t0 = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - t0) / animate)
      const e = 1 - Math.pow(1 - t, 3)
      this.camera = {
        x: from.x + (cam.x - from.x) * e,
        y: from.y + (cam.y - from.y) * e,
        z: from.z + (cam.z - from.z) * e,
      }
      this._afterCamera()
      if (t < 1) this._camAnim = requestAnimationFrame(step)
    }
    this._camAnim = requestAnimationFrame(step)
  }
  _afterCamera() {
    this.requestRender()
    this.emit('camera')
  }
  pan(dxScreen, dyScreen) {
    const c = this.camera
    this.setCamera({ ...c, x: c.x + dxScreen / c.z, y: c.y + dyScreen / c.z })
  }
  zoomAt(sx, sy, mult, opts) {
    const c = this.camera
    const z = clamp(c.z * mult, ZOOM_MIN, ZOOM_MAX)
    const p = this.screenToPage(sx, sy)
    this.setCamera({ z, x: sx / z - p.x, y: sy / z - p.y }, opts)
  }
  contentBounds() {
    let b = null
    for (const s of this.store.shapes()) b = boundsUnion(b, pageBounds(s))
    return b
  }
  // Re-fit the camera to the drawn content with a margin — the transition
  // companion. Zoom capped at 1:1 so a lone small mark doesn't blow up.
  // \`ease\` (ms): one rAF loop owns the camera for the whole beat — the fit
  // target re-reads the live-resizing frame every frame, the camera's
  // starting offset from it decays once, and the render happens in the same
  // frame as the camera write. Resize ticks that arrive while the ease is
  // running are no-ops; a second driver on another clock reads as judder.
  fitContent({ margin = 0.08, maxZoom = 1, animate = 0, ease = 0 } = {}) {
    // called before the container has layout (mount effects, hidden tabs):
    // defer until the first render tick that sees real dimensions, or the
    // camera would clamp to minimum zoom and strand the drawing microscopic
    if (this._deferFit(() => this.fitContent({ margin, maxZoom, animate, ease }))) return
    const fitNow = () => {
      const b = this.contentBounds()
      if (!b || b.w <= 0 || b.h <= 0) return null
      const { w, h } = this.viewSize()
      const inset = Math.min(w, h) * margin
      const z = clamp(Math.min(maxZoom, (w - inset * 2) / b.w, (h - inset * 2) / b.h), ZOOM_MIN, ZOOM_MAX)
      if (!isFinite(z) || z <= 0) return null
      return { z, x: w / 2 / z - (b.x + b.w / 2), y: h / 2 / z - (b.y + b.h / 2) }
    }
    if (!ease) {
      const fit = fitNow()
      if (fit) this.setCamera(fit, { animate })
      return
    }
    this._easeToFit(fitNow, ease)
  }
  // Fit an explicit page rect into the view — e.g. a remote peer's viewport,
  // mirrored live. Cover-fit: the rect's center stays centered and the
  // frame fills edge to edge, so differing aspect ratios crop rather than
  // letterbox. \`ease\` tracks a live frame resize exactly like fitContent's.
  followBounds(b, { animate = 0, ease = 0 } = {}) {
    if (!b || !(b.w > 0) || !(b.h > 0)) return
    if (this._deferFit(() => this.followBounds(b, { animate, ease }))) return
    const fitNow = () => {
      const { w, h } = this.viewSize()
      const z = clamp(Math.max(w / b.w, h / b.h), ZOOM_MIN, ZOOM_MAX)
      if (!isFinite(z) || z <= 0) return null
      return { z, x: w / 2 / z - (b.x + b.w / 2), y: h / 2 / z - (b.y + b.h / 2) }
    }
    if (!ease) {
      const fit = fitNow()
      if (fit) this.setCamera(fit, { animate })
      return
    }
    this._easeToFit(fitNow, ease)
  }
  // true (and remembers the retry) while the container has no layout yet;
  // render() replays the latest pending fit once real dimensions appear
  _deferFit(retry) {
    const { w, h } = this.viewSize()
    if (w > 1 && h > 1) return false
    this._pendingFit = retry
    return true
  }
  // one rAF loop owns the camera for the whole beat: the fit target re-reads
  // the live-resizing frame every frame, the starting offset decays once
  _easeToFit(fitNow, ease) {
    if (this._fitEase) return // the loop below is already tracking the frame
    const fit0 = fitNow()
    if (!fit0) return
    const c = this.camera
    const fe = this._fitEase = { t0: 0, dur: ease, dx: c.x - fit0.x, dy: c.y - fit0.y, dz: c.z - fit0.z }
    cancelAnimationFrame(this._camAnim)
    const step = (now) => {
      if (this._fitEase !== fe || this._destroyed) return
      if (!fe.t0) fe.t0 = now
      const t = Math.min(1, (now - fe.t0) / fe.dur)
      const e = 1 - Math.pow(1 - t, 3)
      const fit = fitNow()
      if (fit) {
        this.camera = {
          z: fit.z + fe.dz * (1 - e),
          x: fit.x + fe.dx * (1 - e),
          y: fit.y + fe.dy * (1 - e),
        }
        this.render()
        this.emit('camera')
      }
      if (t < 1) this._fitEaseRaf = requestAnimationFrame(step)
      else this._fitEase = null
    }
    this._fitEaseRaf = requestAnimationFrame(step)
  }
  _cancelFitEase() {
    this._fitEase = null
    cancelAnimationFrame(this._fitEaseRaf)
  }
  // ---- tools / styles ------------------------------------------------------
  setTool(tool) {
    if (!TOOLS.includes(tool)) return
    this._commitText()
    this.tool = tool
    if (tool !== 'select') this.setSelection([])
    this._syncCursor()
    this.emit('tool')
    this.requestRender()
  }
  setGeoKind(kind) {
    if (GEO_IDS.includes(kind)) { this.geoKind = kind; this.emit('tool') }
  }
  setTheme(id) {
    const t = themeOf(id)
    if (t === this.theme) return
    this.theme = t
    this.container.dataset.qdTheme = t.id
    this.requestRender()
    this.emit('theme')
  }
  // 'none' | 'lines' | 'dots' — the backdrop behind the drawing
  setGrid(id) {
    if (!GRID_IDS.includes(id) || id === this.grid) return
    this.grid = id
    this.requestRender()
    this.emit('grid')
  }
  setReadonly(ro) {
    this.readonly = !!ro
    if (ro) { this._cancelSession(); this._commitText(); this.setSelection([]) }
    this._syncCursor()
  }
  setPenMode(on) {
    on = !!on
    if (this.penMode === on) return
    this.penMode = on
    this.emit('penmode')
  }
  // pointers eligible for the two-finger pinch: in pen mode the pen itself
  // never counts — only fingers steer the camera
  _pinchPoints() {
    const pts = []
    for (const [id, p] of this._pointers) {
      if (this.penMode && this._ptrType.get(id) === 'pen') continue
      pts.push(p)
    }
    return pts
  }
  setStyle(key, value) {
    this.styles = { ...this.styles, [key]: value }
    if (this.selection.size) {
      const APPLIES = {
        color: ['draw', 'highlight', 'geo', 'arrow', 'line', 'text', 'note'],
        size: ['draw', 'highlight', 'geo', 'arrow', 'line', 'text', 'note'],
        dash: ['draw', 'geo', 'arrow', 'line'],
        fill: ['geo'],
        font: ['text', 'note', 'geo'],
      }
      this.store.transact(() => {
        for (const id of this.selection) {
          const s = this.store.get(id)
          if (s && APPLIES[key]?.includes(s.type)) this.store.update(id, { props: { [key]: value } })
        }
      })
    }
    this.emit('styles')
  }
  // shared styles of the selection (null value = mixed), or the pen styles
  currentStyles() {
    if (!this.selection.size) return { ...this.styles }
    const out = {}
    for (const id of this.selection) {
      const s = this.store.get(id)
      if (!s) continue
      for (const k of ['color', 'size', 'dash', 'fill', 'font']) {
        if (s.props[k] === undefined) continue
        if (!(k in out)) out[k] = s.props[k]
        else if (out[k] !== s.props[k]) out[k] = null
      }
    }
    return { ...this.styles, ...out }
  }

  // ---- selection -----------------------------------------------------------
  setSelection(ids) {
    this.selection = new Set(ids)
    this.requestRender()
    this.emit('selection')
  }
  _pruneSelection() {
    let dirty = false
    for (const id of this.selection) if (!this.store.has(id)) { this.selection.delete(id); dirty = true }
    if (dirty) this.emit('selection')
  }
  selectionBounds() {
    let b = null
    for (const id of this.selection) {
      const s = this.store.get(id)
      if (s) b = boundsUnion(b, pageBounds(s))
    }
    return b
  }
  deleteSelection() {
    if (!this.selection.size) return
    this.store.remove([...this.selection])
    this.setSelection([])
  }
  // Empties the board in one undoable step (⇧⌘⌫, or the board menu).
  clearBoard() {
    if (!this.store.ids().length) return
    this._cancelSession()
    this._commitText()
    this.store.clear()
    this.setSelection([])
  }
  selectAll() {
    if (this.tool !== 'select') this.setTool('select')
    this.setSelection(this.store.shapes().map((s) => s.id))
  }
  duplicateSelection(offset = 16) {
    if (!this.selection.size) return
    const ids = []
    let z = this.store.maxZ()
    this.store.transact(() => {
      for (const id of this.selection) {
        const s = this.store.get(id)
        if (!s || s.typeName === 'asset') continue
        const copy = { ...s, id: newId(), x: s.x + offset, y: s.y + offset, z: ++z }
        this.store.put(copy)
        ids.push(copy.id)
      }
    })
    this.setSelection(ids)
  }
  bringToFront() {
    let z = this.store.maxZ()
    const sel = this.store.shapes().filter((s) => this.selection.has(s.id)).sort((a, b) => a.z - b.z)
    this.store.transact(() => { for (const s of sel) this.store.update(s.id, { z: ++z }) })
  }
  sendToBack() {
    let z = this.store.minZ()
    const sel = this.store.shapes().filter((s) => this.selection.has(s.id)).sort((a, b) => b.z - a.z)
    this.store.transact(() => { for (const s of sel) this.store.update(s.id, { z: --z }) })
  }

  shapesSorted() {
    // highlighter lives under the ink, like on paper — highlights render
    // first (in their own z order), everything else above
    return this.store.shapes().sort(
      (a, b) =>
        (a.type === 'highlight' ? 0 : 1) - (b.type === 'highlight' ? 0 : 1) ||
        a.z - b.z ||
        (a.id < b.id ? -1 : 1)
    )
  }
  hitTest(px, py) {
    const tol = 8 / this.camera.z
    const list = this.shapesSorted()
    for (let i = list.length - 1; i >= 0; i--) {
      if (hitShape(list[i], px, py, tol, this.store)) return list[i]
    }
    return null
  }

  // ---- input ---------------------------------------------------------------
  _bind() {
    const c = this.container
    this._onDown = (e) => this._pointerDown(e)
    this._onMove = (e) => this._pointerMove(e)
    this._onUp = (e) => this._pointerUp(e)
    this._onWheel = (e) => this._wheel(e)
    this._onKeyDown = (e) => this._keyDown(e)
    this._onKeyUp = (e) => this._keyUp(e)
    this._onDblClick = (e) => this._dblClick(e)
    this._onDrop = (e) => this._drop(e)
    this._onDragOver = (e) => { e.preventDefault(); e.stopPropagation() }
    this._onPaste = (e) => this._paste(e)
    c.addEventListener('pointerdown', this._onDown)
    c.addEventListener('pointermove', this._onMove)
    c.addEventListener('pointerup', this._onUp)
    c.addEventListener('pointercancel', this._onUp)
    c.addEventListener('wheel', this._onWheel, { passive: false })
    c.addEventListener('keydown', this._onKeyDown)
    c.addEventListener('keyup', this._onKeyUp)
    c.addEventListener('dblclick', this._onDblClick)
    c.addEventListener('drop', this._onDrop)
    c.addEventListener('dragover', this._onDragOver)
    c.addEventListener('paste', this._onPaste)
    // losing focus mid-gesture (a host app may reclaim the space key by
    // blurring the board) must not leave a sticky space-pan behind
    this._onBlur = () => { this.spaceHeld = false; this._syncCursor() }
    c.addEventListener('blur', this._onBlur)
    this._ro = new ResizeObserver(() => this.requestRender())
    this._ro.observe(c)
  }

  _evPoint(e) {
    const r = this.container.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  _pointerDown(e) {
    if (this.readonly) return
    if (e.target !== this.canvas && e.target !== this.overlay && e.target !== this.container) return
    if (e.button === 2) return
    if (this.editing) this._commitText()
    this.container.focus({ preventScroll: true })
    const s = this._evPoint(e)
    this._pointers.set(e.pointerId, s)
    this._ptrType.set(e.pointerId, e.pointerType)
    try { this.container.setPointerCapture(e.pointerId) } catch {}

    if (e.pointerType === 'pen') {
      this._penDown = true
      // first stylus contact arms pen mode, once — turning it off is a choice
      if (!this._penSeen) { this._penSeen = true; this.setPenMode(true) }
    }

    // second finger: the gesture becomes a pinch — a just-started stroke is
    // taken back, it was the start of a zoom, not a mark. While the pen is
    // down in pen mode, landing fingers are a resting palm, never a pinch.
    if (!this.penMode || e.pointerType !== 'pen') {
      const pp = this._pinchPoints()
      if (pp.length === 2 && !(this.penMode && this._penDown)) {
        this._abortForPinch()
        const [a, b] = pp
        this.session = {
          type: 'pinch',
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          cam: { ...this.camera },
        }
        return
      }
      if (pp.length > 2) return
    }
    // in pen mode a finger never draws
    if (this.penMode && e.pointerType === 'touch') return
    if (this._pointers.size > 2) return
    if (this.session?.type === 'pinch') return

    const p = this.screenToPage(s.x, s.y)
    if (e.button === 1 || this.spaceHeld || this.tool === 'hand') {
      this.session = { type: 'panning', last: s }
      this._syncCursor('grabbing')
      return
    }

    switch (this.tool) {
      case 'draw':
      case 'highlight': return this._beginDraw(e, p)
      case 'eraser': return this._beginErase(p)
      case 'laser': return this._beginLaser(p)
      case 'arrow':
      case 'line': return this._beginLineish(this.tool, p, e)
      case 'geo': return this._beginGeo(p, e)
      // placing waits for pointerup: the textarea we focus would otherwise be
      // blurred again by the browser's default focus-on-mousedown action
      case 'text':
      case 'note':
        this.session = { type: 'placing', tool: this.tool, page: p }
        return
      case 'select': return this._beginSelect(e, s, p)
    }
  }

  _pointerMove(e) {
    if (this.readonly) return
    if (this._pointers.has(e.pointerId)) this._pointers.set(e.pointerId, this._evPoint(e))
    const ss = this.session
    if (!ss) {
      this._hoverCursor(e)
      return
    }
    // in pen mode a finger only ever steers the camera — a palm dragging
    // across the glass must not extend the pen's stroke
    if (this.penMode && e.pointerType === 'touch' && ss.type !== 'pinch' && ss.type !== 'panning') return
    const s = this._evPoint(e)
    const p = this.screenToPage(s.x, s.y)

    switch (ss.type) {
      case 'pinch': {
        const pp = this._pinchPoints()
        if (pp.length < 2) return
        const [a, b] = pp
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
        const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const z = clamp(ss.cam.z * (dist / ss.dist), ZOOM_MIN, ZOOM_MAX)
        // keep the page point under the initial pinch center pinned, then pan
        // with the center as it travels
        const p0 = { x: ss.center.x / ss.cam.z - ss.cam.x, y: ss.center.y / ss.cam.z - ss.cam.y }
        this.setCamera({ z, x: center.x / z - p0.x, y: center.y / z - p0.y })
        return
      }
      case 'panning': {
        this.pan(s.x - ss.last.x, s.y - ss.last.y)
        ss.last = s
        return
      }
      case 'drawing': return this._extendDraw(e, p)
      case 'erasing': return this._extendErase(p)
      case 'lasering': return this._extendLaser(p)
      case 'lineish': return this._dragLineish(p, e)
      case 'geo-create': return this._dragGeo(p, e)
      case 'marquee': {
        ss.rect = {
          x: Math.min(ss.origin.x, p.x), y: Math.min(ss.origin.y, p.y),
          w: Math.abs(p.x - ss.origin.x), h: Math.abs(p.y - ss.origin.y),
        }
        const hits = this.shapesSorted().filter((sh) => marqueeHits(sh, ss.rect)).map((sh) => sh.id)
        this.setSelection(ss.additive ? [...new Set([...ss.base, ...hits])] : hits)
        return
      }
      case 'translating': return this._dragTranslate(p, e)
      case 'resizing': return this._dragResize(p, e)
      case 'rotating': return this._dragRotate(p, e)
      case 'handle': return this._dragHandle(p, e)
      case 'pressing': {
        if (Math.hypot(s.x - ss.start.x, s.y - ss.start.y) > 4) {
          // the press became a drag — start translating (alt = drag a copy)
          this.session = null
          this._beginTranslate(ss.page, e)
          if (this.session) this._dragTranslate(p, e)
        }
        return
      }
    }
  }

  _pointerUp(e) {
    this._pointers.delete(e.pointerId)
    this._ptrType.delete(e.pointerId)
    if (e.pointerType === 'pen') this._penDown = false
    const ss = this.session
    if (!ss) return
    if (ss.type === 'pinch') {
      if (this._pinchPoints().length < 2) this.session = null
      return
    }
    // a palm lift in pen mode must not end the pen's live stroke
    if (this.penMode && e.pointerType === 'touch' && ss.type !== 'panning') return
    switch (ss.type) {
      case 'panning':
        this.session = null
        this._syncCursor()
        return
      case 'drawing': return this._endDraw()
      case 'erasing': return this._endErase()
      case 'lasering': return this._endLaser()
      case 'lineish': return this._endLineish()
      case 'geo-create': return this._endGeo()
      case 'marquee':
        this.session = null
        this.requestRender()
        return
      case 'translating': return this._endTranslate()
      case 'placing': {
        this.session = null
        ss.tool === 'note' ? this._placeNote(ss.page) : this._placeText(ss.page)
        return
      }
      case 'resizing':
      case 'rotating':
      case 'handle':
        this.store.endBatch()
        this.session = null
        this._syncCursor()
        this.requestRender()
        return
      case 'pressing': {
        // a clean click: selection settles to the pressed shape (or clears);
        // an additive click toggles — unless the down-stroke just added it
        if (ss.hit) this.setSelection(ss.additive ? (ss.added ? [...this.selection] : this._toggled(ss.hit.id)) : [ss.hit.id])
        else if (!ss.additive) this.setSelection([])
        this.session = null
        return
      }
    }
  }

  _toggled(id) {
    const next = new Set(this.selection)
    next.has(id) ? next.delete(id) : next.add(id)
    return [...next]
  }

  _abortForPinch() {
    const ss = this.session
    if (!ss) return
    if (ss.type === 'drawing') {
      this.store.remove([ss.id])
      this.store.endBatch()
    } else if (ss.type === 'lineish' || ss.type === 'geo-create') {
      this.store.remove([ss.id])
      this.store.endBatch()
    } else if (['translating', 'resizing', 'rotating', 'handle', 'erasing'].includes(ss.type)) {
      this.store.endBatch()
    }
    this.session = null
  }
  _cancelSession() {
    this._abortForPinch()
    this.requestRender()
  }

  // ---- draw / highlight ----------------------------------------------------
  _beginDraw(e, p) {
    const type = this.tool
    const id = newId()
    this.store.beginBatch()
    const shape = {
      id, typeName: 'shape', type, x: p.x, y: p.y, rot: 0, z: this.store.maxZ() + 1,
      props: {
        pts: [0, 0, e.pressure || 0.5],
        color: this.styles.color,
        size: this.styles.size,
        // the pencil honors the line style too: 'draw' is pressure ink, the
        // others render as an even-width (dashed/dotted/solid) line
        ...(type === 'draw' ? { dash: this.styles.dash } : {}),
        done: false,
        ...(e.pointerType === 'pen' ? { isPen: true } : {}),
      },
    }
    this.store.put(shape)
    this.session = { type: 'drawing', id, last: p }
  }
  _extendDraw(e, p) {
    const ss = this.session
    const shape = this.store.get(ss.id)
    if (!shape) { this.session = null; return }
    const minD = 1.25 / this.camera.z
    if (Math.hypot(p.x - ss.last.x, p.y - ss.last.y) < minD) return
    ss.last = p
    // coalesced points ride along for pens — extra fidelity is free
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]
    const pts = shape.props.pts.slice()
    for (const ce of evs.length ? evs : [e]) {
      const cp = this.screenToPage(...(() => { const r = this._evPoint(ce); return [r.x, r.y] })())
      pts.push(cp.x - shape.x, cp.y - shape.y, ce.pressure || 0.5)
    }
    this.store.update(ss.id, { props: { pts } })
  }
  _endDraw() {
    const ss = this.session
    if (this.store.get(ss.id)) this.store.update(ss.id, { props: { done: true } })
    this.store.endBatch()
    this.session = null
  }

  // ---- eraser --------------------------------------------------------------
  _beginErase(p) {
    this.session = { type: 'erasing', hits: new Set(), trail: [p.x, p.y], last: p }
    this._eraseAt(p)
    this.requestRender()
  }
  _extendErase(p) {
    const ss = this.session
    // test along the swept segment so fast swipes don't tunnel through shapes
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - ss.last.x, p.y - ss.last.y) / (6 / this.camera.z)))
    for (let i = 1; i <= steps; i++) {
      this._eraseAt({ x: ss.last.x + ((p.x - ss.last.x) * i) / steps, y: ss.last.y + ((p.y - ss.last.y) * i) / steps })
    }
    ss.trail.push(p.x, p.y)
    if (ss.trail.length > 40) ss.trail.splice(0, ss.trail.length - 40)
    ss.last = p
    this.requestRender()
  }
  _eraseAt(p) {
    const hit = this.hitTest(p.x, p.y)
    if (hit) this.session.hits.add(hit.id)
  }
  _endErase() {
    const hits = [...this.session.hits]
    this.session = null
    if (hits.length) this.store.remove(hits) // one transaction — one undo
    this.requestRender()
  }

  // ---- laser ---------------------------------------------------------------
  _beginLaser(p) {
    const stroke = { id: newId('scrib'), points: [{ x: p.x, y: p.y }], opacity: 1, done: false, at: performance.now() }
    this.scribbles.push(stroke)
    this.session = { type: 'lasering', stroke }
    this._laserTick()
    this.emit('scribbles')
  }
  _extendLaser(p) {
    const st = this.session.stroke
    st.points.push({ x: p.x, y: p.y })
    if (st.points.length > 220) st.points.splice(0, st.points.length - 220)
    st.at = performance.now()
    this.emit('scribbles')
    this.requestRender()
  }
  _endLaser() {
    this.session.stroke.done = true
    this.session.stroke.at = performance.now()
    this.session = null
    this.emit('scribbles')
  }
  _laserTick() {
    if (this._laserRaf) return
    const tick = () => {
      this._laserRaf = 0
      const now = performance.now()
      let dirty = false
      this.scribbles = this.scribbles.filter((st) => {
        if (!st.done) return true
        const age = now - st.at
        const o = 1 - Math.max(0, age - 250) / 850
        if (o !== st.opacity) { st.opacity = Math.max(0, o); dirty = true }
        return o > 0
      })
      if (dirty) { this.emit('scribbles'); this.requestRender() }
      if (this.scribbles.length || this.remoteScribbles.length) this._laserRaf = requestAnimationFrame(tick)
    }
    this._laserRaf = requestAnimationFrame(tick)
  }
  // remote laser (a collaborator's) — drawn like ours, kept fresh by the caller
  setRemoteScribbles(list) {
    this.remoteScribbles = list || []
    this.remoteScribblesAt = performance.now()
    this._laserTick()
    this.requestRender()
  }
  getScribbles() {
    return this.scribbles.map((s) => ({ points: s.points, opacity: s.opacity }))
  }

  // ---- line / arrow --------------------------------------------------------
  _beginLineish(type, p, e) {
    const id = newId()
    this.store.beginBatch()
    this.store.put({
      id, typeName: 'shape', type, x: p.x, y: p.y, rot: 0, z: this.store.maxZ() + 1,
      props: {
        dx: 0.01, dy: 0.01, bend: 0,
        color: this.styles.color, size: this.styles.size,
        dash: this.styles.dash === 'draw' ? 'solid' : this.styles.dash,
      },
    })
    this.session = { type: 'lineish', id }
  }
  _dragLineish(p, e) {
    const s = this.store.get(this.session.id)
    if (!s) return
    let dx = p.x - s.x, dy = p.y - s.y
    if (e.shiftKey) {
      const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
      const len = Math.hypot(dx, dy)
      dx = Math.cos(a) * len
      dy = Math.sin(a) * len
    }
    this.store.update(s.id, { props: { dx, dy } })
  }
  _endLineish() {
    const s = this.store.get(this.session.id)
    this.session = null
    if (s && Math.hypot(s.props.dx, s.props.dy) < 2 / this.camera.z) this.store.remove([s.id])
    this.store.endBatch()
    if (s) { this.setTool('select'); this.setSelection([s.id]) }
  }

  // ---- geo -----------------------------------------------------------------
  _beginGeo(p, e) {
    const id = newId()
    this.store.beginBatch()
    this.store.put({
      id, typeName: 'shape', type: 'geo', x: p.x, y: p.y, rot: 0, z: this.store.maxZ() + 1,
      props: {
        geo: this.geoKind, w: 1, h: 1,
        color: this.styles.color, size: this.styles.size,
        dash: this.styles.dash, fill: this.styles.fill, font: this.styles.font,
      },
    })
    this.session = { type: 'geo-create', id, origin: p, dragged: false }
  }
  _dragGeo(p, e) {
    const ss = this.session
    const s = this.store.get(ss.id)
    if (!s) return
    ss.dragged = true
    let w = p.x - ss.origin.x
    let h = p.y - ss.origin.y
    if (e.shiftKey) {
      const m = Math.max(Math.abs(w), Math.abs(h))
      w = Math.sign(w || 1) * m
      h = Math.sign(h || 1) * m
    }
    this.store.update(ss.id, {
      x: Math.min(ss.origin.x, ss.origin.x + w),
      y: Math.min(ss.origin.y, ss.origin.y + h),
      props: { w: Math.max(1, Math.abs(w)), h: Math.max(1, Math.abs(h)) },
    })
  }
  _endGeo() {
    const ss = this.session
    this.session = null
    const s = this.store.get(ss.id)
    if (s && (!ss.dragged || s.props.w < 4 || s.props.h < 4)) {
      // a click drops a ready-made shape
      this.store.update(s.id, { x: s.x - 80, y: s.y - 80, props: { w: 160, h: 160 } })
    }
    this.store.endBatch()
    if (s) { this.setTool('select'); this.setSelection([s.id]) }
  }

  // ---- text / note ---------------------------------------------------------
  _placeText(p) {
    const id = newId()
    this.store.beginBatch()
    this.store.put({
      id, typeName: 'shape', type: 'text', x: p.x, y: p.y - FONT_SIZES[this.styles.size] * 0.66, rot: 0,
      z: this.store.maxZ() + 1,
      props: { text: '', color: this.styles.color, size: this.styles.size, font: this.styles.font, autosize: true, scale: 1 },
    })
    this.setTool('select')
    this.setSelection([id])
    this._startTextEdit(id, 'text', { fresh: true })
  }
  _placeNote(p) {
    const id = newId()
    this.store.beginBatch()
    this.store.put({
      id, typeName: 'shape', type: 'note', x: p.x - NOTE_W / 2, y: p.y - NOTE_W / 2, rot: 0,
      z: this.store.maxZ() + 1,
      props: { text: '', color: this.styles.color === 'black' ? 'yellow' : this.styles.color, size: 'm', font: this.styles.font, scale: 1 },
    })
    this.setTool('select')
    this.setSelection([id])
    this._startTextEdit(id, 'text', { fresh: true })
  }

  // The text surface: a real textarea floated over the canvas, styled to
  // match the render, so editing feels native (IME, selection, caret).
  _startTextEdit(id, field, { fresh = false } = {}) {
    this._commitText()
    const shape = this.store.get(id)
    if (!shape) return
    if (!fresh) this.store.beginBatch()
    const ta = document.createElement('textarea')
    ta.className = 'qd-text-edit'
    ta.value = field === 'label' ? shape.props.label || '' : shape.props.text || ''
    ta.spellcheck = false
    this.container.appendChild(ta)
    this.editing = { id, field, textarea: ta, fresh }
    const sync = () => {
      const patch = field === 'label' ? { label: ta.value } : { text: ta.value }
      this.store.update(id, { props: patch })
      this._layoutTextEditor()
    }
    ta.addEventListener('input', sync)
    ta.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        this._commitText()
        this.container.focus({ preventScroll: true })
      }
    })
    ta.addEventListener('pointerdown', (e) => e.stopPropagation())
    ta.addEventListener('blur', () => this._commitText())
    this._layoutTextEditor()
    ta.focus()
    if (!fresh) ta.select()
    this.emit('edit')
    this.requestRender()
  }
  _layoutTextEditor() {
    const ed = this.editing
    if (!ed) return
    const shape = this.store.get(ed.id)
    if (!shape) return
    const z = this.camera.z
    const ta = ed.textarea
    let lay, pos, w, h, align = 'left'
    if (shape.type === 'note') {
      lay = noteLayout(shape)
      const s = shape.props.scale || 1
      // anchor the textarea where the canvas draws the (vertically centered)
      // text block, so committing doesn't jump the text — 20 = NOTE_PAD
      const yStart = Math.max(20, lay.boxH / 2 - lay.textH / 2)
      pos = this.pageToScreen(shape.x + 20 * s, shape.y + yStart * s)
      w = (NOTE_W - 40) * s
      h = lay.textH * s
      align = 'center'
      ta.style.font = \`500 \${lay.fontSize * s * z}px \${lay.font}\`
      ta.style.lineHeight = lay.lh * s * z + 'px'
    } else if (shape.type === 'geo' && ed.field === 'label') {
      const p = shape.props
      const fs = FONT_SIZES[p.labelSize || 's']
      const fam = FONTS[p.font || 'draw']
      pos = this.pageToScreen(shape.x + 8, shape.y + 8)
      w = p.w - 16
      h = p.h - 16
      align = 'center'
      ta.style.font = \`500 \${fs * z}px \${fam}\`
      ta.style.lineHeight = fs * 1.3 * z + 'px'
      ta.style.paddingTop = Math.max(0, (h * z) / 2 - fs * 1.3 * z) / 2 + 'px'
    } else {
      lay = textLayout(shape)
      pos = this.pageToScreen(shape.x, shape.y)
      w = Math.max(lay.w + 4, 40)
      h = lay.h + 4
      const p = shape.props
      align = p.align === 'middle' ? 'center' : p.align === 'end' ? 'right' : 'left'
      ta.style.font = \`500 \${lay.fontSize * z}px \${lay.font}\`
      ta.style.lineHeight = lay.lh * z + 'px'
    }
    const col = this.theme.colors[shape.props.color || 'black']
    ta.style.left = pos.x + 'px'
    ta.style.top = pos.y + 'px'
    ta.style.width = w * z + 'px'
    ta.style.height = h * z + 'px'
    ta.style.textAlign = align
    ta.style.color = shape.type === 'note' ? this.theme.noteText : col.stroke
  }
  _commitText() {
    const ed = this.editing
    if (!ed) return
    this.editing = null
    const shape = this.store.get(ed.id)
    ed.textarea.remove()
    if (shape) {
      const value = ed.field === 'label' ? shape.props.label : shape.props.text
      if (!String(value || '').trim() && (shape.type === 'text' || (shape.type === 'note' && ed.fresh))) {
        // empty text evaporates
        this.store.remove([ed.id])
        this.selection.delete(ed.id)
      }
    }
    this.store.endBatch()
    this.emit('edit')
    this.requestRender()
  }

  // ---- select tool ---------------------------------------------------------
  _beginSelect(e, s, p) {
    const additive = e.shiftKey
    // handles first — they extend beyond the shapes
    const h = this._hitHandle(s.x, s.y)
    if (h) {
      this.store.beginBatch()
      if (h.kind === 'rotate') {
        const b = this.selectionBounds()
        this.session = {
          type: 'rotating',
          center: { x: b.x + b.w / 2, y: b.y + b.h / 2 },
          start: Math.atan2(p.y - (b.y + b.h / 2), p.x - (b.x + b.w / 2)),
          orig: this._snapshotSelection(),
        }
        this._syncCursor('grabbing')
      } else if (h.kind === 'handle') {
        this.session = { type: 'handle', which: h.which, id: h.id }
      } else {
        this.session = { type: 'resizing', handle: h.which, init: this.selectionBounds(), orig: this._snapshotSelection() }
        this._syncCursor(RESIZE_CURSORS[h.which] || 'default')
      }
      return
    }
    const hit = this.hitTest(p.x, p.y)
    if (hit) {
      const wasSelected = this.selection.has(hit.id)
      if (!wasSelected && !additive) this.setSelection([hit.id])
      else if (additive && !wasSelected) this.setSelection([...this.selection, hit.id])
      // \`added\` marks a shape shift-selected on the way down, so the clean
      // click on the way up keeps it instead of toggling it straight back out
      this.session = { type: 'pressing', hit, additive, added: additive && !wasSelected, start: s, page: p }
    } else {
      this.session = { type: 'marquee', origin: p, rect: null, additive, base: [...this.selection] }
      if (!additive) this.setSelection([])
    }
  }
  _snapshotSelection() {
    const m = new Map()
    for (const id of this.selection) {
      const sh = this.store.get(id)
      if (sh) m.set(id, sh)
    }
    return m
  }
  _beginTranslate(p, e) {
    if (!this.selection.size) return
    this.store.beginBatch()
    if (e.altKey) this.duplicateSelection(0)
    this.session = { type: 'translating', start: p, orig: this._snapshotSelection() }
    this._syncCursor('move')
  }
  _dragTranslate(p, e) {
    const ss = this.session
    let dx = p.x - ss.start.x
    let dy = p.y - ss.start.y
    if (e.shiftKey) Math.abs(dx) > Math.abs(dy) ? (dy = 0) : (dx = 0)
    this.store.transact(() => {
      for (const [id, orig] of ss.orig) {
        if (this.store.has(id)) this.store.update(id, { x: orig.x + dx, y: orig.y + dy })
      }
    })
  }
  _endTranslate() {
    this.store.endBatch()
    this.session = null
    this._syncCursor()
    this.requestRender()
  }
  _dragResize(p, e) {
    const ss = this.session
    const { handle, init } = ss
    const ax = handle.includes('l') ? init.x + init.w : init.x // anchor
    const ay = handle.includes('t') ? init.y + init.h : init.y
    // scales clamp positive — dragging past the anchor pins at tiny, no flips
    let sx = handle.includes('l') || handle.includes('r')
      ? (p.x - ax) / ((handle.includes('l') ? init.x : init.x + init.w) - ax)
      : 1
    let sy = handle.includes('t') || handle.includes('b')
      ? (p.y - ay) / ((handle.includes('t') ? init.y : init.y + init.h) - ay)
      : 1
    sx = isFinite(sx) ? Math.max(0.02, sx) : 1
    sy = isFinite(sy) ? Math.max(0.02, sy) : 1
    const corner = handle.length === 2
    // corners keep proportions when shift asks, or when everything selected
    // is happier uniform (images, notes, text)
    const uniform =
      corner &&
      (e.shiftKey || [...ss.orig.values()].every((sh) => ['image', 'note', 'text'].includes(sh.type)))
    if (uniform) sx = sy = Math.max(sx, sy)
    this.store.transact(() => {
      for (const [id, orig] of ss.orig) {
        if (!this.store.has(id)) continue
        const scaled = scaleShape(orig, sx, sy)
        // shape origin maps through the anchor like any other point
        this.store.put({ ...scaled, x: ax + (orig.x - ax) * sx, y: ay + (orig.y - ay) * sy })
      }
    })
  }
  _dragRotate(p, e) {
    const ss = this.session
    let delta = Math.atan2(p.y - ss.center.y, p.x - ss.center.x) - ss.start
    if (e.shiftKey) delta = Math.round(delta / (Math.PI / 12)) * (Math.PI / 12)
    this.store.transact(() => {
      for (const [id, orig] of ss.orig) {
        if (!this.store.has(id)) continue
        const lb = localBounds(orig)
        const cx = orig.x + lb.x + lb.w / 2
        const cy = orig.y + lb.y + lb.h / 2
        const nc = rotWith(cx, cy, ss.center.x, ss.center.y, delta)
        this.store.update(id, {
          x: orig.x + nc.x - cx,
          y: orig.y + nc.y - cy,
          rot: ((orig.rot || 0) + delta) % (Math.PI * 2),
        })
      }
    })
  }
  // arrow / line endpoint + bend handles
  _dragHandle(p, e) {
    const ss = this.session
    const s = this.store.get(ss.id)
    if (!s) return
    const pr = s.props
    if (ss.which === 'start') {
      const ex = s.x + pr.dx, ey = s.y + pr.dy
      this.store.update(s.id, { x: p.x, y: p.y, props: { dx: ex - p.x, dy: ey - p.y } })
    } else if (ss.which === 'end') {
      let dx = p.x - s.x, dy = p.y - s.y
      if (e.shiftKey) {
        const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
        const len = Math.hypot(dx, dy)
        dx = Math.cos(a) * len
        dy = Math.sin(a) * len
      }
      this.store.update(s.id, { props: { dx, dy } })
    } else if (ss.which === 'bend') {
      // signed distance of the pointer from the straight chord
      const len = Math.hypot(pr.dx, pr.dy) || 1
      const nx = -pr.dy / len, ny = pr.dx / len
      const bend = (p.x - (s.x + pr.dx / 2)) * nx + (p.y - (s.y + pr.dy / 2)) * ny
      this.store.update(s.id, { props: { bend: Math.abs(bend) < 4 / this.camera.z ? 0 : bend } })
    }
  }

  // the pointer tells you what a press would do: resize arrows over handles,
  // move over a selected shape, grab over the rotate knob
  _hoverCursor(e) {
    if (this.tool !== 'select' || this.spaceHeld || this.editing) return
    if (e.target !== this.canvas && e.target !== this.overlay && e.target !== this.container) return
    const s = this._evPoint(e)
    const h = this._hitHandle(s.x, s.y)
    if (h) {
      this._syncCursor(
        h.kind === 'rotate' ? 'grab' : h.kind === 'handle' ? 'pointer' : RESIZE_CURSORS[h.which] || 'default'
      )
      return
    }
    const p = this.screenToPage(s.x, s.y)
    const hit = this.hitTest(p.x, p.y)
    this._syncCursor(hit && this.selection.has(hit.id) ? 'move' : null)
  }

  // which handle sits at screen point? returns { kind, which, id }
  _hitHandle(sx, sy) {
    if (this.tool !== 'select' || !this.selection.size) return null
    const one = this.selection.size === 1 ? this.store.get([...this.selection][0]) : null
    // arrows and lines carry their own handles instead of a resize box
    if (one && (one.type === 'arrow' || one.type === 'line')) {
      const pr = one.props
      const pts = [
        { which: 'start', x: one.x, y: one.y },
        { which: 'end', x: one.x + pr.dx, y: one.y + pr.dy },
      ]
      const bm = bendMidpoint(pr)
      pts.push({ which: 'bend', x: one.x + bm.x, y: one.y + bm.y })
      for (const h of pts) {
        const s = this.pageToScreen(h.x, h.y)
        if (Math.hypot(s.x - sx, s.y - sy) <= HANDLE + 3) return { kind: 'handle', which: h.which, id: one.id }
      }
      return null
    }
    const b = this.selectionBounds()
    if (!b) return null
    const tl = this.pageToScreen(b.x, b.y)
    const br = this.pageToScreen(b.x + b.w, b.y + b.h)
    const rotatable = !one || !['arrow', 'line'].includes(one.type)
    if (rotatable) {
      const rx = (tl.x + br.x) / 2
      const ry = tl.y - 22
      if (Math.hypot(rx - sx, ry - sy) <= HANDLE + 2) return { kind: 'rotate' }
    }
    // resize handles are hidden for a single rotated shape (correct > buggy)
    if (one && one.rot) return null
    const xs = { l: tl.x, m: (tl.x + br.x) / 2, r: br.x }
    const ys = { t: tl.y, m: (tl.y + br.y) / 2, b: br.y }
    for (const which of ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r']) {
      const hx = which.length === 2 ? xs[which[1]] : which === 'l' || which === 'r' ? xs[which] : xs.m
      const hy = which.length === 2 ? ys[which[0]] : which === 't' || which === 'b' ? ys[which] : ys.m
      if (Math.abs(hx - sx) <= HANDLE && Math.abs(hy - sy) <= HANDLE) {
        return { kind: 'resize', which: which.length === 2 ? which : which === 'l' || which === 'r' ? which : which }
      }
    }
    return null
  }

  _dblClick(e) {
    if (this.readonly || this.tool !== 'select') return
    const s = this._evPoint(e)
    const p = this.screenToPage(s.x, s.y)
    const hit = this.hitTest(p.x, p.y)
    if (hit) {
      if (hit.type === 'text' || hit.type === 'note') {
        this.setSelection([hit.id])
        this._startTextEdit(hit.id, 'text')
        return
      }
      if (hit.type === 'geo') {
        this.setSelection([hit.id])
        this._startTextEdit(hit.id, 'label')
        return
      }
      return
    }
    this._placeText(p)
  }

  // ---- keyboard ------------------------------------------------------------
  _keyDown(e) {
    if (this.readonly || this.editing) return
    const meta = e.metaKey || e.ctrlKey
    const k = e.key.toLowerCase()
    if (k === ' ') {
      if (!this.spaceHeld) { this.spaceHeld = true; this._syncCursor() }
      e.preventDefault()
      return
    }
    if (meta && k === 'z') { e.preventDefault(); e.shiftKey ? this.store.redo() : this.store.undo(); return }
    if (meta && k === 'a') { e.preventDefault(); this.selectAll(); return }
    if (meta && k === 'd') { e.preventDefault(); this.duplicateSelection(); return }
    if (meta && k === 'c') { e.preventDefault(); this.copySelection(); return }
    if (meta && k === 'x') { e.preventDefault(); this.copySelection().then(() => this.deleteSelection()); return }
    if (meta && k === 'v') { e.preventDefault(); this.pasteFromClipboard(); return }
    if (meta && (k === '=' || k === '+')) { e.preventDefault(); this._zoomCenter(1.25); return }
    if (meta && k === '-') { e.preventDefault(); this._zoomCenter(1 / 1.25); return }
    if (k === 'escape') {
      if (this.session) this._cancelSession()
      else if (this.selection.size) this.setSelection([])
      else this.setTool('select')
      return
    }
    // wipe the board — two modifiers deep, and undoable like any other edit
    if (meta && e.shiftKey && (k === 'delete' || k === 'backspace')) {
      e.preventDefault()
      this.clearBoard()
      return
    }
    if (k === 'delete' || k === 'backspace') { this.deleteSelection(); return }
    if (k === 'enter' && this.selection.size === 1) {
      const s = this.store.get([...this.selection][0])
      if (s && ['text', 'note'].includes(s.type)) { e.preventDefault(); this._startTextEdit(s.id, 'text') }
      else if (s && s.type === 'geo') { e.preventDefault(); this._startTextEdit(s.id, 'label') }
      return
    }
    if (k.startsWith('arrow')) {
      const d = (e.shiftKey ? 32 : 4) / 1
      const dx = k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0
      const dy = k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0
      if (this.selection.size) {
        e.preventDefault()
        this.store.transact(() => {
          for (const id of this.selection) {
            const s = this.store.get(id)
            if (s) this.store.update(id, { x: s.x + dx, y: s.y + dy })
          }
        })
      }
      return
    }
    if (!meta) {
      if (k === ']') { this.bringToFront(); return }
      if (k === '[') { this.sendToBack(); return }
      const toolKeys = {
        v: 'select', '1': 'select', h: 'hand', d: 'draw', p: 'draw', b: 'draw',
        i: 'highlight', e: 'eraser', k: 'laser', a: 'arrow', l: 'line',
        t: 'text', n: 'note', g: 'geo',
      }
      if (toolKeys[k]) { this.setTool(toolKeys[k]); return }
      const geoKeys = { r: 'rectangle', o: 'ellipse' }
      if (geoKeys[k]) { this.setGeoKind(geoKeys[k]); this.setTool('geo'); return }
      if (e.shiftKey && k === '!') { this.fitContent({ animate: 220 }); return }
    }
    if (e.shiftKey && k === '1') { this.fitContent({ animate: 220 }); return }
    if (e.shiftKey && k === '0') {
      const { w, h } = this.viewSize()
      this.zoomAt(w / 2, h / 2, 1 / this.camera.z, { animate: 180 })
    }
  }
  _keyUp(e) {
    if (e.key === ' ') { this.spaceHeld = false; this._syncCursor() }
  }
  _zoomCenter(mult) {
    const { w, h } = this.viewSize()
    this.zoomAt(w / 2, h / 2, mult, { animate: 140 })
  }

  _wheel(e) {
    if (this.readonly) return
    e.preventDefault()
    const s = this._evPoint(e)
    if (e.ctrlKey || e.metaKey) {
      this.zoomAt(s.x, s.y, Math.exp(-e.deltaY * 0.012))
    } else {
      this.pan(-e.deltaX, -e.deltaY)
    }
  }

  _syncCursor(force) {
    const cur = force
      ? force
      : this.readonly
        ? 'default'
        : this.spaceHeld || this.tool === 'hand'
          ? 'grab'
          : ['draw', 'highlight', 'eraser', 'laser', 'arrow', 'line', 'geo'].includes(this.tool)
            ? 'crosshair'
            : this.tool === 'text'
              ? 'text'
              : 'default'
    this.container.style.cursor = cur
  }

  // ---- clipboard / images --------------------------------------------------
  async copySelection() {
    if (!this.selection.size) return
    const shapes = []
    const assets = {}
    for (const id of this.selection) {
      const s = this.store.get(id)
      if (!s) continue
      shapes.push(s)
      if (s.type === 'image' && s.props.assetId) {
        const a = this.store.asset(s.props.assetId)
        if (a) assets[a.id] = a
      }
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify({ quickdraw: 1, shapes, assets }))
    } catch (e) { console.warn('board copy failed', e) }
  }
  async pasteFromClipboard() {
    // images first, then our own shape payloads
    try {
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read()
        for (const it of items) {
          const t = it.types.find((t2) => t2.startsWith('image/'))
          if (t) {
            const blob = await it.getType(t)
            this.importImageBlobs([blob])
            return
          }
        }
      }
    } catch {}
    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)
      if (data && data.quickdraw && Array.isArray(data.shapes)) this._pasteShapes(data)
    } catch {}
  }
  _pasteShapes(data) {
    let z = this.store.maxZ()
    const ids = []
    this.store.transact(() => {
      const assetMap = {}
      for (const a of Object.values(data.assets || {})) {
        const nid = newId('asset')
        assetMap[a.id] = nid
        this.store.put({ ...a, id: nid })
      }
      for (const s of data.shapes) {
        const nid = newId()
        ids.push(nid)
        this.store.put({
          ...s, id: nid, x: s.x + 16, y: s.y + 16, z: ++z,
          props: s.props.assetId ? { ...s.props, assetId: assetMap[s.props.assetId] || s.props.assetId } : s.props,
        })
      }
    })
    if (this.tool !== 'select') this.setTool('select')
    this.setSelection(ids)
  }
  _paste(e) {
    if (this.readonly || this.editing) return
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'))
    if (files.length) { e.preventDefault(); this.importImageBlobs(files) }
  }
  _drop(e) {
    if (this.readonly) return
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    e.preventDefault()
    e.stopPropagation()
    const s = this._evPoint(e)
    this.importImageBlobs(files, this.screenToPage(s.x, s.y))
  }
  async importImageBlobs(blobs, at) {
    for (const blob of blobs) {
      try {
        const { src, w, h } = await readImage(blob)
        const vp = this.viewportPageBounds()
        // land at a comfortable size: at most ~60% of the view
        const scale = Math.min(1, (vp.w * 0.6) / w, (vp.h * 0.6) / h)
        const pw = Math.max(8, w * scale)
        const ph = Math.max(8, h * scale)
        const cx = at ? at.x : vp.x + vp.w / 2
        const cy = at ? at.y : vp.y + vp.h / 2
        const assetId = newId('asset')
        this.store.transact(() => {
          this.store.put({ id: assetId, typeName: 'asset', src, w, h })
          this.store.put({
            id: newId(), typeName: 'shape', type: 'image',
            x: cx - pw / 2, y: cy - ph / 2, rot: 0, z: this.store.maxZ() + 1,
            props: { w: pw, h: ph, assetId },
          })
        })
        if (at) { at = { x: at.x + 24, y: at.y + 24 } }
      } catch (e2) { console.warn('image import failed', e2) }
    }
  }
  pickImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = () => { if (input.files?.length) this.importImageBlobs([...input.files]) }
    input.click()
  }

  // ---- export --------------------------------------------------------------
  // Renders the drawing into a PNG at crisp resolution — with the paper
  // behind it, or on transparency. Everything by default; pass ids (a Set)
  // to export just those shapes.
  async exportImage({ background = true, scale = 2, margin = 48, ids = null } = {}) {
    let b = null
    const shapes = this.shapesSorted().filter((s) => !ids || ids.has(s.id))
    for (const s of shapes) b = boundsUnion(b, pageBounds(s))
    if (!b) return null
    b = boundsExpand(b, margin)
    // stay under ~24MP however big the drawing is
    const cap = Math.sqrt(24e6 / (b.w * b.h))
    const k = Math.min(scale, cap)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(b.w * k))
    canvas.height = Math.max(1, Math.round(b.h * k))
    const ctx = canvas.getContext('2d')
    if (background) {
      ctx.fillStyle = this.theme.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // the grid travels with the paper: an exported board looks like the board
      this._drawGrid(ctx, { x: -b.x, y: -b.y, z: k }, canvas.width, canvas.height, 1)
    }
    ctx.setTransform(k, 0, 0, k, -b.x * k, -b.y * k)
    // make sure every image asset is decoded before the snap
    await this._decodeAssets(shapes)
    for (const s of shapes) drawShape(ctx, s, { theme: this.theme, store: this.store, zoom: k })
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
  }
  async _decodeAssets(shapes) {
    const waits = []
    for (const s of shapes) {
      if (s.type !== 'image' || !s.props.assetId) continue
      const a = this.store.asset(s.props.assetId)
      if (!a) continue
      waits.push(new Promise((res) => {
        const img = new Image()
        img.onload = res
        img.onerror = res
        img.src = a.src
        if (img.complete) res()
      }))
    }
    await Promise.all(waits)
  }

  // ---- rendering -----------------------------------------------------------
  requestRender() {
    if (this._raf || this._destroyed) return
    this._raf = requestAnimationFrame(() => {
      this._raf = 0
      this.render()
    })
  }
  resize() {
    this.requestRender()
  }

  // content-only pass (paper + shapes), reused by the screen, the capture
  // canvas and image export
  renderScene(ctx, cam, w, h, { dpr = 1, background = true, hideEditing = false } = {}) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (background) {
      ctx.fillStyle = this.theme.background
      ctx.fillRect(0, 0, w * dpr, h * dpr)
    } else {
      ctx.clearRect(0, 0, w * dpr, h * dpr)
    }
    if (background) this._drawGrid(ctx, cam, w * dpr, h * dpr, dpr)
    ctx.setTransform(cam.z * dpr, 0, 0, cam.z * dpr, cam.x * cam.z * dpr, cam.y * cam.z * dpr)
    const vp = { x: -cam.x, y: -cam.y, w: w / cam.z, h: h / cam.z }
    const pad = 64 / cam.z
    const vis = boundsExpand(vp, pad)
    for (const s of this.shapesSorted()) {
      const pb = pageBounds(s)
      if (pb.x + pb.w < vis.x || pb.x > vis.x + vis.w || pb.y + pb.h < vis.y || pb.y > vis.y + vis.h) continue
      drawShape(ctx, s, {
        theme: this.theme, store: this.store, zoom: cam.z,
        ghost: this.session?.type === 'erasing' && this.session.hits.has(s.id),
        // the floating textarea is the visible text while editing — but only on
        // screen; capture/export have no DOM, so they keep the canvas text
        hideText: hideEditing && this.editing?.id === s.id ? this.editing.field : null,
        onAssetLoad: () => this.requestRender(),
      })
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  // The lattice, drawn in device pixels so rules stay hairline-crisp at any
  // zoom. Spacing doubles or halves to stay in a comfortable band, and a new
  // level fades in as you zoom rather than popping into place.
  // W/H are device px; the ctx must be untransformed.
  _drawGrid(ctx, cam, W, H, dpr) {
    if (this.grid === 'none' || !(cam.z > 0)) return
    // point-like marks (dots, crosses) carry less ink, so they use the darker ramp
    const g = this.theme.grid?.[['dots', 'crosses'].includes(this.grid) ? 'dot' : 'line']
    if (!g) return
    let step = GRID_STEP
    while (step * cam.z < 18) step *= 2
    while (step * cam.z > 72) step /= 2
    const fade = clamp((step * cam.z - 16) / 14, 0, 1)
    if (fade <= 0) return
    const z = cam.z * dpr
    // first line/dot of each axis that lands inside the frame
    const n0 = Math.ceil(-cam.x / step)
    const m0 = Math.ceil(-cam.y / step)
    const isMajor = (i) => i % GRID_MAJOR === 0
    const cols = [], rows = []
    for (let n = n0, x = (n0 * step + cam.x) * z; x <= W; n++, x += step * z) cols.push([x, isMajor(n)])
    for (let m = m0, y = (m0 * step + cam.y) * z; y <= H; m++, y += step * z) rows.push([y, isMajor(m)])

    ctx.save()
    if (this.grid === 'lines' || this.grid === 'ruled') {
      for (const major of [false, true]) {
        ctx.beginPath()
        // half-pixel offsets keep a 1px rule on one device pixel, not two
        if (this.grid === 'lines') {
          for (const [x, m] of cols) if (m === major) { const p = Math.round(x) + 0.5; ctx.moveTo(p, 0); ctx.lineTo(p, H) }
        }
        for (const [y, m] of rows) if (m === major) { const p = Math.round(y) + 0.5; ctx.moveTo(0, p); ctx.lineTo(W, p) }
        ctx.strokeStyle = major ? g.major : g.minor
        ctx.globalAlpha = fade
        ctx.lineWidth = 1
        ctx.stroke()
      }
    } else if (this.grid === 'crosses') {
      // a small + at each intersection — the draughtsman's registration marks
      for (const major of [false, true]) {
        const arm = (major ? 4.5 : 3) * dpr
        ctx.beginPath()
        for (const [y, my] of rows) {
          const py = Math.round(y) + 0.5
          for (const [x, mx] of cols) {
            if ((mx && my) !== major) continue
            const px = Math.round(x) + 0.5
            ctx.moveTo(px - arm, py); ctx.lineTo(px + arm, py)
            ctx.moveTo(px, py - arm); ctx.lineTo(px, py + arm)
          }
        }
        ctx.strokeStyle = major ? g.major : g.minor
        ctx.globalAlpha = fade
        ctx.lineWidth = 1
        ctx.stroke()
      }
    } else if (this.grid === 'iso') {
      // isometric weave: the two 30° diagonal families make a diamond lattice
      // that stays self-aligned at every zoom. One quiet weight — major
      // emphasis turns a woven field into noise.
      const s = Math.tan(Math.PI / 6) // 30° from horizontal
      ctx.beginPath()
      for (const sign of [1, -1]) {
        const slope = sign * s
        // page-space intercepts k*step, mapped into device space
        const b0 = -slope * cam.x + cam.y // device intercept of the k=0 line, /z
        const lo = Math.min(0, -slope * (W / z)) // device-x range → intercept range
        const hi = Math.max(H / z, H / z - slope * (W / z))
        const k0 = Math.ceil((lo - b0) / step)
        const k1 = Math.floor((hi - b0) / step)
        for (let k = k0; k <= k1; k++) {
          const b = (b0 + k * step) * z
          ctx.moveTo(0, b)
          ctx.lineTo(W, b + slope * W)
        }
      }
      ctx.strokeStyle = g.minor
      ctx.globalAlpha = fade
      ctx.lineWidth = 1
      ctx.stroke()
    } else {
      // one weight, one ink — emphasized dots read as stray marks on the paper
      const r = 1.6 * dpr
      ctx.beginPath()
      for (const [y] of rows) {
        for (const [x] of cols) {
          ctx.moveTo(x + r, y)
          ctx.arc(x, y, r, 0, Math.PI * 2)
        }
      }
      ctx.fillStyle = g.minor
      ctx.globalAlpha = fade
      ctx.fill()
    }
    ctx.restore()
  }

  render() {
    if (this._destroyed) return
    if (this._pendingFit) {
      const { w: pw, h: ph } = this.viewSize()
      if (pw > 1 && ph > 1) {
        const fit = this._pendingFit
        this._pendingFit = null
        fit()
      }
    }
    const { w, h } = this.viewSize()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    for (const c of [this.canvas, this.overlay]) {
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
      }
    }
    const ctx = this.canvas.getContext('2d')
    this.renderScene(ctx, this.camera, w, h, { dpr, hideEditing: true })
    this._renderOverlay(w, h, dpr)
    this._renderCapture()
    if (this.editing) this._layoutTextEditor()
  }

  _renderOverlay(w, h, dpr) {
    const ctx = this.overlay.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height)
    ctx.scale(dpr, dpr)
    const cam = this.camera
    const t = this.theme

    // selection
    if (this.tool === 'select' && this.selection.size && !this.editing) {
      const one = this.selection.size === 1 ? this.store.get([...this.selection][0]) : null
      ctx.strokeStyle = t.selection
      ctx.fillStyle = t.handleFill
      ctx.lineWidth = 1.5
      if (one && (one.type === 'arrow' || one.type === 'line')) {
        const pr = one.props
        const hs = [
          this.pageToScreen(one.x, one.y),
          this.pageToScreen(one.x + pr.dx, one.y + pr.dy),
        ]
        const bm = bendMidpoint(pr)
        hs.push(this.pageToScreen(one.x + bm.x, one.y + bm.y))
        for (const p2 of hs) {
          ctx.beginPath()
          ctx.arc(p2.x, p2.y, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      } else {
        // rotated single shape draws its true (rotated) frame
        if (one && one.rot) {
          const lb = localBounds(one)
          const cx = one.x + lb.x + lb.w / 2
          const cy = one.y + lb.y + lb.h / 2
          ctx.beginPath()
          const corners = [
            [one.x + lb.x, one.y + lb.y], [one.x + lb.x + lb.w, one.y + lb.y],
            [one.x + lb.x + lb.w, one.y + lb.y + lb.h], [one.x + lb.x, one.y + lb.y + lb.h],
          ].map(([px, py]) => {
            const r = rotWith(px, py, cx, cy, one.rot)
            return this.pageToScreen(r.x, r.y)
          })
          ctx.moveTo(corners[0].x, corners[0].y)
          for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y)
          ctx.closePath()
          ctx.stroke()
        }
        const b = this.selectionBounds()
        if (b) {
          const tl = this.pageToScreen(b.x, b.y)
          const br = this.pageToScreen(b.x + b.w, b.y + b.h)
          if (!(one && one.rot)) ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y)
          // rotate handle
          const rx = (tl.x + br.x) / 2
          const ry = tl.y - 22
          ctx.beginPath()
          ctx.moveTo(rx, tl.y)
          ctx.lineTo(rx, ry + 5)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(rx, ry, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          if (!(one && one.rot)) {
            for (const [hx, hy] of [
              [tl.x, tl.y], [br.x, tl.y], [tl.x, br.y], [br.x, br.y],
              [(tl.x + br.x) / 2, tl.y], [(tl.x + br.x) / 2, br.y],
              [tl.x, (tl.y + br.y) / 2], [br.x, (tl.y + br.y) / 2],
            ]) {
              ctx.beginPath()
              ctx.rect(hx - 4.5, hy - 4.5, 9, 9)
              ctx.fill()
              ctx.stroke()
            }
          }
        }
      }
    }

    // marquee
    if (this.session?.type === 'marquee' && this.session.rect) {
      const r = this.session.rect
      const tl = this.pageToScreen(r.x, r.y)
      ctx.fillStyle = t.selectionFill
      ctx.strokeStyle = t.selection
      ctx.lineWidth = 1
      ctx.fillRect(tl.x, tl.y, r.w * cam.z, r.h * cam.z)
      ctx.strokeRect(tl.x, tl.y, r.w * cam.z, r.h * cam.z)
    }

    // eraser trail
    if (this.session?.type === 'erasing' && this.session.trail.length > 2) {
      ctx.strokeStyle = t.id === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const tr = this.session.trail
      for (let i = 0; i < tr.length; i += 2) {
        const sp = this.pageToScreen(tr[i], tr[i + 1])
        i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y)
      }
      ctx.stroke()
    }

    // laser scribbles — local and remote, same glow
    const remoteAlive = this.remoteScribbles.length && performance.now() - this.remoteScribblesAt < 2500
    const all = [...this.scribbles, ...(remoteAlive ? this.remoteScribbles : [])]
    for (const sc of all) {
      const pts = sc.points || []
      if (pts.length < 2) continue
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const sp = this.pageToScreen(pts[i].x, pts[i].y)
        i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y)
      }
      ctx.strokeStyle = t.scribble
      ctx.lineWidth = 3.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowColor = t.scribble
      ctx.shadowBlur = 9
      ctx.globalAlpha = sc.opacity ?? 1
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }
  }

  // clean pixels for recordings: the current view, contain-fitted into the
  // capture canvas (bands are paper — the compositor's cover crop trims them)
  setCaptureCanvas(canvas) {
    this.captureCanvas = canvas
    if (canvas) this.requestRender()
  }
  // heartbeat repaint for captureStream consumers — repaints ONLY the capture
  // canvas so idle recordings keep receiving frames
  renderCaptureTick() {
    this._renderCapture()
  }
  _renderCapture() {
    const c = this.captureCanvas
    if (!c) return
    // nobody is recording/streaming this board — skip the extra pass
    if (this.captureGate && !this.captureGate()) return
    const { w, h } = this.viewSize()
    if (!w || !h) return
    const cam = this.camera
    const vp = { x: -cam.x, y: -cam.y, w: w / cam.z, h: h / cam.z }
    const z2 = Math.min(c.width / vp.w, c.height / vp.h)
    const cam2 = {
      z: z2,
      x: c.width / 2 / z2 - (vp.x + vp.w / 2),
      y: c.height / 2 / z2 - (vp.y + vp.h / 2),
    }
    const ctx = c.getContext('2d', { alpha: false, desynchronized: true })
    this.renderScene(ctx, cam2, c.width, c.height, { dpr: 1 })
    // remote laser reaches recordings too
    const remoteAlive = this.remoteScribbles.length && performance.now() - this.remoteScribblesAt < 2500
    if (remoteAlive || this.scribbles.length) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      for (const sc of [...this.scribbles, ...(remoteAlive ? this.remoteScribbles : [])]) {
        const pts = sc.points || []
        if (pts.length < 2) continue
        ctx.beginPath()
        for (let i = 0; i < pts.length; i++) {
          const x = (pts[i].x + cam2.x) * cam2.z
          const y = (pts[i].y + cam2.y) * cam2.z
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = this.theme.scribble
        ctx.lineWidth = 3.5 * (z2 / cam.z)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = this.theme.scribble
        ctx.shadowBlur = 9
        ctx.globalAlpha = sc.opacity ?? 1
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      }
    }
  }

  destroy() {
    this._destroyed = true
    this._commitText()
    cancelAnimationFrame(this._raf)
    cancelAnimationFrame(this._camAnim)
    cancelAnimationFrame(this._fitEaseRaf || 0)
    cancelAnimationFrame(this._laserRaf || 0)
    this._unsubStore()
    this._unsubHistory()
    this._ro.disconnect()
    const c = this.container
    c.removeEventListener('pointerdown', this._onDown)
    c.removeEventListener('pointermove', this._onMove)
    c.removeEventListener('pointerup', this._onUp)
    c.removeEventListener('pointercancel', this._onUp)
    c.removeEventListener('wheel', this._onWheel)
    c.removeEventListener('keydown', this._onKeyDown)
    c.removeEventListener('keyup', this._onKeyUp)
    c.removeEventListener('dblclick', this._onDblClick)
    c.removeEventListener('drop', this._onDrop)
    c.removeEventListener('dragover', this._onDragOver)
    c.removeEventListener('paste', this._onPaste)
    c.removeEventListener('blur', this._onBlur)
    this.canvas.remove()
    this.overlay.remove()
    c.classList.remove('qd-root')
  }
}

// decode + gently downscale an imported image, return a dataURL asset
async function readImage(blob) {
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
      img.src = url
    })
    let { width: w, height: h } = img
    const MAX = 2048
    const k = Math.min(1, MAX / Math.max(w, h))
    if (k < 1 || blob.type === 'image/heic') {
      const c = document.createElement('canvas')
      c.width = Math.round(w * k)
      c.height = Math.round(h * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      const isPhoto = blob.type === 'image/jpeg' || blob.size > 600_000
      return { src: c.toDataURL(isPhoto ? 'image/jpeg' : 'image/png', 0.85), w: c.width, h: c.height }
    }
    const src = await new Promise((res) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result)
      fr.readAsDataURL(blob)
    })
    return { src, w, h }
  } finally {
    URL.revokeObjectURL(url)
  }
}
`,
  "store.js": `// The Quickdraw document: a flat map of records (shapes and image assets)
// that emits diffs — { added, removed, updated: {id: [from, to]} } — after
// every transaction. The diff IS the wire format: sync relays, op logs and
// undo history all speak it. Records are treated as immutable; an update
// replaces the object, so [from, to] pairs stay true.
// Dependency-free ESM: runs in any modern browser as-is, no build step.

let seq = 0
export const newId = (p = 'shape') =>
  p + ':' + Date.now().toString(36) + (seq++ % 1296).toString(36).padStart(2, '0') + Math.random().toString(36).slice(2, 6)

const emptyDiff = () => ({ added: {}, removed: {}, updated: {} })

export const isDiffEmpty = (d) =>
  !d ||
  (Object.keys(d.added).length === 0 && Object.keys(d.removed).length === 0 && Object.keys(d.updated).length === 0)

export const invertDiff = (d) => ({
  added: { ...d.removed },
  removed: { ...d.added },
  updated: Object.fromEntries(Object.entries(d.updated).map(([id, [from, to]]) => [id, [to, from]])),
})

// squash b onto a (both applied in order) into one equivalent diff
export const composeDiff = (a, b) => {
  const out = { added: { ...a.added }, removed: { ...a.removed }, updated: { ...a.updated } }
  for (const [id, rec] of Object.entries(b.added)) {
    if (out.removed[id]) {
      // removed then re-added: net update (or nothing if identical)
      const before = out.removed[id]
      delete out.removed[id]
      out.updated[id] = [before, rec]
    } else out.added[id] = rec
  }
  for (const [id, [from, to]] of Object.entries(b.updated)) {
    if (out.added[id]) out.added[id] = to
    else if (out.updated[id]) out.updated[id] = [out.updated[id][0], to]
    else out.updated[id] = [from, to]
  }
  for (const [id, rec] of Object.entries(b.removed)) {
    if (out.added[id]) delete out.added[id]
    else if (out.updated[id]) {
      out.removed[id] = out.updated[id][0]
      delete out.updated[id]
    } else out.removed[id] = rec
  }
  return out
}

export class Store {
  constructor() {
    this.records = new Map()
    this.listeners = new Set() // { fn, source: 'user' | 'remote' | 'all' }
    this.historyListeners = new Set()
    this.undos = []
    this.redos = []
    this._batch = null // open history batch: composed diff
    this._tx = null // { diff, source } while inside transact
  }

  get(id) { return this.records.get(id) }
  has(id) { return this.records.has(id) }
  ids() { return [...this.records.keys()] }
  all() { return [...this.records.values()] }
  shapes() { return this.all().filter((r) => r.typeName !== 'asset') }
  asset(id) { const r = this.records.get(id); return r && r.typeName === 'asset' ? r : null }
  get size() { return this.records.size }

  // fn: (source) => void, fires with (diff, source) after each transaction.
  // source filter: listen only to local edits ('user'), only applied remote
  // diffs ('remote'), or everything ('all', default).
  listen(fn, { source = 'all' } = {}) {
    const l = { fn, source }
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  _emit(diff, source) {
    for (const l of [...this.listeners]) {
      if (l.source !== 'all' && l.source !== source) continue
      try { l.fn(diff, source) } catch (e) { console.warn('board listener failed', e) }
    }
  }

  // fires whenever canUndo/canRedo may have changed — including at the END of
  // a gesture batch, which emits no document diff of its own. Toolbars listen
  // here, not on document changes, or they go stale.
  listenHistory(fn) {
    this.historyListeners.add(fn)
    return () => this.historyListeners.delete(fn)
  }

  _notifyHistory() {
    for (const fn of [...this.historyListeners]) {
      try { fn() } catch (e) { console.warn('board history listener failed', e) }
    }
  }

  // Every mutation happens inside a transaction; nested calls share the outer
  // one. One diff is emitted per outermost transact.
  transact(fn, source = 'user') {
    if (this._tx) { fn(); return }
    this._tx = { diff: emptyDiff(), source }
    try { fn() } finally {
      const { diff } = this._tx
      this._tx = null
      if (!isDiffEmpty(diff)) {
        if (source === 'user' && !this._applyingHistory) {
          if (this._batch) this._batch = composeDiff(this._batch, diff)
          else {
            this.undos.push(diff)
            if (this.undos.length > 256) this.undos.shift()
          }
          this.redos.length = 0
        }
        this._emit(diff, source)
        if (source === 'user') this._notifyHistory()
      }
    }
  }

  put(rec, source = 'user') {
    this.transact(() => {
      const prev = this.records.get(rec.id)
      this.records.set(rec.id, rec)
      const d = this._tx.diff
      if (prev) {
        if (d.added[rec.id]) d.added[rec.id] = rec
        else if (d.updated[rec.id]) d.updated[rec.id] = [d.updated[rec.id][0], rec]
        else d.updated[rec.id] = [prev, rec]
      } else if (d.removed[rec.id]) {
        const before = d.removed[rec.id]
        delete d.removed[rec.id]
        d.updated[rec.id] = [before, rec]
      } else d.added[rec.id] = rec
    }, source)
  }

  // shallow patch; \`props\` (when given) merges into rec.props
  update(id, patch, source = 'user') {
    const prev = this.records.get(id)
    if (!prev) return
    const next = { ...prev, ...patch, ...(patch.props ? { props: { ...prev.props, ...patch.props } } : {}) }
    this.put(next, source)
  }

  remove(idList, source = 'user') {
    this.transact(() => {
      for (const id of idList) {
        const prev = this.records.get(id)
        if (!prev) continue
        this.records.delete(id)
        const d = this._tx.diff
        if (d.added[id]) delete d.added[id]
        else if (d.updated[id]) { d.removed[id] = d.updated[id][0]; delete d.updated[id] }
        else d.removed[id] = prev
      }
    }, source)
  }

  applyDiff(diff, source = 'remote') {
    this.transact(() => {
      for (const rec of Object.values(diff.added || {})) this.put(rec, source)
      for (const [, [, to]] of Object.entries(diff.updated || {})) this.put(to, source)
      this.remove(Object.keys(diff.removed || {}), source)
    }, source)
  }

  // ---- history: one entry per gesture ---------------------------------------
  // beginBatch/endBatch bracket a gesture (a stroke, a drag, a text edit) so
  // its many transactions undo as one.
  beginBatch() { if (!this._batch) this._batch = emptyDiff() }
  endBatch() {
    const b = this._batch
    this._batch = null
    if (b && !isDiffEmpty(b)) {
      this.undos.push(b)
      if (this.undos.length > 256) this.undos.shift()
      this.redos.length = 0
      this._notifyHistory()
    }
  }

  get canUndo() { return this.undos.length > 0 }
  get canRedo() { return this.redos.length > 0 }

  // Undo applies the inverse as a 'user' diff — peers and the op log see it
  // like any other edit — without re-entering the history stacks.
  // The stacks move BEFORE the apply emits, so listeners reading canUndo /
  // canRedo during the emission (a toolbar refresh) see the settled state.
  undo() {
    this.endBatch()
    const d = this.undos.pop()
    if (!d) return
    this.redos.push(d)
    this._applyingHistory = true
    try { this.applyDiff(invertDiff(d), 'user') } finally { this._applyingHistory = false }
    this._notifyHistory()
  }

  redo() {
    const d = this.redos.pop()
    if (!d) return
    this.undos.push(d)
    this._applyingHistory = true
    try { this.applyDiff(d, 'user') } finally { this._applyingHistory = false }
    this._notifyHistory()
  }

  // ---- snapshots ------------------------------------------------------------
  // Envelope matches what the relay/op-log always carried:
  // { document: { store: { id: record } } }
  getSnapshot() {
    return { document: { store: Object.fromEntries(this.records) } }
  }

  // replace the whole document (remote by default: not undoable, but emitted)
  loadSnapshot(snap, source = 'remote') {
    const recs = snap?.document?.store || {}
    this.transact(() => {
      this.remove(this.ids(), source)
      for (const rec of Object.values(recs)) if (rec && rec.id) this.put(rec, source)
    }, source)
    // this is a document swap, not an edit: history built against the old
    // document is invalid (its diffs reference records that no longer exist),
    // and stale canUndo/canRedo would leave toolbars lit on a fresh board
    this.undos.length = 0
    this.redos.length = 0
    this._batch = null
    this._notifyHistory()
  }

  clear(source = 'user') {
    this.remove(this.ids(), source)
  }

  maxZ() {
    let z = 0
    for (const r of this.records.values()) if (r.z > z) z = r.z
    return z
  }
  minZ() {
    let z = 0
    for (const r of this.records.values()) if (r.z < z) z = r.z
    return z
  }
}
`,
  "ui.js": `// The board's chrome: a floating dock of tools, a styles popover, and the
// board menu — plain DOM, one implementation for every host framework.
// The dock is responsive: tools overflow into a "more" flyout as the frame
// narrows, and a very small frame folds the whole kit into one button.
// Icons follow the Lucide geometry (24px grid, 2px stroke) so they read as
// the standard set users already know.
// Dependency-free ESM (see palette.js).

import { COLOR_IDS, SIZE_IDS, DASH_IDS, FILL_IDS, GEO_IDS, GRID_IDS, THEMES } from './palette.js'

const SVG = (inner) =>
  \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\${inner}</svg>\`

const ICONS = {
  select: SVG('<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/>'),
  hand: SVG('<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'),
  draw: SVG('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>'),
  highlight: SVG('<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l8 8Z"/>'),
  eraser: SVG('<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>'),
  // a pointer wand with sparks at the tip — the sun-burst read as brightness
  laser: SVG('<path d="m3 21 9-9"/><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h-2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="M12.2 6.2 11 5"/>'),
  line: SVG('<path d="M19 5 5 19"/>'),
  arrow: SVG('<path d="M7 7h10v10"/><path d="M7 17 17 7"/>'),
  text: SVG('<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>'),
  note: SVG('<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>'),
  image: SVG('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
  undo: SVG('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>'),
  redo: SVG('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/>'),
  menu: SVG('<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>'),
  // double chevron up (the flyout opens above the dock) — dots would read as
  // a second dot-menu next to the board menu's vertical dots
  more: SVG('<path d="m7 12.5 5-5 5 5"/><path d="m7 18.5 5-5 5 5"/>'),
  // geo kinds
  rectangle: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/>'),
  ellipse: SVG('<circle cx="12" cy="12" r="9"/>'),
  triangle: SVG('<path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>'),
  diamond: SVG('<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>'),
  hexagon: SVG('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'),
  star: SVG('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  // menu glyphs
  download: SVG('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
  transparent: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><rect x="4" y="4" width="8" height="8" fill="currentColor" fill-opacity=".22" stroke="none"/><rect x="12" y="12" width="8" height="8" fill="currentColor" fill-opacity=".22" stroke="none"/>'),
  copy: SVG('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>'),
  fit: SVG('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
  trash: SVG('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
  check: SVG('<path d="M20 6 9 17l-5-5"/>'),
  chevronRight: SVG('<path d="m9 18 6-6-6-6"/>'),
  chevronLeft: SVG('<path d="m15 18-6-6 6-6"/>'),
  sun: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
  moon: SVG('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
}
// the action bar wears the same glyphs the menu already uses
ICONS.duplicate = ICONS.copy
ICONS.delete = ICONS.trash

// grid backdrops: bare paper, ruled lines, dotted intersections
const GRID_ICONS = {
  none: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/>'),
  lines: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke-width="1.4"/>'),
  ruled: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 8.5h18M3 13h18M3 17.5h18" stroke-width="1.4"/>'),
  dots: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" stroke-width="2.2"/>'),
  crosses: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 6.5v3M6.5 8h3M16 6.5v3M14.5 8h3M12 10.5v3M10.5 12h3M8 14.5v3M6.5 16h3M16 14.5v3M14.5 16h3" stroke-width="1.3"/>'),
  iso: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m3 7 10.4 14M8.6 3 19 17M21 7 10.6 21M15.4 3 5 17" stroke-width="1.2"/>'),
}
const GRID_TIPS = {
  none: 'No grid', lines: 'Grid lines', ruled: 'Ruled paper',
  dots: 'Grid dots', crosses: 'Crosses', iso: 'Isometric',
}
const GRID_LABELS = { none: 'None', lines: 'Lines', ruled: 'Ruled', dots: 'Dots', crosses: 'Crosses', iso: 'Isometric' }

const DASH_ICONS = {
  draw: SVG('<path d="M4 15c3.2-4.5 6-5.5 8-3.5s5 1.5 8-4.5"/>'),
  solid: SVG('<path d="M4 12h16"/>'),
  dashed: SVG('<path d="M4 12h3.2M10.4 12h3.2M16.8 12h3.2"/>'),
  dotted: SVG('<path d="M4.5 12h.01M9.5 12h.01M14.5 12h.01M19.5 12h.01" stroke-width="3"/>'),
}
const FILL_ICONS = {
  none: SVG('<rect x="5" y="5" width="14" height="14" rx="2"/>'),
  semi: SVG('<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" fill-opacity="0.18"/>'),
  solid: SVG('<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" fill-opacity="0.45" stroke="none"/><rect x="5" y="5" width="14" height="14" rx="2"/>'),
  pattern: SVG('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M6 15 15 6M9 18l9-9" stroke-width="1.3"/>'),
}

const TIPS = {
  select: 'Select — V', hand: 'Hand — H', draw: 'Draw — D', highlight: 'Highlight — I',
  eraser: 'Eraser — E', laser: 'Laser — K', line: 'Line — L', arrow: 'Arrow — A',
  geo: 'Shape — G', text: 'Text — T', note: 'Sticky note — N', image: 'Insert image',
  undo: 'Undo — ⌘Z', redo: 'Redo — ⇧⌘Z', menu: 'Board menu', more: 'More tools',
  tools: 'Tools', duplicate: 'Duplicate — ⌘D', delete: 'Delete — ⌫',
}

// dock buttons in visual order (styles/more/menu ride at the end, always)
const DOCK_NAMES = ['select', 'hand', 'draw', 'highlight', 'eraser', 'laser', 'line', 'arrow', 'geo', 'text', 'note', 'image']
// what gives way first as the frame narrows (select and draw never yield)
const DROP_ORDER = ['hand', 'laser', 'line', 'note', 'image', 'highlight', 'text', 'arrow', 'eraser', 'geo']

export function buildUI(editor, { hidden = false, onSave, themeToggle = true, gridControl = true } = {}) {
  const root = editor.container
  // menu switches the host can drop — an app that owns its own theme chrome
  // doesn't want a second control for it on the canvas
  const opts = { themeToggle: themeToggle !== false, gridControl: gridControl !== false }
  const ui = el('div', 'qd-ui')
  root.appendChild(ui)

  let popover = null // { name, el }
  const closePopover = () => {
    if (popover) { popover.el.remove(); popover = null; refresh() }
  }
  const openPopover = (name, build, anchor) => {
    if (popover?.name === name) return closePopover()
    closePopover()
    const p = el('div', 'qd-popover')
    build(p)
    ui.appendChild(p)
    popover = { name, el: p }
    // keep it inside the frame, roughly above its anchor
    requestAnimationFrame(() => {
      const ar = anchor.getBoundingClientRect()
      const rr = root.getBoundingClientRect()
      const pw = p.offsetWidth
      let left = ar.left - rr.left + ar.width / 2 - pw / 2
      left = Math.max(8, Math.min(left, rr.width - pw - 8))
      p.style.left = left + 'px'
    })
    refresh()
  }

  // ---- actions -------------------------------------------------------------
  const run = (name, b) => {
    if (name === 'image') { closePopover(); return editor.pickImage() }
    if (name === 'geo') return geoTap(b)
    closePopover()
    editor.setTool(name)
  }
  // the shape button: every tap arms the current kind AND shows the kinds,
  // so picking a shape never takes a second hunt for the menu
  const geoTap = (b) => {
    editor.setTool('geo')
    openPopover('geo', (p) => {
      p.classList.add('qd-geo-pop')
      for (const g of GEO_IDS) {
        const gb = el('button', 'qd-tool' + (editor.geoKind === g ? ' on' : ''))
        gb.innerHTML = ICONS[g]
        gb.title = g
        gb.addEventListener('click', (ev) => {
          ev.stopPropagation()
          editor.setGeoKind(g)
          editor.setTool('geo')
          closePopover()
        })
        p.appendChild(gb)
      }
    }, b)
  }

  const makeBtn = (name, onClick, cls = 'qd-tool') => {
    const b = el('button', cls)
    b.dataset.name = name
    b.innerHTML = ICONS[name] || ''
    b.title = TIPS[name] || name
    b.addEventListener('pointerdown', (e) => e.stopPropagation())
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(e, b) })
    return b
  }

  // ---- dock ----------------------------------------------------------------
  const dock = el('div', 'qd-dock')
  ui.appendChild(dock)

  const dockBtns = new Map()
  const dividers = []
  const addBtn = (name) => {
    const b = makeBtn(name, (e, b2) => run(name, b2))
    dock.appendChild(b)
    dockBtns.set(name, b)
    return b
  }
  const divider = () => { const d = el('i', 'qd-div'); dock.appendChild(d); dividers.push(d) }

  addBtn('select'); addBtn('hand')
  divider()
  addBtn('draw'); addBtn('highlight'); addBtn('eraser'); addBtn('laser')
  divider()
  addBtn('line'); addBtn('arrow')
  addBtn('geo').classList.add('qd-geo-btn')
  addBtn('text'); addBtn('note'); addBtn('image')
  divider()

  // folded mode: one button wearing the current tool's icon opens the kit
  const toolsBtn = makeBtn('tools', (e, b) => openPopover('tools', (p) => buildGrid(p, [...DOCK_NAMES]), b))
  dock.appendChild(toolsBtn)

  // styles button: a ring of the current color
  const styleBtn = makeBtn('styles', (e, b) => openPopover('styles', buildStyles, b))
  styleBtn.classList.add('qd-style-btn')
  styleBtn.title = 'Color & style'
  const styleDot = el('span', 'qd-style-dot')
  styleBtn.appendChild(styleDot)
  dock.appendChild(styleBtn)

  const moreBtn = makeBtn('more', (e, b) => openPopover('more', (p) => buildGrid(p, hiddenNames), b))
  dock.appendChild(moreBtn)

  const menuBtn = makeBtn('menu', (e, b) => openPopover('menu', buildMenu, b))
  dock.appendChild(menuBtn)

  // ---- action bar ----------------------------------------------------------
  // history + selection actions ride their own small pill so they stay one
  // tap away no matter how far the tool dock folds
  const actionBar = el('div', 'qd-actions')
  ui.appendChild(actionBar)
  const actBtns = new Map()
  const addAction = (name, fn) => {
    const b = makeBtn(name, fn)
    actionBar.appendChild(b)
    actBtns.set(name, b)
    return b
  }
  addAction('undo', () => editor.store.undo())
  addAction('redo', () => editor.store.redo())
  actionBar.appendChild(el('i', 'qd-div'))
  addAction('duplicate', () => editor.duplicateSelection())
  addAction('delete', () => editor.deleteSelection())

  // ---- overflow grid (compact "more" / folded "tools") ---------------------
  function buildGrid(p, names) {
    p.classList.add('qd-grid-pop')
    for (const name of names) {
      const isTool = name !== 'image'
      const b = makeBtn(name, (e, b2) => run(name, b2))
      if (name === 'geo') b.innerHTML = ICONS[editor.geoKind]
      if (isTool && editor.tool === name) b.classList.add('on')
      p.appendChild(b)
    }
  }

  // ---- styles popover ------------------------------------------------------
  const theme = () => THEMES[editor.theme.id]
  function buildStyles(p) {
    p.classList.add('qd-style-pop')
    const cur = editor.currentStyles()
    const row = (cls) => { const r = el('div', 'qd-row ' + cls); p.appendChild(r); return r }

    const colors = row('qd-colors')
    for (const c of COLOR_IDS) {
      const b = el('button', 'qd-dot' + (cur.color === c ? ' on' : ''))
      b.style.setProperty('--dot', theme().colors[c].stroke)
      b.title = c
      b.addEventListener('click', (e) => { e.stopPropagation(); editor.setStyle('color', c); restyle() })
      colors.appendChild(b)
    }
    const sizes = row('qd-sizes')
    SIZE_IDS.forEach((s, i) => {
      const b = el('button', 'qd-opt' + (cur.size === s ? ' on' : ''))
      b.title = 'Size ' + s.toUpperCase()
      b.innerHTML = \`<span class="qd-size-pip" style="--pip:\${4 + i * 3}px"></span>\`
      b.addEventListener('click', (e) => { e.stopPropagation(); editor.setStyle('size', s); restyle() })
      sizes.appendChild(b)
    })
    const dashes = row('qd-dashes')
    for (const d of DASH_IDS) {
      const b = el('button', 'qd-opt' + (cur.dash === d ? ' on' : ''))
      b.title = d === 'draw' ? 'hand-drawn' : d
      b.innerHTML = DASH_ICONS[d]
      b.addEventListener('click', (e) => { e.stopPropagation(); editor.setStyle('dash', d); restyle() })
      dashes.appendChild(b)
    }
    const fills = row('qd-fills')
    for (const f of FILL_IDS) {
      const b = el('button', 'qd-opt' + (cur.fill === f ? ' on' : ''))
      b.title = 'fill: ' + f
      b.innerHTML = FILL_ICONS[f]
      b.addEventListener('click', (e) => { e.stopPropagation(); editor.setStyle('fill', f); restyle() })
      fills.appendChild(b)
    }
    function restyle() {
      const c2 = editor.currentStyles()
      colors.querySelectorAll('.qd-dot').forEach((b, i) => b.classList.toggle('on', COLOR_IDS[i] === c2.color))
      sizes.querySelectorAll('.qd-opt').forEach((b, i) => b.classList.toggle('on', SIZE_IDS[i] === c2.size))
      dashes.querySelectorAll('.qd-opt').forEach((b, i) => b.classList.toggle('on', DASH_IDS[i] === c2.dash))
      fills.querySelectorAll('.qd-opt').forEach((b, i) => b.classList.toggle('on', FILL_IDS[i] === c2.fill))
      refresh()
    }
  }

  // ---- menu ----------------------------------------------------------------
  function buildMenu(p) {
    p.classList.add('qd-menu-pop')
    const item = (icon, label, key, fn) => {
      const b = el('button', 'qd-menu-item')
      b.innerHTML = \`<span class="qd-mi-ico">\${ICONS[icon] || ''}</span><span class="qd-mi-label"></span>\`
      b.querySelector('.qd-mi-label').textContent = label
      if (key) {
        const k = el('span', 'qd-mi-key')
        k.textContent = key
        b.appendChild(k)
      }
      b.addEventListener('click', async (e) => {
        e.stopPropagation()
        closePopover()
        try { await fn() } catch (err) { console.warn('board menu action failed', err) }
      })
      p.appendChild(b)
      return b
    }
    // a labelled row of mutually exclusive icon buttons
    const segment = (label, ids, { icons, tips, current, onPick }) => {
      const row = el('div', 'qd-menu-row')
      const cap = el('span', 'qd-mi-label')
      cap.textContent = label
      row.appendChild(cap)
      const seg = el('div', 'qd-seg')
      for (const id of ids) {
        const b = el('button', 'qd-seg-btn' + (current === id ? ' on' : ''))
        b.innerHTML = icons[id]
        b.title = tips[id]
        b.setAttribute('aria-label', tips[id])
        b.addEventListener('click', (e) => {
          e.stopPropagation()
          onPick(id)
          seg.querySelectorAll('.qd-seg-btn').forEach((x, i) => x.classList.toggle('on', ids[i] === id))
        })
        seg.appendChild(b)
      }
      row.appendChild(seg)
      p.appendChild(row)
      return row
    }

    const hasSel = editor.selection.size > 0
    item('download', 'Export as PNG', null, () => saveImage(true, null))
    item('transparent', 'Export — transparent', null, () => saveImage(false, null))
    if (hasSel) item('image', 'Export selection', null, () => saveImage(true, new Set(editor.selection)))
    item('copy', hasSel ? 'Copy selection as image' : 'Copy as image', null, async () => {
      const blob = await editor.exportImage({ background: true, ids: hasSel ? new Set(editor.selection) : null })
      if (blob) await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    })
    p.appendChild(el('i', 'qd-menu-div'))
    if (hasSel) item('trash', 'Delete selection', '⌫', () => editor.deleteSelection())
    item('fit', 'Zoom to fit', '⇧1', () => editor.fitContent({ animate: 220 }))
    item('trash', 'Clear board', '⇧⌘⌫', () => editor.clearBoard())

    if (opts.gridControl || opts.themeToggle) p.appendChild(el('i', 'qd-menu-div'))
    if (opts.gridControl) {
      // a standard nested dropdown: the row grows a flyout beside the menu —
      // six buttons inline read as clutter
      // a div, not a button: the flyout nests inside, and buttons can't nest
      const row = el('div', 'qd-menu-item qd-has-sub')
      row.setAttribute('role', 'button')
      row.tabIndex = 0
      row.innerHTML =
        \`<span class="qd-mi-ico">\${GRID_ICONS[editor.grid]}</span>\` +
        '<span class="qd-mi-label">Grid</span>' +
        '<span class="qd-mi-value"></span>' +
        \`<span class="qd-mi-chev">\${ICONS.chevronRight}</span>\`
      row.querySelector('.qd-mi-value').textContent = GRID_LABELS[editor.grid]

      const sub = el('div', 'qd-submenu')
      for (const id of GRID_IDS) {
        const b = el('button', 'qd-menu-item')
        b.innerHTML =
          \`<span class="qd-mi-ico">\${GRID_ICONS[id]}</span>\` +
          '<span class="qd-mi-label"></span>' +
          \`<span class="qd-mi-check">\${editor.grid === id ? ICONS.check : ''}</span>\`
        b.querySelector('.qd-mi-label').textContent = GRID_LABELS[id]
        b.title = GRID_TIPS[id]
        b.addEventListener('click', (e) => {
          e.stopPropagation()
          editor.setGrid(id)
          sub.querySelectorAll('.qd-mi-check').forEach((c, i) => { c.innerHTML = GRID_IDS[i] === id ? ICONS.check : '' })
          row.querySelector('.qd-mi-ico').innerHTML = GRID_ICONS[id]
          row.querySelector('.qd-mi-value').textContent = GRID_LABELS[id]
        })
        sub.appendChild(b)
      }
      row.appendChild(sub)

      const openSub = () => {
        row.classList.add('sub-open')
        // side with room wins: nested menus prefer the right, but the board
        // menu usually hugs the right edge of the frame
        const rr = root.getBoundingClientRect()
        const br = row.getBoundingClientRect()
        const fitsRight = br.right + sub.offsetWidth + 12 <= rr.right
        sub.classList.toggle('qd-sub-left', !fitsRight)
        // grow upward when the row sits low in the frame
        const fitsDown = br.top - 7 + sub.offsetHeight <= rr.bottom - 8
        sub.style.top = fitsDown ? '' : 'auto'
        sub.style.bottom = fitsDown ? '' : '-7px'
      }
      const closeSub = () => row.classList.remove('sub-open')
      let subT
      row.addEventListener('mouseenter', () => { clearTimeout(subT); openSub() })
      row.addEventListener('mouseleave', () => { subT = setTimeout(closeSub, 180) })
      // tap toggles, for pointers that don't hover
      row.addEventListener('click', (e) => {
        e.stopPropagation()
        row.classList.contains('sub-open') ? closeSub() : openSub()
      })
      p.appendChild(row)
    }
    if (opts.themeToggle) {
      segment('Theme', ['light', 'dark'], {
        icons: { light: ICONS.sun, dark: ICONS.moon },
        tips: { light: 'Light theme', dark: 'Dark theme' },
        current: editor.theme.id,
        onPick: (id) => editor.setTheme(id),
      })
    }
  }
  async function saveImage(background, ids) {
    const blob = await editor.exportImage({ background, ids })
    if (!blob) return
    if (onSave) return onSave(blob, background)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'quickdraw-' + new Date().toISOString().slice(0, 19).replaceAll(':', '.') + '.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }

  // ---- responsive fit ------------------------------------------------------
  // Instead of scaling down, the dock sheds tools into the "more" flyout as
  // its frame narrows; below ~5 buttons of room it folds into a single
  // tools button. Fixed metrics keep the math cheap and honest.
  const BTN = 34 // 32px button + 2px gap
  const PAD = 16 // dock padding + border
  let hiddenNames = []
  let mode = null
  const fit = () => {
    const avail = (root.clientWidth || 600) - 16
    const fullW = PAD + (DOCK_NAMES.length + 2) * BTN + dividers.length * 7
    const slots = Math.floor((avail - PAD) / BTN)
    let m, hid
    if (avail >= fullW) {
      m = 'full'
      hid = []
    } else if (slots < 5) {
      m = 'mini'
      hid = [...DOCK_NAMES]
    } else {
      m = 'compact'
      // styles/more/menu take 3 slots; select and draw are pinned; the rest
      // of the room goes to the tools that yield last
      const extra = Math.max(0, slots - 5)
      const keep = new Set(['select', 'draw'])
      for (let i = DROP_ORDER.length - 1, n = extra; i >= 0 && n > 0; i--, n--) keep.add(DROP_ORDER[i])
      hid = DOCK_NAMES.filter((n) => !keep.has(n))
    }
    const changed = m !== mode || hid.join() !== hiddenNames.join()
    mode = m
    hiddenNames = hid
    if (!changed) return
    const hideSet = new Set(hid)
    for (const [n, b] of dockBtns) b.style.display = hideSet.has(n) ? 'none' : ''
    for (const d of dividers) d.style.display = m === 'full' ? '' : 'none'
    toolsBtn.style.display = m === 'mini' ? '' : 'none'
    moreBtn.style.display = m === 'compact' ? '' : 'none'
    dock.classList.toggle('qd-compact', m !== 'full')
    if (popover && ['more', 'tools', 'geo'].includes(popover.name)) closePopover()
    refresh()
  }
  const ro = new ResizeObserver(fit)
  ro.observe(root)
  fit()

  // ---- state sync ----------------------------------------------------------
  function refresh() {
    for (const n of DOCK_NAMES) {
      const b = dockBtns.get(n)
      if (n === 'image') continue
      b.classList.toggle('on', editor.tool === n)
    }
    const geoBtn = dockBtns.get('geo')
    geoBtn.innerHTML = ICONS[editor.geoKind]
    actBtns.get('undo').disabled = !editor.store.canUndo
    actBtns.get('redo').disabled = !editor.store.canRedo
    const hasSel = editor.selection.size > 0
    actBtns.get('duplicate').disabled = !hasSel
    actBtns.get('delete').disabled = !hasSel
    // the folded button wears the active tool so the state stays visible
    toolsBtn.innerHTML = ICONS[editor.tool === 'geo' ? editor.geoKind : editor.tool] || ICONS.select
    toolsBtn.classList.toggle('on', popover?.name === 'tools')
    styleDot.style.background = editor.theme.colors[editor.currentStyles().color || 'black'].stroke
    menuBtn.classList.toggle('on', popover?.name === 'menu')
    styleBtn.classList.toggle('on', popover?.name === 'styles')
    moreBtn.classList.toggle('on', popover?.name === 'more')
  }
  const offs = [
    editor.on('tool', refresh),
    editor.on('styles', refresh),
    editor.on('history', refresh),
    editor.on('selection', refresh),
    editor.on('theme', refresh),
    editor.on('grid', refresh),
  ]

  // popovers close when the pointer goes to the canvas
  const closeOnCanvas = (e) => { if (!ui.contains(e.target)) closePopover() }
  root.addEventListener('pointerdown', closeOnCanvas, { capture: true })

  const setHidden = (h) => ui.classList.toggle('qd-hidden', !!h)
  setHidden(hidden)
  refresh()

  return {
    setHidden,
    // live toggles for the menu switches; an open menu is rebuilt on next open
    setOptions(next = {}) {
      if ('themeToggle' in next) opts.themeToggle = next.themeToggle !== false
      if ('gridControl' in next) opts.gridControl = next.gridControl !== false
      if (popover?.name === 'menu') closePopover()
    },
    destroy() {
      offs.forEach((f) => f())
      ro.disconnect()
      root.removeEventListener('pointerdown', closeOnCanvas, { capture: true })
      ui.remove()
    },
  }
}

const el = (tag, cls) => {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  return e
}
`,
  "palette.js": `// Quickdraw's visual constants — colors, stroke sizes, dash styles, fonts.
// Dependency-free ESM: this file (like the whole engine) can be bundled or
// served raw, so it must run in any modern browser as-is.

// Twelve named colors, a roster whiteboard users already know. Each resolves per
// theme: \`stroke\` draws lines and text, \`fill\` is the pastel body of a filled
// shape, \`semi\` the neutral translucent body, \`note\` the sticky's paper.
export const COLOR_IDS = [
  'black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue',
  'yellow', 'orange', 'green', 'light-green', 'light-red', 'red',
]

const LIGHT = {
  'black':        { stroke: '#1d1d1d', fill: '#e8e8e8', note: '#fdf0a8' },
  'grey':         { stroke: '#9fa8b2', fill: '#eceef0', note: '#eff0f2' },
  'light-violet': { stroke: '#e085f4', fill: '#f9ebfc', note: '#f5d9fb' },
  'violet':       { stroke: '#ae3ec9', fill: '#f0dcf5', note: '#e5b9ef' },
  'blue':         { stroke: '#4263eb', fill: '#dfe5fb', note: '#c0cdf8' },
  'light-blue':   { stroke: '#4dabf7', fill: '#e0f0fe', note: '#c6e5fd' },
  'yellow':       { stroke: '#f1ac4b', fill: '#fcefdc', note: '#fbe5c0' },
  'orange':       { stroke: '#e16919', fill: '#fae5d5', note: '#f8cfae' },
  'green':        { stroke: '#099268', fill: '#d3ebe3', note: '#b5e0d1' },
  'light-green':  { stroke: '#4cb05e', fill: '#dff0e2', note: '#c5e7cc' },
  'light-red':    { stroke: '#f87777', fill: '#fde4e4', note: '#fbcece' },
  'red':          { stroke: '#e03131', fill: '#f9dcdc', note: '#f4b8b8' },
}

// note papers stay bright in the dark theme too — the sticky is a lit object
// on the dark canvas, and noteText ink is dark in both themes
const DARK = {
  'black':        { stroke: '#e1e1e1', fill: '#2c2c2c', note: '#fcf089' },
  'grey':         { stroke: '#93a1ad', fill: '#26292c', note: '#e2e5e8' },
  'light-violet': { stroke: '#e085f4', fill: '#3b2a40', note: '#f2cbfa' },
  'violet':       { stroke: '#bd63d3', fill: '#352138', note: '#e3aeef' },
  'blue':         { stroke: '#6285f5', fill: '#20263e', note: '#b4c4f8' },
  'light-blue':   { stroke: '#4dabf7', fill: '#1c2c3a', note: '#b9defc' },
  'yellow':       { stroke: '#f1ac4b', fill: '#382e1e', note: '#fbdda9' },
  'orange':       { stroke: '#e8833a', fill: '#392619', note: '#f8c69c' },
  'green':        { stroke: '#12a67c', fill: '#172e27', note: '#a6dcc9' },
  'light-green':  { stroke: '#5cbd6e', fill: '#1d3120', note: '#bde4c5' },
  'light-red':    { stroke: '#f87777', fill: '#3b2222', note: '#fac1c1' },
  'red':          { stroke: '#e55959', fill: '#382020', note: '#f3aaaa' },
}

// Everything theme-dependent that isn't a shape color.
export const THEMES = {
  light: {
    id: 'light',
    background: '#fbf9f4', // warm paper
    colors: LIGHT,
    noteText: '#1d1d1d', // sticky ink stays dark on every light note paper
    selection: '#2f80ec',
    selectionFill: 'rgba(47, 128, 236, 0.07)',
    handleFill: '#ffffff',
    scribble: '#f2555a', // the laser pointer
    // The optional grid sits just above the paper: minor marks whisper, the
    // every-fifth majors give the eye something to measure against. Dots carry
    // far less ink than a rule of the same weight, so they run darker to land
    // at the same visual quiet.
    grid: {
      line: { minor: 'rgba(60, 50, 30, 0.13)', major: 'rgba(60, 50, 30, 0.26)' },
      dot: { minor: 'rgba(60, 50, 30, 0.26)', major: 'rgba(60, 50, 30, 0.45)' },
    },
  },
  dark: {
    id: 'dark',
    background: '#191713',
    colors: DARK,
    noteText: '#1d1d1d',
    selection: '#4f96f6',
    selectionFill: 'rgba(79, 150, 246, 0.09)',
    handleFill: '#26231c',
    scribble: '#f2555a',
    grid: {
      line: { minor: 'rgba(255, 246, 224, 0.10)', major: 'rgba(255, 246, 224, 0.20)' },
      dot: { minor: 'rgba(255, 246, 224, 0.20)', major: 'rgba(255, 246, 224, 0.36)' },
    },
  },
}

// Board backdrops. 'none' is bare paper; the rest dress the same lattice:
// full rules, notebook rules only, the intersections as dots or as small
// crosses (blueprint style), and an isometric triangle weave.
export const GRID_IDS = ['none', 'lines', 'ruled', 'dots', 'crosses', 'iso']
// Lattice spacing in page px at zoom 1, and the every-Nth emphasis.
export const GRID_STEP = 40
export const GRID_MAJOR = 5

export const themeOf = (id) => THEMES[id === 'dark' ? 'dark' : 'light']

// Stroke widths in page px at zoom 1. The pencil's freehand outline breathes
// around this; geometry strokes use it flat.
export const SIZES = { s: 2.5, m: 4, l: 6.5, xl: 10 }
// The pencil's pressure ink thins below its nominal size, so S and M read a
// step smaller than the even-width styles; give them a compensating boost.
export const INK_SIZES = { s: 3.4, m: 5.2, l: 6.5, xl: 10 }
export const SIZE_IDS = ['s', 'm', 'l', 'xl']

// Font sizes for text shapes / labels, page px.
export const FONT_SIZES = { s: 20, m: 26, l: 36, xl: 48 }
export const NOTE_FONT_SIZES = { s: 16, m: 20, l: 26, xl: 32 }

export const DASH_IDS = ['draw', 'solid', 'dashed', 'dotted']
export const FILL_IDS = ['none', 'semi', 'solid', 'pattern']

export const FONTS = {
  draw: "'Segoe Print', 'Comic Sans MS', 'Chalkboard SE', cursive",
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  serif: "'Iowan Old Style', 'New York', Palatino, Georgia, serif",
  mono: "'SF Mono', ui-monospace, Menlo, monospace",
}

export const GEO_IDS = ['rectangle', 'ellipse', 'triangle', 'diamond', 'hexagon', 'star']

// Highlighter: wide translucent band that multiplies into the paper.
export const HIGHLIGHT_ALPHA = 0.55
export const HIGHLIGHT_SCALE = 4.5 // band width = SIZES[size] * this
`,
  "shapes.js": `// Shape definitions: bounds, canvas rendering and hit-testing for every
// board shape type. Records are immutable, so per-shape caches (freehand
// outlines, wobbled geo paths, text layout) key off the props object in
// WeakMaps and invalidate themselves by replacement.
// Dependency-free ESM (see palette.js).

import {
  SIZES, INK_SIZES, FONT_SIZES, NOTE_FONT_SIZES, FONTS, HIGHLIGHT_ALPHA, HIGHLIGHT_SCALE,
} from './palette.js'
import {
  ptsBounds, rotWith, distToPolyline, pointInPolygon, pointInEllipse,
  geoPolygon, ellipsePolygon, wobblePolyline, traceSmooth, segIntersectsBounds,
  boundsIntersect, boundsContain,
} from './geometry.js'
import { strokeOutline } from './freehand.js'

export const NOTE_W = 200
const NOTE_PAD = 20
const LABEL_PAD = 12

// semi fill: a near-opaque wash of the paper, so the shape occludes what's
// behind it without committing to a color
const SEMI = { light: 'rgba(249, 247, 241, 0.85)', dark: 'rgba(32, 30, 25, 0.85)' }

// ---- local bounds (origin = shape.x/y, unrotated) --------------------------

export function localBounds(shape) {
  const p = shape.props
  switch (shape.type) {
    case 'draw':
    case 'highlight': {
      const b = ptsBounds(p.pts, 3)
      const m = SIZES[p.size] * (shape.type === 'highlight' ? HIGHLIGHT_SCALE / 2 : 0.75)
      return { x: b.x - m, y: b.y - m, w: b.w + m * 2, h: b.h + m * 2 }
    }
    case 'arrow':
    case 'line': {
      const bend = p.bend || 0
      const x = Math.min(0, p.dx) - Math.abs(bend)
      const y = Math.min(0, p.dy) - Math.abs(bend)
      return { x, y, w: Math.abs(p.dx) + Math.abs(bend) * 2, h: Math.abs(p.dy) + Math.abs(bend) * 2 }
    }
    case 'text': {
      const l = textLayout(shape)
      return { x: 0, y: 0, w: l.w, h: l.h }
    }
    case 'note': {
      const l = noteLayout(shape)
      return { x: 0, y: 0, w: NOTE_W * (p.scale || 1), h: l.boxH * (p.scale || 1) }
    }
    case 'image':
      return { x: 0, y: 0, w: p.w, h: p.h }
    case 'geo':
    default:
      return { x: 0, y: 0, w: p.w || 1, h: p.h || 1 }
  }
}

// axis-aligned page bounds, rotation included
export function pageBounds(shape) {
  const lb = localBounds(shape)
  if (!shape.rot) return { x: shape.x + lb.x, y: shape.y + lb.y, w: lb.w, h: lb.h }
  const cx = shape.x + lb.x + lb.w / 2
  const cy = shape.y + lb.y + lb.h / 2
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [px, py] of [
    [shape.x + lb.x, shape.y + lb.y],
    [shape.x + lb.x + lb.w, shape.y + lb.y],
    [shape.x + lb.x + lb.w, shape.y + lb.y + lb.h],
    [shape.x + lb.x, shape.y + lb.y + lb.h],
  ]) {
    const r = rotWith(px, py, cx, cy, shape.rot)
    if (r.x < minX) minX = r.x
    if (r.x > maxX) maxX = r.x
    if (r.y < minY) minY = r.y
    if (r.y > maxY) maxY = r.y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

// page point -> shape-local point (un-rotate, un-translate)
export function toLocal(shape, px, py) {
  if (shape.rot) {
    const lb = localBounds(shape)
    const cx = shape.x + lb.x + lb.w / 2
    const cy = shape.y + lb.y + lb.h / 2
    const r = rotWith(px, py, cx, cy, -shape.rot)
    return { x: r.x - shape.x, y: r.y - shape.y }
  }
  return { x: px - shape.x, y: py - shape.y }
}

// ---- caches ----------------------------------------------------------------

const outlineCache = new WeakMap() // draw props -> Path2D
const geoPathCache = new WeakMap() // geo props+id key stored on props via WeakMap keyed by props (id captured at build)
const layoutCache = new WeakMap() // text/note/geo-label props -> layout

let measureCtx = null
const measurer = () => {
  if (!measureCtx) measureCtx = (typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(1, 1)
    : document.createElement('canvas')).getContext('2d')
  return measureCtx
}

// The editing textarea positions glyphs by CSS line-box math (half-leading
// around ascent+descent), while canvas 'middle' centers on the em square —
// they disagree by a few px, so committed text would shift. Draw with
// 'alphabetic' at the CSS baseline instead so canvas matches the textarea.
const baselineCache = new Map()
export function lineBaseline(font, fontSize, lh) {
  const key = \`\${fontSize}|\${lh}|\${font}\`
  let b = baselineCache.get(key)
  if (b === undefined) {
    const ctx = measurer()
    ctx.font = \`500 \${fontSize}px \${font}\`
    const m = ctx.measureText('Mg')
    const a = m.fontBoundingBoxAscent ?? fontSize * 0.8
    const d = m.fontBoundingBoxDescent ?? fontSize * 0.2
    b = (lh - (a + d)) / 2 + a
    baselineCache.set(key, b)
  }
  return b
}

// ---- text layout -----------------------------------------------------------

function wrapLines(text, font, fontSize, maxW) {
  const ctx = measurer()
  ctx.font = \`500 \${fontSize}px \${font}\`
  const out = []
  for (const para of String(text ?? '').split('\\n')) {
    if (para === '') { out.push({ text: '', w: 0 }); continue }
    let line = ''
    for (const word of para.split(/(\\s+)/)) {
      const test = line + word
      if (line && maxW && ctx.measureText(test).width > maxW) {
        out.push({ text: line, w: ctx.measureText(line).width })
        line = word.trimStart()
      } else line = test
    }
    out.push({ text: line, w: ctx.measureText(line).width })
  }
  return out
}

export function textLayout(shape) {
  const p = shape.props
  const hit = layoutCache.get(p)
  if (hit) return hit
  const fontSize = FONT_SIZES[p.size] * (p.scale || 1)
  const font = FONTS[p.font || 'draw']
  const lh = fontSize * 1.32
  const maxW = p.autosize === false && p.w ? p.w : 0
  const lines = wrapLines(p.text, font, fontSize, maxW)
  const w = maxW || Math.max(8, ...lines.map((l) => l.w)) + 2
  const l = { lines, fontSize, font, lh, w, h: Math.max(lh, lines.length * lh) }
  layoutCache.set(p, l)
  return l
}

export function noteLayout(shape) {
  const p = shape.props
  const hit = layoutCache.get(p)
  if (hit) return hit
  const fontSize = NOTE_FONT_SIZES[p.size]
  const font = FONTS[p.font || 'draw']
  const lh = fontSize * 1.35
  const lines = wrapLines(p.text, font, fontSize, NOTE_W - NOTE_PAD * 2)
  const textH = lines.length * lh
  const l = { lines, fontSize, font, lh, textH, boxH: Math.max(NOTE_W, textH + NOTE_PAD * 2) }
  layoutCache.set(p, l)
  return l
}

function geoLabelLayout(shape) {
  const p = shape.props
  if (!p.label) return null
  const key = p
  let hit = layoutCache.get(key)
  if (hit) return hit
  const fontSize = FONT_SIZES[p.labelSize || 's']
  const font = FONTS[p.font || 'draw']
  const lh = fontSize * 1.3
  const lines = wrapLines(p.label, font, fontSize, Math.max(24, p.w - LABEL_PAD * 2))
  hit = { lines, fontSize, font, lh, textH: lines.length * lh }
  layoutCache.set(key, hit)
  return hit
}

// ---- image assets ----------------------------------------------------------

const imgCache = new Map() // assetId -> { img, ready }
export function assetImage(store, assetId, onReady) {
  let e = imgCache.get(assetId)
  if (e) return e.ready ? e.img : null
  const asset = store.asset(assetId)
  if (!asset) return null
  const img = new Image()
  e = { img, ready: false }
  imgCache.set(assetId, e)
  img.onload = () => { e.ready = true; onReady && onReady() }
  img.src = asset.src
  return null
}

// ---- rendering -------------------------------------------------------------

const dashFor = (dash, w) =>
  dash === 'dashed' ? [w * 3.2, w * 2.6] : dash === 'dotted' ? [0.01, w * 2.5] : null

function strokeStyled(ctx, dash, w) {
  ctx.lineWidth = w
  ctx.lineJoin = 'round'
  ctx.lineCap = dash === 'dotted' ? 'round' : 'round'
  const d = dashFor(dash, w)
  ctx.setLineDash(d || [])
}

// polygon path (wobbled for 'draw' dash), cached per props object
function geoPath(shape) {
  const p = shape.props
  let path = geoPathCache.get(p)
  if (path) return path
  path = new Path2D()
  if (p.geo === 'ellipse') {
    if (p.dash === 'draw') {
      const pts = wobblePolyline(ellipsePolygon(p.w, p.h, 40), shape.id, { step: 18, amp: Math.min(2, p.w / 40 + 0.6) })
      traceSmooth(path, pts, true)
      path.closePath()
    } else {
      path.ellipse(p.w / 2, p.h / 2, Math.max(0.5, p.w / 2), Math.max(0.5, p.h / 2), 0, 0, Math.PI * 2)
    }
  } else {
    const poly = geoPolygon(p.geo, p.w, p.h)
    if (p.dash === 'draw') {
      const pts = wobblePolyline(poly, shape.id, { step: 22, amp: Math.min(2.2, (p.w + p.h) / 160 + 0.6) })
      const n = pts.length / 2
      path.moveTo(pts[0], pts[1])
      for (let i = 1; i < n; i++) path.lineTo(pts[i * 2], pts[i * 2 + 1])
      path.closePath()
    } else {
      const n = poly.length / 2
      path.moveTo(poly[0], poly[1])
      for (let i = 1; i < n; i++) path.lineTo(poly[i * 2], poly[i * 2 + 1])
      path.closePath()
    }
  }
  geoPathCache.set(p, path)
  return path
}

const patternCache = new Map() // \`\${color}|\${theme}\` -> CanvasPattern
function hatchPattern(ctx, colorHex, themeId) {
  const key = colorHex + '|' + themeId
  let pat = patternCache.get(key)
  if (pat) return pat
  const c = document.createElement('canvas')
  c.width = c.height = 8
  const pctx = c.getContext('2d')
  pctx.strokeStyle = colorHex
  pctx.globalAlpha = 0.55
  pctx.lineWidth = 1.4
  pctx.beginPath()
  // 45° lines, tiled
  pctx.moveTo(-2, 6); pctx.lineTo(6, -2)
  pctx.moveTo(2, 10); pctx.lineTo(10, 2)
  pctx.stroke()
  pat = ctx.createPattern(c, 'repeat')
  patternCache.set(key, pat)
  return pat
}

function fillPath(ctx, path, p, theme) {
  if (!p.fill || p.fill === 'none') return
  if (p.fill === 'semi') ctx.fillStyle = SEMI[theme.id]
  else if (p.fill === 'pattern') ctx.fillStyle = hatchPattern(ctx, theme.colors[p.color].stroke, theme.id)
  else ctx.fillStyle = theme.colors[p.color].fill
  ctx.fill(path)
}

function drawLabel(ctx, layout, color, w, h) {
  if (!layout) return
  ctx.font = \`500 \${layout.fontSize}px \${layout.font}\`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  let y = h / 2 - layout.textH / 2 + lineBaseline(layout.font, layout.fontSize, layout.lh)
  for (const line of layout.lines) {
    ctx.fillText(line.text, w / 2, y)
    y += layout.lh
  }
}

// the freehand outline as a Path2D, cached; live strokes (done !== true)
// rebuild every frame so the ink grows under the pen
function drawPath(shape) {
  const p = shape.props
  if (p.done) {
    const hit = outlineCache.get(p)
    if (hit) return hit
  }
  const path = new Path2D()
  const outline = strokeOutline(p.pts, { size: INK_SIZES[p.size], simulate: !p.isPen })
  traceSmooth(path, outline, true)
  path.closePath()
  if (p.done) outlineCache.set(p, path)
  return path
}

// Draw one shape. ctx is already in PAGE space (camera applied by caller);
// this applies the shape's own translate/rotate.
// opts: { theme, store, zoom, onAssetLoad, ghost }
export function drawShape(ctx, shape, opts) {
  const { theme } = opts
  const p = shape.props
  const col = theme.colors[p.color || 'black']
  ctx.save()
  if (opts.ghost) ctx.globalAlpha = 0.3
  const lb = localBounds(shape)
  if (shape.rot) {
    const cx = shape.x + lb.x + lb.w / 2
    const cy = shape.y + lb.y + lb.h / 2
    ctx.translate(cx, cy)
    ctx.rotate(shape.rot)
    ctx.translate(-cx, -cy)
  }
  ctx.translate(shape.x, shape.y)

  switch (shape.type) {
    case 'draw': {
      // 'draw' dash = pressure ink; solid/dashed/dotted render the same
      // smoothed centerline at an even width so the line style reads true
      if (p.dash && p.dash !== 'draw') {
        ctx.strokeStyle = col.stroke
        strokeStyled(ctx, p.dash, SIZES[p.size])
        ctx.beginPath()
        const flat = []
        for (let i = 0; i < p.pts.length; i += 3) flat.push(p.pts[i], p.pts[i + 1])
        traceSmooth(ctx, flat)
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        ctx.fillStyle = col.stroke
        ctx.fill(drawPath(shape))
      }
      break
    }
    case 'highlight': {
      ctx.globalAlpha = (opts.ghost ? 0.3 : 1) * HIGHLIGHT_ALPHA
      // multiply soaks into light paper; on dark paper it would blacken —
      // lighten glows instead, like a marker on a chalkboard
      ctx.globalCompositeOperation = theme.id === 'dark' ? 'lighten' : 'multiply'
      ctx.strokeStyle = col.stroke
      ctx.lineWidth = SIZES[p.size] * HIGHLIGHT_SCALE
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const flat = []
      for (let i = 0; i < p.pts.length; i += 3) flat.push(p.pts[i], p.pts[i + 1])
      traceSmooth(ctx, flat)
      ctx.stroke()
      break
    }
    case 'geo': {
      const path = geoPath(shape)
      fillPath(ctx, path, p, theme)
      ctx.strokeStyle = col.stroke
      strokeStyled(ctx, p.dash, SIZES[p.size])
      ctx.stroke(path)
      ctx.setLineDash([])
      if (opts.hideText !== 'label') drawLabel(ctx, geoLabelLayout(shape), col.stroke, p.w, p.h)
      break
    }
    case 'arrow':
    case 'line': {
      const w = SIZES[p.size]
      ctx.strokeStyle = col.stroke
      strokeStyled(ctx, p.dash, w)
      const bend = p.bend || 0
      const len = Math.hypot(p.dx, p.dy) || 1
      const nx = -p.dy / len, ny = p.dx / len
      const cx2 = p.dx / 2 + nx * bend * 2 // control point: bend*2 puts the CURVE at bend offset
      const cy2 = p.dy / 2 + ny * bend * 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      if (bend) ctx.quadraticCurveTo(cx2, cy2, p.dx, p.dy)
      else ctx.lineTo(p.dx, p.dy)
      ctx.stroke()
      ctx.setLineDash([])
      if (shape.type === 'arrow') {
        // chevron head aligned with the end tangent
        const tx = p.dx - cx2, ty = p.dy - cy2
        const ta = bend ? Math.atan2(ty, tx) : Math.atan2(p.dy, p.dx)
        const hl = Math.min(Math.max(w * 3.2, 12), len * 0.4)
        ctx.beginPath()
        ctx.moveTo(p.dx - Math.cos(ta - 0.5) * hl, p.dy - Math.sin(ta - 0.5) * hl)
        ctx.lineTo(p.dx, p.dy)
        ctx.lineTo(p.dx - Math.cos(ta + 0.5) * hl, p.dy - Math.sin(ta + 0.5) * hl)
        ctx.lineWidth = w
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      break
    }
    case 'text': {
      const l = textLayout(shape)
      ctx.font = \`500 \${l.fontSize}px \${l.font}\`
      ctx.fillStyle = col.stroke
      ctx.textBaseline = 'alphabetic'
      const align = p.align || 'start'
      ctx.textAlign = align === 'middle' ? 'center' : align === 'end' ? 'right' : 'left'
      const ax = align === 'middle' ? l.w / 2 : align === 'end' ? l.w : 0
      let y = lineBaseline(l.font, l.fontSize, l.lh)
      if (opts.hideText !== 'text') {
        for (const line of l.lines) {
          ctx.fillText(line.text, ax, y)
          y += l.lh
        }
      }
      break
    }
    case 'note': {
      const l = noteLayout(shape)
      const s = p.scale || 1
      ctx.scale(s, s)
      ctx.fillStyle = col.note
      ctx.beginPath()
      ctx.roundRect(0, 0, NOTE_W, l.boxH, 6)
      ctx.shadowColor = 'rgba(20, 16, 8, 0.22)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetY = 4
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      ctx.font = \`500 \${l.fontSize}px \${l.font}\`
      ctx.fillStyle = theme.noteText
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      const bl = lineBaseline(l.font, l.fontSize, l.lh)
      let y = Math.max(NOTE_PAD, l.boxH / 2 - l.textH / 2) + bl
      if (opts.hideText !== 'text') {
        for (const line of l.lines) {
          ctx.fillText(line.text, NOTE_W / 2, y)
          y += l.lh
        }
      }
      break
    }
    case 'image': {
      const img = assetImage(opts.store, p.assetId, opts.onAssetLoad)
      if (img) {
        ctx.beginPath()
        ctx.roundRect(0, 0, p.w, p.h, 4)
        ctx.save()
        ctx.clip()
        ctx.drawImage(img, 0, 0, p.w, p.h)
        ctx.restore()
      } else {
        ctx.fillStyle = SEMI[theme.id]
        ctx.beginPath()
        ctx.roundRect(0, 0, p.w, p.h, 4)
        ctx.fill()
      }
      break
    }
  }
  ctx.restore()
}

// ---- hit testing -----------------------------------------------------------

// point hit in PAGE space; returns true when (px,py) touches the shape
export function hitShape(shape, px, py, tol, store) {
  const b = pageBounds(shape)
  const wide = tol + SIZES[shape.props.size || 'm'] * 2
  if (!boundsContain({ x: b.x - wide, y: b.y - wide, w: b.w + wide * 2, h: b.h + wide * 2 }, px, py)) return false
  const l = toLocal(shape, px, py)
  const p = shape.props
  switch (shape.type) {
    case 'draw':
      return distToPolyline(l.x, l.y, p.pts, 3) <= tol + SIZES[p.size] * 0.9
    case 'highlight':
      return distToPolyline(l.x, l.y, p.pts, 3) <= tol + (SIZES[p.size] * HIGHLIGHT_SCALE) / 2
    case 'geo': {
      const edgeTol = tol + SIZES[p.size]
      if (p.geo === 'ellipse') {
        const inside = pointInEllipse(l.x, l.y, p.w / 2, p.h / 2, p.w / 2, p.h / 2)
        if (p.fill !== 'none' || p.label) return inside || nearEllipseEdge(l, p, edgeTol)
        return nearEllipseEdge(l, p, edgeTol)
      }
      const poly = geoPolygon(p.geo, p.w, p.h)
      if (p.fill !== 'none' || p.label) {
        if (pointInPolygon(l.x, l.y, poly)) return true
      }
      return distToPolyline(l.x, l.y, poly, 2, true) <= edgeTol
    }
    case 'arrow':
    case 'line': {
      const pts = sampleLinePts(p, p.bend || 0)
      return distToPolyline(l.x, l.y, pts, 2) <= tol + SIZES[p.size]
    }
    case 'text':
    case 'note':
    case 'image': {
      const lb = localBounds(shape)
      return l.x >= lb.x - tol && l.x <= lb.x + lb.w + tol && l.y >= lb.y - tol && l.y <= lb.y + lb.h + tol
    }
  }
  return false
}

const nearEllipseEdge = (l, p, tol) => {
  const rx = p.w / 2, ry = p.h / 2
  if (rx <= 0 || ry <= 0) return false
  const outer = pointInEllipse(l.x, l.y, rx, ry, rx + tol, ry + tol)
  const inner = pointInEllipse(l.x, l.y, rx, ry, Math.max(0.5, rx - tol), Math.max(0.5, ry - tol))
  return outer && !inner
}

export const sampleLinePts = (p, bend) => {
  if (!bend) return [0, 0, p.dx, p.dy]
  const len = Math.hypot(p.dx, p.dy) || 1
  const nx = -p.dy / len, ny = p.dx / len
  const cx = p.dx / 2 + nx * bend * 2
  const cy = p.dy / 2 + ny * bend * 2
  const pts = []
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    const mt = 1 - t
    pts.push(mt * mt * 0 + 2 * mt * t * cx + t * t * p.dx, mt * mt * 0 + 2 * mt * t * cy + t * t * p.dy)
  }
  return pts
}

// marquee (page-space rect) selection test
export function marqueeHits(shape, rect) {
  const b = pageBounds(shape)
  if (!boundsIntersect(b, rect)) return false
  // solid-bodied shapes select on bounds overlap
  if (['text', 'note', 'image'].includes(shape.type)) return true
  if (shape.type === 'geo' && shape.props.fill !== 'none') return true
  // stroke shapes want a real graze — cheap test on their (unrotated) points
  if (shape.rot) return true
  const p = shape.props
  const local = { x: rect.x - shape.x, y: rect.y - shape.y, w: rect.w, h: rect.h }
  let pts, stride = 2
  if (shape.type === 'draw' || shape.type === 'highlight') { pts = p.pts; stride = 3 }
  else if (shape.type === 'arrow' || shape.type === 'line') pts = sampleLinePts(p, p.bend || 0)
  else if (shape.type === 'geo') { pts = geoPolygon(p.geo, p.w, p.h); if (pointInPolygon(local.x + local.w / 2, local.y + local.h / 2, pts)) return true }
  if (!pts) return true
  const n = Math.floor(pts.length / stride)
  if (n === 1) return boundsContain(local, pts[0], pts[1])
  for (let i = 0; i < n - 1; i++) {
    if (segIntersectsBounds(pts[i * stride], pts[i * stride + 1], pts[(i + 1) * stride], pts[(i + 1) * stride + 1], local)) return true
  }
  // closed geo outline: also test the closing edge
  if (shape.type === 'geo' && n > 2) {
    if (segIntersectsBounds(pts[(n - 1) * stride], pts[(n - 1) * stride + 1], pts[0], pts[1], local)) return true
  }
  return false
}

// ---- transforms ------------------------------------------------------------

// scale a shape's local geometry about the LOCAL origin; caller repositions
// x/y. Returns a new shape.
export function scaleShape(shape, sx, sy) {
  const p = shape.props
  switch (shape.type) {
    case 'draw':
    case 'highlight': {
      const pts = p.pts.slice()
      for (let i = 0; i < pts.length; i += 3) {
        pts[i] *= sx
        pts[i + 1] *= sy
      }
      return { ...shape, props: { ...p, pts } }
    }
    case 'geo':
      return { ...shape, props: { ...p, w: Math.max(1, p.w * sx), h: Math.max(1, p.h * sy) } }
    case 'arrow':
    case 'line':
      return { ...shape, props: { ...p, dx: p.dx * sx, dy: p.dy * sy, ...(p.bend ? { bend: p.bend * Math.sqrt(Math.abs(sx * sy)) } : {}) } }
    case 'image':
      return { ...shape, props: { ...p, w: Math.max(1, p.w * sx), h: Math.max(1, p.h * sy) } }
    case 'text': {
      // uniform corner scale grows the type itself
      const s = Math.sqrt(Math.abs(sx * sy))
      return { ...shape, props: { ...p, scale: Math.max(0.2, (p.scale || 1) * s), ...(p.autosize === false && p.w ? { w: p.w * sx } : {}) } }
    }
    case 'note': {
      const s = Math.sqrt(Math.abs(sx * sy))
      return { ...shape, props: { ...p, scale: Math.max(0.3, (p.scale || 1) * s) } }
    }
    default:
      return shape
  }
}
`,
  "geometry.js": `// Small geometry kit for the board: bounds, hit-tests, polygon builders and
// the seeded wobble that gives 'draw'-style outlines their hand-drawn set.
// Dependency-free ESM (see palette.js).

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
export const lerp = (a, b, t) => a + (b - a) * t

// ---- bounds {x, y, w, h} ----------------------------------------------------

export const boundsUnion = (a, b) => {
  if (!a) return b
  if (!b) return a
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
}

export const boundsExpand = (b, m) => ({ x: b.x - m, y: b.y - m, w: b.w + m * 2, h: b.h + m * 2 })

export const boundsContain = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h

export const boundsIntersect = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

// bounds of a flat [x,y,x,y,...] point list (draw shapes store [x,y,p,...]
// triplets — pass stride 3)
export const ptsBounds = (pts, stride = 2) => {
  if (!pts || pts.length < 2) return { x: 0, y: 0, w: 0, h: 0 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i < pts.length - 1; i += stride) {
    const x = pts[i], y = pts[i + 1]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

// ---- points -----------------------------------------------------------------

export const rotWith = (px, py, cx, cy, angle) => {
  if (!angle) return { x: px, y: py }
  const s = Math.sin(angle), c = Math.cos(angle)
  const dx = px - cx, dy = py - cy
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c }
}

// squared distance from point to segment ab
export const distToSegSq = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay
  const l2 = dx * dx + dy * dy
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
  t = clamp(t, 0, 1)
  const x = ax + t * dx, y = ay + t * dy
  return (px - x) * (px - x) + (py - y) * (py - y)
}

// nearest distance from a point to a flat polyline (stride for [x,y,p] lists)
export const distToPolyline = (px, py, pts, stride = 2, closed = false) => {
  const n = Math.floor(pts.length / stride)
  if (n === 0) return Infinity
  if (n === 1) return Math.hypot(px - pts[0], py - pts[1])
  let best = Infinity
  for (let i = 0; i < n - 1 + (closed ? 1 : 0); i++) {
    const a = (i % n) * stride, b = ((i + 1) % n) * stride
    const d = distToSegSq(px, py, pts[a], pts[a + 1], pts[b], pts[b + 1])
    if (d < best) best = d
  }
  return Math.sqrt(best)
}

export const pointInPolygon = (px, py, pts, stride = 2) => {
  let inside = false
  const n = Math.floor(pts.length / stride)
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = pts[i * stride], yi = pts[i * stride + 1]
    const xj = pts[j * stride], yj = pts[j * stride + 1]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export const pointInEllipse = (px, py, cx, cy, rx, ry) => {
  if (rx <= 0 || ry <= 0) return false
  const dx = (px - cx) / rx, dy = (py - cy) / ry
  return dx * dx + dy * dy <= 1
}

// does segment a-b intersect axis-aligned rect? (for marquee vs lines)
export const segIntersectsBounds = (ax, ay, bx, by, r) => {
  if (boundsContain(r, ax, ay) || boundsContain(r, bx, by)) return true
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y],
  ]
  for (const [cx, cy, dx, dy] of edges) {
    const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    const d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax)
    const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)
    const d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx)
    if (d1 * d2 < 0 && d3 * d4 < 0) return true
  }
  return false
}

// ---- seeded wobble ----------------------------------------------------------

// mulberry32 seeded from a string — each shape wobbles its own way, and the
// same way on every redraw, every peer, every export
export const seededRand = (str) => {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// resample a closed/open polygon into ~\`step\`-spaced points, each nudged by
// smooth noise — the hand-drawn look for 'draw'-dash geometry
export const wobblePolyline = (pts, seed, { step = 24, amp = 1.6, closed = true } = {}) => {
  const rand = seededRand(seed)
  const out = []
  const n = pts.length / 2
  const segs = closed ? n : n - 1
  // per-vertex noise phase so amplitude varies smoothly along the path
  let ph = rand() * Math.PI * 2
  const freq = 0.35 + rand() * 0.2
  for (let i = 0; i < segs; i++) {
    const ax = pts[(i % n) * 2], ay = pts[(i % n) * 2 + 1]
    const bx = pts[((i + 1) % n) * 2], by = pts[((i + 1) % n) * 2 + 1]
    const len = Math.hypot(bx - ax, by - ay)
    const count = Math.max(1, Math.round(len / step))
    // unit normal of this edge
    const nx = -(by - ay) / (len || 1), ny = (bx - ax) / (len || 1)
    for (let k = 0; k < count; k++) {
      const t = k / count
      // corners stay put so the silhouette reads true
      const w = (k === 0 ? 0.3 : 1) * Math.sin(ph) * amp
      ph += freq
      out.push(ax + (bx - ax) * t + nx * w, ay + (by - ay) * t + ny * w)
    }
  }
  if (!closed) out.push(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1])
  return out
}

// ---- geo polygon builders (local space, box w×h) ---------------------------

export const geoPolygon = (geo, w, h) => {
  switch (geo) {
    case 'triangle':
      return [w / 2, 0, w, h, 0, h]
    case 'diamond':
      return [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2]
    case 'hexagon': {
      const ix = w * 0.25
      return [ix, 0, w - ix, 0, w, h / 2, w - ix, h, ix, h, 0, h / 2]
    }
    case 'star': {
      const cx = w / 2, cy = h / 2
      const pts = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 1 : 0.45
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        pts.push(cx + Math.cos(a) * r * cx, cy + Math.sin(a) * r * cy)
      }
      return pts
    }
    case 'rectangle':
    default:
      return [0, 0, w, 0, w, h, 0, h]
  }
}

// ellipse sampled as a polygon (hit-testing / wobble); rendering uses arcs
export const ellipsePolygon = (w, h, n = 32) => {
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(w / 2 + (Math.cos(a) * w) / 2, h / 2 + (Math.sin(a) * h) / 2)
  }
  return pts
}

// path through flat [x,y,...] points with midpoint quadratics — the smooth
// line everything hand-drawn is traced with
export const traceSmooth = (ctx, pts, closed = false) => {
  const n = pts.length / 2
  if (n < 1) return
  ctx.moveTo(pts[0], pts[1])
  if (n < 3) {
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i * 2], pts[i * 2 + 1])
    return
  }
  for (let i = 1; i < n - 1; i++) {
    const x = pts[i * 2], y = pts[i * 2 + 1]
    const nx = pts[(i + 1) * 2], ny = pts[(i + 1) * 2 + 1]
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2)
  }
  ctx.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1])
  if (closed) ctx.closePath()
}
`,
  "freehand.js": `// The pencil's ink: turns a raw pointer trail into a filled outline whose
// width breathes with pressure (or, for mice, with speed). A compact take on
// the perfect-freehand idea — streamline the input, give every point a
// radius, walk the spine offsetting perpendicular both ways, cap the ends.
// Dependency-free ESM (see palette.js).

// input: flat [x, y, pressure, ...] triplets (pressure 0..1, 0.5 = no reading)
// output: flat [x, y, ...] closed outline polygon
export function strokeOutline(pts, { size = 4, thinning = 0.55, streamline = 0.32, simulate = true, taper = true } = {}) {
  const n = Math.floor(pts.length / 3)
  if (n === 0) return []
  if (n === 1) {
    // a tap leaves a dot
    return dotOutline(pts[0], pts[1], size / 2)
  }

  // 1. streamline: exponential follow smooths jitter without lagging corners
  const sp = new Array(n * 2)
  sp[0] = pts[0]
  sp[1] = pts[1]
  for (let i = 1; i < n; i++) {
    sp[i * 2] = sp[(i - 1) * 2] + (pts[i * 3] - sp[(i - 1) * 2]) * (1 - streamline)
    sp[i * 2 + 1] = sp[(i - 1) * 2 + 1] + (pts[i * 3 + 1] - sp[(i - 1) * 2 + 1]) * (1 - streamline)
  }

  // 2. radius per point from pressure — real when the device reports it,
  // simulated from velocity when it doesn't (fast = thin, like a real pen)
  const radii = new Array(n)
  let vel = 0
  for (let i = 0; i < n; i++) {
    let p = pts[i * 3 + 2]
    const hasReal = p > 0 && p !== 0.5
    if (!hasReal && simulate) {
      const d = i ? Math.hypot(sp[i * 2] - sp[(i - 1) * 2], sp[i * 2 + 1] - sp[(i - 1) * 2 + 1]) : 0
      vel = vel + (Math.min(1, d / (size * 1.8)) - vel) * 0.35
      p = 1 - vel * 0.75
    } else if (!hasReal) {
      p = 0.6
    }
    radii[i] = Math.max(0.35, (size / 2) * (1 - thinning + thinning * p))
  }
  // taper the tips so strokes start and end in a point
  if (taper) {
    const t = Math.min(n, 6)
    for (let i = 0; i < t; i++) {
      const k = (i + 1) / (t + 1)
      radii[i] *= 0.4 + 0.6 * k
      radii[n - 1 - i] *= 0.4 + 0.6 * k
    }
  }

  // 3. offset both ways along the spine
  const left = []
  const right = []
  for (let i = 0; i < n; i++) {
    const x = sp[i * 2], y = sp[i * 2 + 1]
    const px = sp[Math.max(0, i - 1) * 2], py = sp[Math.max(0, i - 1) * 2 + 1]
    const nx2 = sp[Math.min(n - 1, i + 1) * 2], ny2 = sp[Math.min(n - 1, i + 1) * 2 + 1]
    let dx = nx2 - px, dy = ny2 - py
    const len = Math.hypot(dx, dy)
    if (len < 0.001) {
      if (left.length) continue
      dx = 1; dy = 0
    } else {
      dx /= len; dy /= len
    }
    const r = radii[i]
    left.push(x - dy * r, y + dx * r)
    right.push(x + dy * r, y - dx * r)
  }
  if (!left.length) return dotOutline(sp[0], sp[1], radii[0])

  // 4. stitch: left side out, rounded end cap, right side back
  const out = left.slice()
  capInto(out, sp[(n - 1) * 2], sp[(n - 1) * 2 + 1], right[right.length - 2], right[right.length - 1], left[left.length - 2], left[left.length - 1])
  for (let i = right.length - 2; i >= 0; i -= 2) out.push(right[i], right[i + 1])
  capInto(out, sp[0], sp[1], left[0], left[1], right[0], right[1])
  return out
}

// rounded cap: short arc from point a around center c to point b
function capInto(out, cx, cy, ax, ay, bx, by) {
  const a0 = Math.atan2(ay - cy, ax - cx)
  let a1 = Math.atan2(by - cy, bx - cx)
  while (a1 < a0) a1 += Math.PI * 2
  const r = Math.hypot(ax - cx, ay - cy)
  const steps = Math.max(2, Math.ceil((a1 - a0) / 0.5))
  for (let i = 1; i < steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    out.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  out.push(bx, by)
}

function dotOutline(x, y, r) {
  const out = []
  const rr = Math.max(r, 0.75)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    out.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  return out
}
`,
  "quickdraw.css": `/* Quickdraw styles — self-contained, no preprocessor, importable raw.
   The dock is dark glass so it reads on either theme's paper. */

.qd-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: none;
  background: #fbf9f4;
  touch-action: none;
  border-radius: inherit;
  /* lets the watermark dodge the dock on narrow boards (see below) */
  container-type: inline-size;
}
.qd-root[data-qd-theme='dark'] { background: #191713; }

.qd-canvas, .qd-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.qd-overlay { pointer-events: none; }

/* ---- floating chrome ---- */
.qd-ui { position: absolute; inset: 0; pointer-events: none; z-index: 40; }
.qd-ui.qd-hidden { display: none; }
.qd-ui button { -webkit-tap-highlight-color: transparent; }

.qd-dock {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  transform-origin: 50% 100%;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(19, 17, 13, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 16px rgba(10, 8, 4, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  pointer-events: auto;
}

/* history + selection actions: a vertical pill hugging the left edge.
   Hosts with their own chrome there can move it via the custom props. */
.qd-actions {
  position: absolute;
  left: var(--qd-actions-left, 10px);
  top: var(--qd-actions-top, 50%);
  transform: translateY(var(--qd-actions-shift, -50%));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 999px;
  background: rgba(19, 17, 13, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 16px rgba(10, 8, 4, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  pointer-events: auto;
}
.qd-actions button svg { width: 17px; height: 17px; display: block; }
.qd-actions .qd-div { width: 18px; height: 1px; margin: 3px 0; }
.qd-actions button:hover { background: rgba(255, 255, 255, 0.1); }
.qd-actions button:disabled { opacity: 0.32; pointer-events: none; }
.qd-actions .qd-tool { width: 30px; height: 30px; }

.qd-tool, .qd-dock button {
  width: 32px;
  height: 32px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 0;
}
.qd-dock button svg { width: 19px; height: 19px; display: block; }
.qd-dock button:hover { background: rgba(255, 255, 255, 0.1); }
.qd-dock button.on { background: rgba(255, 255, 255, 0.92); color: #211d14; }
.qd-dock button:disabled { opacity: 0.32; pointer-events: none; }
.qd-div { width: 1px; height: 20px; margin: 0 3px; background: rgba(255, 255, 255, 0.16); flex: none; }
.qd-dock.qd-compact { gap: 2px; }

.qd-geo-btn { position: relative; }
.qd-geo-btn::after {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-bottom: 4px solid currentColor;
  opacity: 0.65;
}

.qd-style-btn { position: relative; }
.qd-style-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}
.qd-style-btn.on .qd-style-dot { border-color: #211d14; }

/* ---- popovers ---- */
.qd-popover {
  position: absolute;
  bottom: 54px;
  left: 50%;
  border-radius: 13px;
  background: rgba(19, 17, 13, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 28px rgba(10, 8, 4, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
  padding: 8px;
  max-width: calc(100% - 16px);
  box-sizing: border-box;
  /* rise out of the dock: a short fade + lift + settle */
  transform-origin: 50% 100%;
  animation: qd-pop-in 160ms cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
@keyframes qd-pop-in {
  from { opacity: 0; transform: translateY(7px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .qd-popover { animation: none; }
}

/* every popover tool icon needs the explicit size — an unsized svg falls back
   to its intrinsic 300×150 and overflows the 32px button (invisible on iOS) */
.qd-popover .qd-tool svg { width: 19px; height: 19px; display: block; }

.qd-geo-pop { display: flex; gap: 2px; flex-wrap: wrap; }
.qd-geo-pop .qd-tool { color: rgba(255, 255, 255, 0.85); }

/* overflow tools ("more" flyout / folded kit) */
.qd-grid-pop { display: grid; grid-template-columns: repeat(4, 32px); gap: 2px; }
.qd-grid-pop .qd-tool { color: rgba(255, 255, 255, 0.85); }
.qd-grid-pop .qd-tool.on { background: rgba(255, 255, 255, 0.92); color: #211d14; }

.qd-style-pop { width: 196px; }
.qd-row { display: flex; align-items: center; justify-content: space-between; }
.qd-row + .qd-row { margin-top: 7px; padding-top: 7px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
.qd-colors { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; }
.qd-dot {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.qd-dot::before {
  content: '';
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--dot);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.qd-dot:hover { background: rgba(255, 255, 255, 0.1); }
.qd-dot.on { background: rgba(255, 255, 255, 0.22); }

.qd-opt {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.qd-opt svg { width: 20px; height: 20px; }
.qd-opt:hover { background: rgba(255, 255, 255, 0.1); }
.qd-opt.on { background: rgba(255, 255, 255, 0.92); color: #211d14; }
.qd-size-pip {
  width: var(--pip);
  height: var(--pip);
  border-radius: 50%;
  background: currentColor;
}

.qd-menu-pop { display: flex; flex-direction: column; min-width: 232px; padding: 6px; }
.qd-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  text-align: left;
  font: 500 12.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.qd-menu-item:hover { background: rgba(255, 255, 255, 0.1); }
.qd-mi-ico { display: flex; flex: 0 0 16px; color: rgba(255, 255, 255, 0.62); }
.qd-mi-ico svg { width: 16px; height: 16px; }
.qd-menu-item:hover .qd-mi-ico { color: inherit; }
.qd-mi-label { flex: 1 1 auto; white-space: nowrap; }
.qd-mi-key {
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}
.qd-menu-div { display: block; height: 1px; margin: 5px 4px; background: rgba(255, 255, 255, 0.1); }

/* labelled rows of mutually exclusive icon buttons (grid, theme) */
.qd-menu-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 10px;
  color: rgba(255, 255, 255, 0.88);
  font: 500 12.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.qd-menu-row + .qd-menu-row { margin-top: 2px; }
.qd-seg {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
}
.qd-seg-btn {
  width: 30px;
  height: 26px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 120ms ease, color 120ms ease;
}
.qd-seg-btn svg { width: 16px; height: 16px; }
.qd-seg-btn:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
.qd-seg-btn.on { background: rgba(255, 255, 255, 0.92); color: #211d14; }

/* nested dropdown (grid backdrop): a flyout beside the parent row */
.qd-mi-value { flex: 0 0 auto; color: rgba(255, 255, 255, 0.45); font-size: 11.5px; }
.qd-mi-chev, .qd-mi-check { flex: 0 0 14px; display: flex; color: rgba(255, 255, 255, 0.4); }
.qd-mi-chev svg, .qd-mi-check svg { width: 14px; height: 14px; }
.qd-mi-check { color: rgba(255, 255, 255, 0.85); }
.qd-has-sub { position: relative; }
.qd-has-sub.sub-open { background: rgba(255, 255, 255, 0.1); }
.qd-submenu {
  position: absolute;
  left: calc(100% + 2px);
  top: -7px; /* first sub-row lines up with the parent row */
  display: none;
  flex-direction: column;
  min-width: 148px;
  padding: 6px;
  border-radius: 13px;
  background: rgba(19, 17, 13, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 28px rgba(10, 8, 4, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: qd-sub-in 130ms ease;
}
.qd-has-sub.sub-open .qd-submenu { display: flex; }
.qd-submenu.qd-sub-left { left: auto; right: calc(100% + 2px); }
@keyframes qd-sub-in {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: none; }
}
.qd-submenu.qd-sub-left { animation-name: qd-sub-in-left; }
@keyframes qd-sub-in-left {
  from { opacity: 0; transform: translateX(4px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .qd-submenu { animation: none; }
}

/* ---- watermark ---- */
/* Quiet by default, legible on hover; sits under the chrome so popovers and
   the dock always win. Theme-aware like the rest of the board. */
.qd-watermark {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px 5px 7px;
  border-radius: 999px;
  color: rgba(28, 27, 24, 0.42);
  font: 600 11.5px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: color 140ms ease, background 140ms ease;
}
.qd-watermark svg { width: 14px; height: 14px; display: block; }
.qd-watermark:hover {
  color: rgba(28, 27, 24, 0.85);
  background: rgba(28, 27, 24, 0.06);
}
.qd-root[data-qd-theme='dark'] .qd-watermark { color: rgba(244, 242, 234, 0.38); }
.qd-root[data-qd-theme='dark'] .qd-watermark:hover {
  color: rgba(244, 242, 234, 0.85);
  background: rgba(244, 242, 234, 0.08);
}
/* on narrow boards the centered dock reaches the corners — step above it */
@container (max-width: 560px) {
  .qd-watermark { bottom: 58px; }
}

/* ---- text editing ---- */
.qd-text-edit {
  position: absolute;
  z-index: 30;
  background: transparent;
  border: none;
  outline: 1.5px dashed rgba(110, 140, 200, 0.55);
  outline-offset: 3px;
  border-radius: 2px;
  resize: none;
  overflow: hidden;
  padding: 0;
  margin: 0;
  white-space: pre-wrap;
  caret-color: currentColor;
  -webkit-user-select: text;
  user-select: text;
}
`,
};
