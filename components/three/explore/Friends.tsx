"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CONGA_GAP, FRIENDS, friendById, type Friend } from "@/lib/explore/friends";
import { ANDY_ROOM, EXT_Y, UPPER_Y } from "@/lib/house/layout";
import { groundHeight } from "@/lib/house/walkable";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { Sign } from "../town/parts";
import { FriendModel } from "./FriendModel";

const FIELD = FRIENDS.filter((f) => f.spot);
const RECRUIT_R = 70;
const STEP = 6;
const TRAIL_MAX = 400;

interface Pt {
  x: number;
  y: number;
  z: number;
}

/** A lost toy waiting at its spot: bobs, glows, and joins you when you walk up to it. */
function FieldFriend({ friend }: { friend: Friend }) {
  const found = useStore((s) => s.friends.includes(friend.id));
  const body = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const base = useMemo(() => {
    const s = friend.spot!;
    const g = groundHeight(s.x, s.z, EXT_Y + 40);
    return { x: s.x, y: Number.isFinite(g) ? g : s.y, z: s.z };
  }, [friend]);
  const phase = useMemo(() => base.x * 0.013 + base.z * 0.007, [base]);

  useFrame(({ clock }) => {
    if (found) return;
    const now = clock.elapsedTime + phase;
    const t = runtime.toy;
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(now * 3)) * 5;
      const near = Math.hypot(t.x - base.x, t.z - base.z) < 600;
      body.current.rotation.y = near ? Math.atan2(t.x - base.x, t.z - base.z) : Math.sin(now * 0.7) * 1.2;
    }
    if (ring.current) {
      ring.current.rotation.z = now * 1.5;
      ring.current.scale.setScalar(1 + Math.sin(now * 4) * 0.08);
    }
    const s = useStore.getState();
    if (s.mode !== "toy" || s.inSpace || s.cutscene || s.arcadeGame) return;
    if (Math.hypot(t.x - base.x, t.z - base.z) < RECRUIT_R && Math.abs(t.y - base.y) < 80) s.findFriend(friend.id);
  });

  if (found) return null;
  return (
    <group position={[base.x, base.y, base.z]}>
      <group ref={body}>
        <FriendModel friend={friend} />
      </group>
      <mesh ref={ring} position={[0, 1.5, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[18, 22, 32, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.75} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 20, 0]} color="#4ade80" intensity={0.6} distance={140} decay={1} />
    </group>
  );
}

/** Point `dist` cm back along the breadcrumb trail (newest first). */
function alongTrail(trail: Pt[], dist: number, out: Pt, ahead: Pt) {
  let left = dist;
  for (let i = 0; i < trail.length - 1; i++) {
    const a = trail[i];
    const b = trail[i + 1];
    const seg = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6;
    if (left <= seg) {
      const k = left / seg;
      out.x = a.x + (b.x - a.x) * k;
      out.y = a.y + (b.y - a.y) * k;
      out.z = a.z + (b.z - a.z) * k;
      ahead.x = a.x;
      ahead.z = a.z;
      return;
    }
    left -= seg;
  }
  const last = trail[trail.length - 1];
  const prev = trail[Math.max(0, trail.length - 2)];
  out.x = last.x;
  out.y = last.y;
  out.z = last.z;
  ahead.x = prev.x;
  ahead.z = prev.z;
}

