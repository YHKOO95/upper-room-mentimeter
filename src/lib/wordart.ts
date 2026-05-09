// Canvas shape-masked word cloud engine.
// Draws a shape mask on a hidden canvas (white = allowed), then places
// words inside the white area using greedy spiral search + occupancy grid.

import type { ShapeKind, WordEntry } from "./types";

const FONT_DISPLAY = "'Inter Tight','Pretendard',system-ui,sans-serif";

// ─── Shape mask painters ─────────────────────────────────────────────────────
// Each painter draws WHITE on BLACK. White pixels = allowed word area.

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type ShapePainter = (ctx: CanvasRenderingContext2D, W: number, H: number) => void;

const SHAPES: Record<ShapeKind, ShapePainter> = {
  house(ctx, W, H) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    const cx = W / 2, bodyW = W * 0.92, bodyH = H * 0.55, roofH = H * 0.40;
    const left = cx - bodyW / 2, right = cx + bodyW / 2;
    const bottom = H * 0.97, top = bottom - bodyH, peak = top - roofH;
    ctx.beginPath();
    ctx.moveTo(left, bottom); ctx.lineTo(left, top); ctx.lineTo(cx, peak);
    ctx.lineTo(right, top); ctx.lineTo(right, bottom); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#000";
    const winSize = Math.min(W, H) * 0.09;
    ctx.fillRect(cx - winSize / 2, top + bodyH * 0.18, winSize, winSize);
  },
  attic(ctx, W, H) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    const cx = W / 2;
    const groundW = W * 0.88, groundH = H * 0.34;
    const upperW = W * 0.68, upperH = H * 0.30;
    const roofH = H * 0.26, bottom = H * 0.97;
    ctx.fillRect(cx - groundW / 2, bottom - groundH, groundW, groundH);
    const upperBottom = bottom - groundH;
    ctx.fillRect(cx - upperW / 2, upperBottom - upperH, upperW, upperH);
    const roofBottom = upperBottom - upperH;
    ctx.beginPath();
    ctx.moveTo(cx - upperW / 2 - W * 0.05, roofBottom);
    ctx.lineTo(cx, roofBottom - roofH);
    ctx.lineTo(cx + upperW / 2 + W * 0.05, roofBottom);
    ctx.closePath(); ctx.fill();
    const chimW = W * 0.025, chimH = H * 0.10;
    ctx.fillRect(cx + upperW * 0.28, roofBottom - roofH * 0.55 - chimH, chimW, chimH);
    ctx.fillStyle = "#000";
    const winSize = Math.min(W, H) * 0.075;
    ctx.fillRect(cx - winSize / 2, upperBottom - upperH * 0.62, winSize, winSize);
    const doorW = W * 0.05, doorH = H * 0.13;
    ctx.fillRect(cx - doorW / 2, bottom - doorH, doorW, doorH);
  },
  stairs(ctx, W, H) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    const cx = W / 2, bottom = H * 0.97;
    const hW = W * 0.34, hH = H * 0.20, rH = H * 0.16;
    const hLeft = cx - hW / 2, hTop = H * 0.10;
    ctx.fillRect(hLeft, hTop, hW, hH);
    ctx.beginPath();
    ctx.moveTo(hLeft - W * 0.025, hTop);
    ctx.lineTo(cx, hTop - rH);
    ctx.lineTo(hLeft + hW + W * 0.025, hTop);
    ctx.closePath(); ctx.fill();
    const steps = 6, baseW = W * 0.92;
    const stepW = (baseW - hW) / 2 / steps;
    const stepH = (bottom - (hTop + hH)) / steps;
    for (let i = 0; i < steps; i++) {
      const w = hW + (i + 1) * stepW * 2;
      ctx.fillRect(cx - w / 2, hTop + hH + i * stepH, w, stepH + 1);
    }
    ctx.fillStyle = "#000";
    const winSize = Math.min(W, H) * 0.05;
    ctx.fillRect(cx - winSize / 2, hTop + hH * 0.30, winSize, winSize);
  },
  window(ctx, W, H) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    const padX = W * 0.02, padY = H * 0.02;
    const w = W - padX * 2, h = H - padY * 2;
    const r = Math.min(w, h) * 0.04;
    roundRect(ctx, padX, padY, w, h, r); ctx.fill();
    ctx.fillStyle = "#000";
    const inner = Math.min(W, H) * 0.16;
    const ix = (W - inner) / 2, iy = (H - inner) / 2;
    roundRect(ctx, ix, iy, inner, inner, inner * 0.10); ctx.fill();
  },
  circle(ctx, W, H) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    const r = Math.min(W, H) * 0.48;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(W / 2, H / 2, r * 0.18, 0, Math.PI * 2); ctx.fill();
  },
  prayer(ctx, W, H) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    const cx = W / 2;
    const drawPlume = (side: number) => {
      ctx.save();
      ctx.translate(cx, H); ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(W * 0.005, 0);
      ctx.bezierCurveTo(W * 0.10, -H * 0.10, W * 0.50, -H * 0.55, W * 0.52, -H * 0.99);
      ctx.lineTo(W * 0.18, -H * 0.99);
      ctx.bezierCurveTo(W * 0.10, -H * 0.55, W * 0.06, -H * 0.30, W * 0.025, -H * 0.04);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W * 0.025, -H * 0.04);
      ctx.bezierCurveTo(W * 0.14, -H * 0.03, W * 0.36, -H * 0.07, W * 0.52, -H * 0.06);
      ctx.lineTo(W * 0.52, 0); ctx.lineTo(W * 0.005, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    drawPlume(-1); drawPlume(+1);
  },
  poster(ctx, W, H) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    const cx = W / 2;
    const drawPlume = (side: number) => {
      ctx.save();
      ctx.translate(cx, H); ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(W * 0.005, 0);
      ctx.bezierCurveTo(W * 0.10, -H * 0.06, W * 0.50, -H * 0.50, W * 0.52, -H * 1.00);
      ctx.lineTo(W * 0.18, -H * 1.00);
      ctx.bezierCurveTo(W * 0.10, -H * 0.50, W * 0.06, -H * 0.22, W * 0.02, -H * 0.02);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W * 0.02, -H * 0.02);
      ctx.bezierCurveTo(W * 0.14, -H * 0.015, W * 0.36, -H * 0.04, W * 0.52, -H * 0.03);
      ctx.lineTo(W * 0.52, 0); ctx.lineTo(W * 0.005, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    drawPlume(-1); drawPlume(+1);
    // Subtract house silhouette (reserved for the glowing window overlay)
    ctx.fillStyle = "#000";
    const houseW = W * 0.34, houseBodyH = H * 0.30, houseRoofH = H * 0.18;
    const houseBottom = H * 0.82, houseCx = W / 2;
    const left = houseCx - houseW / 2, right = houseCx + houseW / 2;
    const top = houseBottom - houseBodyH, peak = top - houseRoofH;
    ctx.beginPath();
    ctx.moveTo(left, houseBottom); ctx.lineTo(left, top); ctx.lineTo(houseCx, peak);
    ctx.lineTo(right, top); ctx.lineTo(right, houseBottom);
    ctx.closePath(); ctx.fill();
  },
};

