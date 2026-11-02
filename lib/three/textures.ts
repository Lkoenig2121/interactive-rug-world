import * as THREE from "three";
import { seededRandom } from "../world/geometry";

const cache = new Map<string, THREE.CanvasTexture>();

function makeTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  opts: { repeat?: [number, number]; color?: boolean; anisotropy?: number } = {},
): THREE.CanvasTexture {
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts.color !== false) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = opts.anisotropy ?? 8;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, alpha: number, seed: number, size = 1) {
  const rand = seededRandom(seed);
  for (let i = 0; i < count; i++) {
    const v = Math.floor(rand() * 255);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rand()})`;
    ctx.fillRect(rand() * w, rand() * h, size, size);
  }
}

export function woodFloorTexture() {
  return makeTexture("wood", 1024, 1024, (ctx, w, h) => {
    const rand = seededRandom(7);
    const rows = 8;
    const rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 400;
      while (x < w) {
        const len = 380 + rand() * 420;
        const hue = 27 + rand() * 8;
        const light = 42 + rand() * 12;
        ctx.fillStyle = `hsl(${hue}, ${48 + rand() * 10}%, ${light}%)`;
        ctx.fillRect(x, r * rowH, len, rowH);
        // Grain
        for (let g = 0; g < 26; g++) {
          const gy = r * rowH + rand() * rowH;
          ctx.strokeStyle = `hsla(${hue - 4}, 45%, ${light - 14}%, ${0.08 + rand() * 0.18})`;
          ctx.lineWidth = 0.6 + rand() * 1.6;
          ctx.beginPath();
          ctx.moveTo(x, gy);
          for (let k = 0; k <= 8; k++) ctx.lineTo(x + (len * k) / 8, gy + Math.sin(k * 0.9 + g) * (1 + rand() * 2));
          ctx.stroke();
        }
        // Knot
        if (rand() < 0.25) {
          const kx = x + rand() * len;
          const ky = r * rowH + rowH * (0.3 + rand() * 0.4);
          const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, 12);
          grad.addColorStop(0, `hsla(${hue - 6}, 50%, ${light - 22}%, 0.7)`);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.fillRect(kx - 14, ky - 10, 28, 20);
        }
        ctx.fillStyle = "rgba(40,22,10,0.55)";
        ctx.fillRect(x, r * rowH, 2, rowH);
        x += len;
      }
      ctx.fillStyle = "rgba(40,22,10,0.6)";
      ctx.fillRect(0, r * rowH, w, 2);
    }
    noise(ctx, w, h, 30000, 0.06, 11);
  });
}

export function carpetTexture() {
  return makeTexture("carpet", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#5f9e48";
    ctx.fillRect(0, 0, w, h);
    const rand = seededRandom(21);
    for (let i = 0; i < 26000; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const l = 36 + rand() * 18;
      ctx.strokeStyle = `hsla(${100 + rand() * 14}, ${38 + rand() * 18}%, ${l}%, ${0.25 + rand() * 0.4})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * 3, y + (rand() - 0.5) * 3);
      ctx.stroke();
    }
  });
}

export function carpetBumpTexture() {
  return makeTexture(
    "carpet-bump",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 22000, 0.9, 5, 1.5);
    },
    { color: false },
  );
}

export function rugBorderTexture() {
  return makeTexture("rug-border", 256, 64, (ctx, w, h) => {
    ctx.fillStyle = "#284b8f";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f4c542";
    ctx.fillRect(0, h * 0.18, w, h * 0.08);
    ctx.fillRect(0, h * 0.74, w, h * 0.08);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
    noise(ctx, w, h, 4000, 0.2, 3);
  });
}

export function asphaltTexture() {
  return makeTexture("asphalt", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#6c7077";
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 50000, 0.35, 99, 1.5);
    const rand = seededRandom(5);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(40,42,48,${0.04 + rand() * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(rand() * w, rand() * h, 20 + rand() * 60, 10 + rand() * 40, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function concreteTexture() {
  return makeTexture("concrete", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#cfcac0";
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 9000, 0.18, 17);
    ctx.strokeStyle = "rgba(90,85,78,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo((i * w) / 4, 0);
      ctx.lineTo((i * w) / 4, h);
      ctx.moveTo(0, (i * h) / 4);
      ctx.lineTo(w, (i * h) / 4);
      ctx.stroke();
    }
  });
}

export function wallTexture() {
  return makeTexture("wall", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#efe7da";
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 12000, 0.07, 31, 2);
  });
}

