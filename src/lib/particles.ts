// Canvas particle engine — white dust/stars drifting upward in two mirrored plumes.

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  twinkle: number;
  ts: number;
  life: number;
};

type ParticleOpts = {
  density?: number;
  speed?: number;
  color?: string;
};

export class Particles {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: Required<ParticleOpts>;
  private parts: Particle[] = [];
  private raf: number | null = null;
  private W = 0;
  private H = 0;

  constructor(canvas: HTMLCanvasElement, opts: ParticleOpts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.opts = { density: 1, speed: 1, color: "255,255,255", ...opts };
    this.onResize = this.onResize.bind(this);
  }

  start() {
    this.onResize();
    window.addEventListener("resize", this.onResize);
    this.loop();
  }

  stop() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
  }

  private onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.cv.getBoundingClientRect();
    this.W = r.width;
    this.H = r.height;
    this.cv.width = r.width * dpr;
    this.cv.height = r.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.spawn(true);
  }

  private spawn(reset: boolean) {
    const target = Math.floor((this.W * this.H) / 2200 * this.opts.density);
    if (reset) this.parts = [];
    while (this.parts.length < target) {
      this.parts.push(this.make(true));
    }
  }

  private make(initial: boolean): Particle {
    const W = this.W, H = this.H;
    const side = Math.random() < 0.5 ? -1 : 1;
    const srcX = W * 0.5 + side * (W * 0.05 + Math.random() * W * 0.10);
    const srcY = H * (initial ? Math.random() : 0.85 + Math.random() * 0.2);
    const angle = -Math.PI / 2 + side * (0.18 + Math.random() * 0.30);
    const speed = (0.15 + Math.random() * 0.55) * this.opts.speed;
    const size = Math.pow(Math.random(), 2.4) * 2.6 + 0.3;
    return {
      x: srcX + (Math.random() - 0.5) * W * 0.05,
      y: srcY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: size,
      a: Math.random() * 0.7 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
      ts: Math.random() * 0.02 + 0.005,
      life: Math.random() * 0.6 + 0.4,
    };
  }

  private loop() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);
    const c = this.opts.color;
    for (const p of this.parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.0008;
      p.twinkle += p.ts;
      const tw = 0.55 + 0.45 * Math.sin(p.twinkle);
      const a = p.a * tw * p.life;
      if (p.y < -10 || p.x < -20 || p.x > W + 20) {
        Object.assign(p, this.make(false));
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(${c},${a.toFixed(3)})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (p.r > 1.6) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c},${(a * 0.25).toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }
}