// ─── Placed word ─────────────────────────────────────────────────────────────

type PlacedWord = WordEntry & {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
};

// ─── WordArt class ───────────────────────────────────────────────────────────

export class WordArt {
  private el: HTMLElement;
  private shape: ShapeKind;
  private accent: string;
  private layer: HTMLDivElement;
  private mask: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;
  private maskData: ImageData | null = null;
  private lastWords: WordEntry[] = [];
  private placed: PlacedWord[] = [];
  private probe: HTMLSpanElement | null = null;
  private W = 200;
  private H = 200;

  constructor(container: HTMLElement, opts: { shape?: ShapeKind; accent?: string } = {}) {
    this.el = container;
    this.shape = opts.shape ?? "poster";
    this.accent = opts.accent ?? "#f6d58a";
    this.el.classList.add("wordart");

    this.layer = document.createElement("div");
    this.layer.className = "wordart-layer";
    this.el.appendChild(this.layer);

    this.mask = document.createElement("canvas");
    this.maskCtx = this.mask.getContext("2d", { willReadFrequently: true })!;

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
    requestAnimationFrame(() => this.onResize());
  }

  setShape(s: ShapeKind) {
    if (SHAPES[s]) { this.shape = s; this.layout(this.lastWords, true); }
  }

  update(words: WordEntry[]) {
    this.lastWords = words.slice();
    this.layout(words, false);
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    if (this.probe) { this.probe.remove(); this.probe = null; }
    this.el.innerHTML = "";
  }

