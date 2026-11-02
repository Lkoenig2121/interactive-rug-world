"use client";

import { useEffect, useRef, useState } from "react";
import { recordArcadeScore, type ArcadeScore } from "@/lib/arcade/scores";
import { useStore, type ArcadeGame } from "@/lib/store";

type Phase = "play" | "over" | "board";

interface Alien {
  x: number;
  y: number;
  alive: boolean;
  kind: number;
}

interface Shot {
  x: number;
  y: number;
  dy: number;
}

const W = 320;
const H = 240;
const COLS = 8;
const ROWS = 4;

const TITLE: Record<ArcadeGame, string> = {
  invaders: "ALIEN INVADERS",
  blasters: "SPACE BLASTERS",
};

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 8, y, 16, 6);
  ctx.fillRect(x - 10, y + 4, 20, 4);
  ctx.fillRect(x - 2, y - 5, 4, 6);
}

function drawAlien(ctx: CanvasRenderingContext2D, x: number, y: number, kind: number, frame: number) {
  ctx.fillStyle = kind === 0 ? "#7dff7d" : kind === 1 ? "#7dfff6" : "#ffd24a";
  const f = frame % 2;
  ctx.fillRect(x - 7, y - 5, 14, 10);
  ctx.fillRect(x - 9, y - 2, 3, 6);
  ctx.fillRect(x + 6, y - 2, 3, 6);
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(x - 4, y - 2, 3, 3);
  ctx.fillRect(x + 1, y - 2, 3, 3);
  ctx.fillStyle = kind === 0 ? "#7dff7d" : kind === 1 ? "#7dfff6" : "#ffd24a";
  if (f) {
    ctx.fillRect(x - 8, y + 5, 4, 3);
    ctx.fillRect(x + 4, y + 5, 4, 3);
  } else {
    ctx.fillRect(x - 6, y + 5, 4, 3);
    ctx.fillRect(x + 2, y + 5, 4, 3);
  }
}

function spawnWave(wave: number): Alien[] {
  const out: Alien[] = [];
  const gapX = 28;
  const gapY = 22;
  const left = 36;
  const top = 28;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({
        x: left + c * gapX,
        y: top + r * gapY + Math.min(24, (wave - 1) * 4),
        alive: true,
        kind: r === 0 ? 0 : r < 3 ? 1 : 2,
      });
    }
  }
  return out;
}

function freshGame() {
  return {
    playerX: W / 2,
    cooldown: 0,
    bullets: [] as Shot[],
    aliens: spawnWave(1),
    dir: 1,
    stepIn: 0.55,
    acc: 0,
    score: 0,
    lives: 3,
    wave: 1,
    frame: 0,
  };
}

