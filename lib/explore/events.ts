import { EXT_Y } from "../house/layout";
import { doorOutside, landmarkById } from "../town/config";
import { arrivalPoint, findTownRoute, offsetRoute } from "../town/navigation";
import type { Vec2 } from "../world/types";

/** Random happenings around town, City Trial style. */
export type WorldEventKind = "meteor" | "garbage" | "sale";

export interface WorldEvent {
  id: number;
  kind: WorldEventKind;
  title: string;
  hint: string;
  /** Where the map beacon stands (the truck event moves it along the route). */
  x: number;
  z: number;
  /** Clock time it started and how long it lasts. */
  start: number;
  duration: number;
}

export const FIRST_EVENT_DELAY = 45;
export const EVENT_GAP: [number, number] = [150, 210];

/** Garbage truck route: Sid's curb to the landfill gate. */
let truckRoute: { points: Vec2[]; lengths: number[]; total: number } | null = null;
export function garbageRoute() {
  if (truckRoute) return truckRoute;
  const raw = findTownRoute({ x: 2150, z: 950 }, arrivalPoint(landmarkById.landfill)).points;
  const points = offsetRoute(raw, 220);
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
  truckRoute = { points, lengths, total: lengths[lengths.length - 1] };
  return truckRoute;
}

export const TRUCK_SPEED = 900;

/** Truck pose `d` cm along its route. */
export function truckPose(d: number) {
  const r = garbageRoute();
  const dd = Math.max(0, Math.min(r.total, d));
  let i = 1;
  while (i < r.points.length - 1 && r.lengths[i] < dd) i++;
  const a = r.points[i - 1];
  const b = r.points[i];
  const seg = r.lengths[i] - r.lengths[i - 1] || 1;
  const t = (dd - r.lengths[i - 1]) / seg;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: Math.atan2(b.x - a.x, b.z - a.z), done: dd >= r.total };
}

let nextId = 0;

export function makeEvent(kind: WorldEventKind, now: number, rand = Math.random): WorldEvent {
  const id = ++nextId;
  if (kind === "meteor") {
    const park = landmarkById.park;
    const x = park.x + (rand() - 0.5) * park.w * 0.7;
    const z = park.z + (rand() - 0.5) * park.d * 0.6;
    return { id, kind, title: "Meteor in the park!", hint: "A lost toy fell from the sky into City Park. Get there and press E.", x, z, start: now, duration: 150 };
  }
  if (kind === "garbage") {
    const p = truckPose(0);
    return { id, kind, title: "Garbage day", hint: "The truck is heading for the landfill. Hop on the back (E) and ride along.", x: p.x, z: p.z, start: now, duration: garbageRoute().total / TRUCK_SPEED + 40 };
  }
  const door = doorOutside(landmarkById.toybarn, 400);
  return { id, kind, title: "Toy Barn sale!", hint: "Doors are open and prizes are out. Grab a bargain at the entrance (E).", x: door.x, z: door.z, start: now, duration: 120 };
}

export const EVENT_Y = EXT_Y;