  private onResize() {
    const r = this.el.getBoundingClientRect();
    this.W = Math.max(200, r.width);
    this.H = Math.max(200, r.height);
    this.mask.width = this.W;
    this.mask.height = this.H;
    const painter = SHAPES[this.shape] ?? SHAPES.house;
    painter(this.maskCtx, this.W, this.H);
    this.maskData = this.maskCtx.getImageData(0, 0, this.W, this.H);
    this.layout(this.lastWords, true);
  }

  private layout(words: WordEntry[], _force: boolean) {
    if (!this.maskData) return;
    const W = this.W, H = this.H;
    const maxCount = Math.max(1, ...words.map(w => w.count));
    const sorted = [...words].sort((a, b) => b.count - a.count);

    const CELL = 4;
    const cw = Math.ceil(W / CELL), ch = Math.ceil(H / CELL);
    const occ = new Uint8Array(cw * ch);

    if (!this.probe) {
      this.probe = document.createElement("span");
      this.probe.style.cssText = `position:absolute;left:-9999px;top:-9999px;visibility:hidden;font-family:${FONT_DISPLAY};font-weight:800;white-space:nowrap`;
      document.body.appendChild(this.probe);
    }
    const probe = this.probe;

    const minSize = Math.max(14, Math.min(W, H) * 0.026);
    const maxSize = Math.max(minSize + 10, Math.min(W, H) * 0.13);
    const placed: PlacedWord[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const w = sorted[i];
      const freqT = w.count / maxCount;
      const rankT = 1 - i / Math.max(1, sorted.length - 1);
      const t = 0.55 * freqT + 0.45 * rankT;
      const size = minSize + t * t * (maxSize - minSize);
      probe.style.fontSize = size + "px";
      probe.textContent = w.text;
      const tw = probe.offsetWidth + 6;
      const th = probe.offsetHeight + 2;

      const pos = this.findSpot(tw, th, occ, cw, ch, CELL, i);
      if (pos) {
        this.stamp(occ, cw, ch, CELL, pos.x, pos.y, tw, th);
        placed.push({ ...w, x: pos.x, y: pos.y, w: tw, h: th, size });
      }
    }
    this.placed = placed;
    this.render();
  }

  private findSpot(tw: number, th: number, occ: Uint8Array, cw: number, ch: number, CELL: number, idx: number) {
    const W = this.W, H = this.H;
    const md = this.maskData!.data;
    const mw = this.mask.width, mh = this.mask.height;
    const sx = W / 2, sy = H / 2;
    const maxR = Math.hypot(W, H) / 2;
    const startR = idx === 0 ? 0 : Math.min(maxR, idx * 3);
    for (let r = startR; r < maxR; r += 3) {
      const stepAng = Math.max(6, 36 - r * 0.06);
      const steps = Math.ceil(360 / stepAng);
      const phase = (idx * 0.7) % (Math.PI * 2);
      for (let k = 0; k < steps; k++) {
        const a = phase + k * (Math.PI * 2 / steps);
        const cx = sx + Math.cos(a) * r;
        const cy = sy + Math.sin(a) * r;
        const x = cx - tw / 2, y = cy - th / 2;
        if (x < 2 || y < 2 || x + tw > W - 2 || y + th > H - 2) continue;
        if (!this.inMask(x + tw / 2, y + th / 2, md, mw, mh)) continue;
        if (!this.inMask(x + 4, y + 4, md, mw, mh)) continue;
        if (!this.inMask(x + tw - 4, y + 4, md, mw, mh)) continue;
        if (!this.inMask(x + 4, y + th - 4, md, mw, mh)) continue;
        if (!this.inMask(x + tw - 4, y + th - 4, md, mw, mh)) continue;
        if (this.free(occ, cw, ch, CELL, x, y, tw, th)) return { x, y };
      }
    }
    return null;
  }