/** Found friends that haven't reached Andy's room yet hop along behind the toy in a conga line. */
function Followers() {
  const friends = useStore((s) => s.friends);
  const home = useStore((s) => s.friendsHome);
  const following = useMemo(() => friends.filter((f) => !home.includes(f)), [friends, home]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const trail = useRef<Pt[]>([]);
  const pos = useRef<Pt[]>([]);
  const tmp = useMemo(() => ({ out: { x: 0, y: 0, z: 0 }, ahead: { x: 0, y: 0, z: 0 } }), []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useStore.getState();
    const t = runtime.toy;
    const visible = s.mode === "toy" && !s.inSpace;

    const tr = trail.current;
    const head = tr[0];
    const jump = head ? Math.hypot(t.x - head.x, t.z - head.z) : Infinity;
    if (jump > 300 || (head && Math.abs(t.y - head.y) > 300)) {
      tr.length = 0;
      tr.push({ x: t.x, y: t.y, z: t.z });
      pos.current = [];
    } else if (jump > STEP) {
      tr.unshift({ x: t.x, y: t.y, z: t.z });
      if (tr.length > TRAIL_MAX) tr.length = TRAIL_MAX;
    }

    if (visible && following.length && !s.cutscene && inRoom(t)) s.deliverFriends();

    const now = clock.elapsedTime;
    const cut = s.cutscene;
    const dir = { x: -Math.sin(t.yaw), z: -Math.cos(t.yaw) };
    following.forEach((id, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.visible = visible;
      const p = (pos.current[i] ??= { x: t.x, y: t.y, z: t.z });
      let yaw: number;
      let hop: number;
      const star = cut && cut.friendId === id;
      if (star) {
        const age = now - cut.start;
        const tx = t.x + dir.x * 45;
        const tz = t.z + dir.z * 45;
        p.x += (tx - p.x) * Math.min(1, dt * 6);
        p.z += (tz - p.z) * Math.min(1, dt * 6);
        p.y = groundHeight(p.x, p.z, t.y + 20);
        if (!Number.isFinite(p.y)) p.y = t.y;
        hop = Math.abs(Math.sin(age * 5)) * 16;
        yaw = Math.atan2(t.x - p.x, t.z - p.z) + (age < 1.4 ? age * Math.PI * 2 * 1.4 : 0);
      } else {
        alongTrail(tr, (i + 1) * CONGA_GAP + 10, tmp.out, tmp.ahead);
        const k = Math.min(1, dt * 10);
        p.x += (tmp.out.x - p.x) * k;
        p.z += (tmp.out.z - p.z) * k;
        const g0 = groundHeight(p.x, p.z, tmp.out.y + 20);
        p.y = Number.isFinite(g0) ? Math.max(g0, Math.min(tmp.out.y, g0 + 400)) : tmp.out.y;
        const dx = tmp.ahead.x - p.x;
        const dz = tmp.ahead.z - p.z;
        yaw = Math.hypot(dx, dz) > 1 ? Math.atan2(dx, dz) : g.rotation.y;
        const moving = Math.hypot(tmp.out.x - p.x, tmp.out.z - p.z) > 1 || jump > STEP;
        hop = moving ? Math.abs(Math.sin(now * 9 + i * 0.9)) * 5 : Math.abs(Math.sin(now * 2 + i)) * 1.2;
      }
      g.position.set(p.x, p.y + hop, p.z);
      let d = yaw - g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      g.rotation.y += d * Math.min(1, dt * (star ? 30 : 8));
    });
  });

  return (
    <>
      {following.map((id, i) => (
        <group
          key={id}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <FriendModel friend={friendById[id]} />
        </group>
      ))}
    </>
  );
}

const inRoom = (t: Pt) =>
  t.x > ANDY_ROOM.x0 && t.x < ANDY_ROOM.x1 && t.z > ANDY_ROOM.z0 && t.z < ANDY_ROOM.z1 && Math.abs(t.y - UPPER_Y) < 60;

/** Lost toys around town plus the ones following you home. */
export function Friends() {
  return (
    <>
      {FIELD.map((f) => (
        <FieldFriend key={f.id} friend={f} />
      ))}
      <Followers />
    </>
  );
}

const SHELF_X = ANDY_ROOM.x1 - 2;
const SHELF_D = 22;
const ROWS = [UPPER_Y + 100, UPPER_Y + 150];
const PER_ROW = 6;
const SLOT_Z0 = -6;
const SLOT_GAP = 28;

/** Trophy shelf on Andy's east wall: every friend you bring home sits in its slot. */
export function FriendShelf() {
  const home = useStore((s) => s.friendsHome);
  const z0 = SLOT_Z0 - SLOT_GAP / 2;
  const len = PER_ROW * SLOT_GAP;
  const wood = <meshStandardMaterial color="#b07a4a" roughness={0.7} />;
  return (
    <group>
      {ROWS.map((y) => (
        <group key={y}>
          <mesh position={[SHELF_X - SHELF_D / 2, y - 1.5, z0 + len / 2]} castShadow receiveShadow>
            <boxGeometry args={[SHELF_D, 3, len]} />
            {wood}
          </mesh>
          {[z0 + 8, z0 + len - 8].map((z) => (
            <mesh key={z} position={[SHELF_X - 4, y - 9, z]}>
              <boxGeometry args={[6, 14, 2]} />
              {wood}
            </mesh>
          ))}
        </group>
      ))}
      <Sign text="Friends Found" position={[SHELF_X - 0.5, ROWS[1] + 42, z0 + len / 2]} size={[90, 16]} rotationY={-Math.PI / 2} bg="#2b2d42" fg="#ffd166" />
      {FRIENDS.map((f, i) => {
        const y = ROWS[Math.floor(i / PER_ROW)];
        const z = SLOT_Z0 + (i % PER_ROW) * SLOT_GAP;
        const there = home.includes(f.id);
        return (
          <group key={f.id}>
            {there && (
              <group position={[SHELF_X - SHELF_D / 2, y, z]} rotation-y={-Math.PI / 2} scale={0.9}>
                <FriendModel friend={f} />
              </group>
            )}
            <Sign
              text={there ? f.name : "?"}
              position={[SHELF_X - SHELF_D - 0.3, y - 4, z]}
              size={[24, 5]}
              rotationY={-Math.PI / 2}
              bg={there ? "#ffd166" : "#3d405b"}
              fg={there ? "#2b2d42" : "#9aa0b5"}
            />
          </group>
        );
      })}
    </group>
  );
}
