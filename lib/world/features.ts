import type { Rect } from "./types";
import { rectFromCenter } from "./geometry";

export interface Pond {
  id: string;
  name: string;
  x: number;
  z: number;
  rx: number;
  rz: number;
}

export interface Park {
  id: string;
  name: string;
  x: number;
  z: number;
  rx: number;
  rz: number;
}

export interface ParkingLot {
  id: string;
  name: string;
  rect: Rect;
  /** Stalls run along x (cars point along z) or along z. */
  stallsAlong: "x" | "z";
  parkedCars: number[];
}

export interface Bench {
  x: number;
  z: number;
  rot: number;
}

export const ponds: Pond[] = [
  { id: "willow-pond", name: "Willow Pond", x: -32, z: -27, rx: 10, rz: 7.5 },
  { id: "duck-pond", name: "Duck Pond", x: 17, z: 51, rx: 7, rz: 6 },
];

export const parks: Park[] = [
  { id: "willow-park", name: "Willow Park", x: -32, z: -27, rx: 21, rz: 15 },
  { id: "duck-park", name: "Duck Pond Park", x: 17, z: 52, rx: 11, rz: 12 },
  { id: "playground", name: "Playground", x: -84, z: 20, rx: 5.5, rz: 9 },
];

export const parkingLots: ParkingLot[] = [
  {
    id: "freshmart-lot",
    name: "FreshMart Parking",
    rect: rectFromCenter(43, -14.5, 34, 11),
    stallsAlong: "x",
    parkedCars: [1, 2, 5, 7, 8, 11],
  },
  {
    id: "east-lot",
    name: "East Parking Lot",
    rect: rectFromCenter(90, 20, 20, 20),
    stallsAlong: "z",
    parkedCars: [0, 3, 4, 6, 9],
  },
];

export const benches: Bench[] = [
  { x: -45, z: -18, rot: 0.6 },
  { x: -19, z: -36, rot: Math.PI + 0.5 },
  { x: -32, z: -15.5, rot: 0 },
  { x: 9, z: 59, rot: -0.8 },
  { x: 26, z: 59, rot: 0.8 },
  { x: -79.5, z: 31, rot: -Math.PI / 2 },
  { x: -36, z: 68, rot: Math.PI },
  { x: 13, z: -38, rot: 0 },
];

export const flowerBeds: { x: number; z: number; r: number; color: string }[] = [
  { x: -22, z: -40, r: 2.2, color: "#f472b6" },
  { x: -44, z: -36, r: 2.5, color: "#facc15" },
  { x: 24, z: 41, r: 2, color: "#fb7185" },
  { x: -36, z: 36, r: 1.6, color: "#f97316" },
  { x: -60, z: 32, r: 1.4, color: "#a78bfa" },
];