  private inMask(px: number, py: number, md: Uint8ClampedArray, mw: number, mh: number) {
    const W = this.W, H = this.H;
    const ix = Math.max(0, Math.min(mw - 1, Math.floor(px / W * mw)));
    const iy = Math.max(0, Math.min(mh - 1, Math.floor(py / H * mh)));
    return md[(iy * mw + ix) * 4] > 128;
  }

  private free(occ: Uint8Array, cw: number, ch: number, CELL: number, x: number, y: number, w: number, h: number) {
    const x0 = Math.floor(x / CELL), y0 = Math.floor(y / CELL);
    const x1 = Math.ceil((x + w) / CELL), y1 = Math.ceil((y + h) / CELL);
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        if (xx < 0 || yy < 0 || xx >= cw || yy >= ch) return false;
        if (occ[yy * cw + xx]) return false;
      }
    }
    return true;
  }

  private stamp(occ: Uint8Array, cw: number, ch: number, CELL: number, x: number, y: number, w: number, h: number) {
    const PAD = 2;
    const x0 = Math.floor(x / CELL) - PAD, y0 = Math.floor(y / CELL) - PAD;
    const x1 = Math.ceil((x + w) / CELL) + PAD, y1 = Math.ceil((y + h) / CELL) + PAD;
    for (let yy = Math.max(0, y0); yy < Math.min(ch, y1); yy++) {
      for (let xx = Math.max(0, x0); xx < Math.min(cw, x1); xx++) {
        occ[yy * cw + xx] = 1;
      }
    }
  }

  private render() {
    const layer = this.layer;
    const existing = new Map<string, HTMLSpanElement>();
    for (const node of Array.from(layer.children)) {
      existing.set((node as HTMLElement).dataset.id!, node as HTMLSpanElement);
    }
    const seen = new Set<string>();
    const N = this.placed.length;

    this.placed.forEach((p, i) => {
      seen.add(p.id);
      let n = existing.get(p.id);
      if (!n) {
        n = document.createElement("span");
        n.className = "wa-word";
        n.dataset.id = p.id;
        n.textContent = p.text;
        n.style.animationDelay = (Math.random() * 0.4).toFixed(2) + "s";
        layer.appendChild(n);
      } else if (n.textContent !== p.text) {
        n.textContent = p.text;
      }
      const t = 1 - i / Math.max(1, N - 1);
      const isHero = i < 3 && p.count >= 2;
      n.style.left = p.x + "px";
      n.style.top = p.y + "px";
      n.style.fontSize = p.size + "px";
      n.style.color = isHero ? this.accent : `rgba(244,239,230,${(0.55 + 0.45 * t).toFixed(3)})`;
      n.style.textShadow = isHero
        ? `0 0 28px rgba(246,213,138,.45), 0 0 8px rgba(246,213,138,.6)`
        : `0 0 12px rgba(255,255,255,${(0.05 + 0.10 * t).toFixed(3)})`;
      n.style.fontWeight = i < 5 ? "800" : i < 12 ? "700" : "600";
    });

    for (const [id, node] of existing) {
      if (!seen.has(id)) node.remove();
    }
  }
}