export function fabricTexture() {
  return makeTexture("fabric", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#efe4d0";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(150,130,100,${y % 4 === 0 ? 0.08 : 0.03})`;
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += 2) {
      ctx.fillStyle = `rgba(150,130,100,${x % 4 === 0 ? 0.06 : 0.02})`;
      ctx.fillRect(x, 0, 1, h);
    }
    noise(ctx, w, h, 5000, 0.08, 41);
  });
}

export function brickTexture() {
  return makeTexture("brick", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#d8cbbb";
    ctx.fillRect(0, 0, w, h);
    const rand = seededRandom(9);
    const bh = 16;
    const bw = 48;
    for (let r = 0; r < h / bh; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let c = -1; c < w / bw + 1; c++) {
        const l = 82 + rand() * 18;
        ctx.fillStyle = `rgb(${l + 90}, ${l - 10}, ${l - 30})`;
        ctx.fillRect(c * bw + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
      }
    }
    noise(ctx, w, h, 6000, 0.12, 19);
  });
}

export function shingleTexture() {
  return makeTexture(
    "shingle",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      const rand = seededRandom(12);
      const rh = 20;
      const tw = 28;
      for (let r = 0; r < h / rh; r++) {
        const off = r % 2 ? tw / 2 : 0;
        for (let c = -1; c < w / tw + 1; c++) {
          const v = 200 + rand() * 55;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(c * tw + off + 1, r * rh + 1, tw - 2, rh - 2);
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(c * tw + off, r * rh + rh - 3, tw, 3);
        }
      }
    },
    { repeat: [0.25, 0.25] },
  );
}

export function skyTexture() {
  return makeTexture("sky", 64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#9ec9f0");
    g.addColorStop(0.55, "#dcecf8");
    g.addColorStop(0.8, "#f7f4ea");
    g.addColorStop(1, "#c4d7b0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function stripeTexture(a: string, b: string) {
  return makeTexture(`stripe-${a}-${b}`, 128, 16, (ctx, w, h) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? a : b;
      ctx.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
}

export function tileTexture(base: string, line: string, key = "tile") {
  return makeTexture(`${key}-${base}`, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 5000, 0.06, 77, 2);
    ctx.strokeStyle = line;
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo((i * w) / 4, 0);
      ctx.lineTo((i * w) / 4, h);
      ctx.moveTo(0, (i * h) / 4);
      ctx.lineTo(w, (i * h) / 4);
      ctx.stroke();
    }
  });
}

export function marbleTexture() {
  return makeTexture("marble", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#f1ede6";
    ctx.fillRect(0, 0, w, h);
    const rand = seededRandom(64);
    for (let i = 0; i < 28; i++) {
      ctx.strokeStyle = `rgba(150,140,130,${0.08 + rand() * 0.15})`;
      ctx.lineWidth = 0.5 + rand() * 2;
      ctx.beginPath();
      let x = rand() * w;
      let y = rand() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 12; k++) {
        x += (rand() - 0.3) * 60;
        y += (rand() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(120,110,100,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);
  });
}

export interface LabelOptions {
  bg?: string;
  fg?: string;
  width?: number;
  height?: number;
  font?: string;
  border?: string;
  radius?: number;
}

/** Text drawn on a canvas, for signs and boards (no font downloads needed). */
export function labelTexture(text: string, opts: LabelOptions = {}) {
  const { bg = "#ffffff", fg = "#111827", width = 512, height = 128, font, border, radius = 18 } = opts;
  const key = `label-${text}-${bg}-${fg}-${width}-${height}-${border}-${font}`;
  const tex = makeTexture(key, width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, radius);
      ctx.fill();
    }
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = Math.max(6, h * 0.06);
      ctx.beginPath();
      ctx.roundRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth, radius);
      ctx.stroke();
    }
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = Math.floor(h * 0.56);
    const family = font ?? "'Helvetica Neue', Arial, sans-serif";
    ctx.font = `800 ${size}px ${family}`;
    while (ctx.measureText(text).width > w * 0.88 && size > 8) {
      size -= 2;
      ctx.font = `800 ${size}px ${family}`;
    }
    ctx.fillText(text, w / 2, h / 2 + size * 0.04);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