function InvadersScreen({ game, onClose }: { game: ArcadeGame; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("play");
  const [finalScore, setFinalScore] = useState(0);
  const [board, setBoard] = useState<ArcadeScore[]>([]);
  const [rank, setRank] = useState(0);
  const keys = useRef(new Set<string>());
  const held = useRef({ left: false, right: false, fire: false });
  const state = useRef(freshGame());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW"].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const s = state.current;
      const k = keys.current;
      const pad = held.current;
      s.frame++;

      const left = pad.left || k.has("ArrowLeft") || k.has("KeyA");
      const right = pad.right || k.has("ArrowRight") || k.has("KeyD");
      if (left) s.playerX -= 120 * dt;
      if (right) s.playerX += 120 * dt;
      s.playerX = Math.max(14, Math.min(W - 14, s.playerX));
      s.cooldown = Math.max(0, s.cooldown - dt);
      if ((pad.fire || k.has("Space") || k.has("KeyW") || k.has("ArrowUp")) && s.cooldown <= 0) {
        s.bullets.push({ x: s.playerX, y: H - 28, dy: -220 });
        s.cooldown = 0.38;
      }

      for (const b of s.bullets) b.y += b.dy * dt;
      s.bullets = s.bullets.filter((b) => b.y > -8 && b.y < H + 8);

      const live = s.aliens.filter((a) => a.alive);
      s.acc += dt;
      if (live.length && s.acc >= s.stepIn) {
        s.acc = 0;
        const edge = 12;
        const xs = live.map((a) => a.x);
        const hitEdge = s.dir > 0 ? Math.max(...xs) > W - edge : Math.min(...xs) < edge;
        if (hitEdge) {
          s.dir *= -1;
          for (const a of s.aliens) if (a.alive) a.y += 10;
        } else {
          for (const a of s.aliens) if (a.alive) a.x += s.dir * 8;
        }
      }

      if (live.length && Math.random() < dt * (0.35 + s.wave * 0.08)) {
        const shooter = live[Math.floor(Math.random() * live.length)];
        s.bullets.push({ x: shooter.x, y: shooter.y + 8, dy: 110 + s.wave * 8 });
      }

      for (const b of s.bullets) {
        if (b.dy < 0) {
          for (const a of s.aliens) {
            if (!a.alive) continue;
            if (Math.abs(a.x - b.x) < 10 && Math.abs(a.y - b.y) < 8) {
              a.alive = false;
              b.y = -99;
              s.score += a.kind === 0 ? 40 : a.kind === 1 ? 20 : 10;
              break;
            }
          }
        } else if (Math.abs(b.x - s.playerX) < 12 && b.y > H - 32 && b.y < H - 16) {
          b.y = H + 99;
          s.lives -= 1;
        }
      }

      if (s.aliens.every((a) => !a.alive)) {
        s.wave += 1;
        s.stepIn = Math.max(0.18, 0.55 - s.wave * 0.04);
        s.aliens = spawnWave(s.wave);
        s.bullets = [];
      }
      const reached = s.aliens.some((a) => a.alive && a.y > H - 48);
      if (s.lives <= 0 || reached) {
        const name = useStore.getState().toy === "cowboy" ? "COW" : "RAN";
        const next = recordArcadeScore(game, { name, score: s.score, wave: s.wave });
        const i = next.findIndex((row) => row.name === name && row.score === s.score && row.wave === s.wave);
        setFinalScore(s.score);
        setBoard(next);
        setRank(i < 0 ? next.length : i + 1);
        setPhase("over");
        return;
      }

      ctx.fillStyle = "#070b16";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#13203a";
      for (let i = 0; i < 40; i++) ctx.fillRect((i * 47) % W, (i * 89) % (H - 40), 1, 1);
      ctx.fillStyle = "#d7f7ff";
      ctx.font = "8px monospace";
      ctx.fillText(`SCORE ${String(s.score).padStart(5, "0")}`, 8, 12);
      ctx.fillText(`WAVE ${s.wave}`, 140, 12);
      ctx.fillText(`LIVES ${s.lives}`, 240, 12);
      ctx.fillRect(0, 16, W, 1);
      for (const a of s.aliens) if (a.alive) drawAlien(ctx, a.x, a.y, a.kind, Math.floor(s.frame / 20));
      for (const b of s.bullets) {
        ctx.fillStyle = b.dy < 0 ? "#fff4a3" : "#ff6b6b";
        ctx.fillRect(b.x - 1, b.y - 4, 2, 8);
      }
      drawShip(ctx, s.playerX, H - 24, "#b6ff6a");
      ctx.fillStyle = "#3d6b3a";
      ctx.fillRect(0, H - 12, W, 12);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, game]);

  useEffect(() => {
    if (phase !== "over") return;
    const t = window.setTimeout(() => setPhase("board"), 1100);
    return () => window.clearTimeout(t);
  }, [phase]);

  const hold = (which: "left" | "right" | "fire", on: boolean) => {
    held.current[which] = on;
  };

  return (
    <>
      <div className="rounded-xl bg-[#1b2a38] p-2.5 shadow-inner">
        <div className="relative aspect-4/3 overflow-hidden rounded-md bg-[#070b16] ring-2 ring-[#0e1a24]">
          {phase === "board" ? (
            <div className="flex h-full flex-col bg-[#070b16] px-5 py-4 font-mono text-[#d7f7ff]">
              <div className="text-center text-[10px] tracking-[0.35em] text-amber-300">{TITLE[game]}</div>
              <div className="mt-1 text-center text-sm font-bold tracking-[0.2em] text-lime-300">HALL OF FAME</div>
              <div className="mt-3 flex-1 text-[11px] leading-5">
                {board.map((row, i) => {
                  const you = i + 1 === rank;
                  return (
                    <div key={`${row.name}-${row.score}-${i}`} className={`flex justify-between px-1 ${you ? "bg-lime-400/20 text-lime-300" : ""}`}>
                      <span>
                        {i + 1}. {row.name}
                      </span>
                      <span>
                        {row.score} <span className="text-white/40">W{row.wave}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-center text-[11px] text-amber-200">
                YOUR SCORE {finalScore} · RANK {rank}
              </div>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  onClick={() => {
                    state.current = freshGame();
                    setPhase("play");
                  }}
                  className="rounded bg-lime-400 px-3 py-1 text-[10px] font-bold text-slate-900 hover:bg-lime-300"
                >
                  PLAY AGAIN
                </button>
                <button onClick={onClose} className="rounded bg-white/15 px-3 py-1 text-[10px] font-bold text-white hover:bg-white/25">
                  EXIT
                </button>
              </div>
            </div>
          ) : (
            <>
              <canvas ref={canvasRef} width={W} height={H} className="h-full w-full [image-rendering:pixelated]" />
              {phase === "over" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 font-mono text-lg font-bold tracking-[0.25em] text-lime-300">
                  GAME OVER
                </div>
              )}
            </>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[100%_3px] mix-blend-overlay" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-center gap-5">
        <CabinetKey label="◄" onHold={(on) => hold("left", on)} />
        <CabinetKey label="FIRE" onHold={(on) => hold("fire", on)} />
        <CabinetKey label="►" onHold={(on) => hold("right", on)} />
      </div>
    </>
  );
}

function CabinetKey({ label, onHold }: { label: string; onHold: (down: boolean) => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
      className="relative h-8 w-18 select-none bg-[#f0a12a] text-[10px] font-black tracking-wide text-[#7a4a08] shadow-[0_4px_0_#c47a12] active:translate-y-0.5 active:shadow-none"
      style={{ clipPath: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)" }}
    >
      {label}
    </button>
  );
}

/** Club Penguin Thin Ice–style arcade cabinet overlay. */
export function ArcadeCabinet() {
  const game = useStore((s) => s.arcadeGame);
  const close = () => useStore.getState().closeArcade();
  if (!game) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-70 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-[min(640px,calc(100vw-2rem))]">
        <div className="rounded-[2.4rem] bg-linear-to-b from-[#6a8aa3] to-[#3d5c73] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-4 ring-[#2e4a5e]">
          <div className="mb-3 text-center text-sm font-black tracking-[0.28em] text-[#d7e8f4]">PIZZA PLANET</div>
          <InvadersScreen game={game} onClose={close} />
          <div className="mt-3 text-center text-[11px] font-semibold tracking-wide text-[#d7e8f4]/80">← → move · SPACE fire · ESC exit</div>
        </div>
        <button
          onClick={close}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-lg ring-1 ring-black/10 hover:bg-slate-100"
          aria-label="Close arcade"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
