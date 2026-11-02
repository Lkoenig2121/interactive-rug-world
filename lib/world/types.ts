export interface Vec2 {
  x: number;
  z: number;
}

export interface Pose {
  x: number;
  z: number;
  /** Heading in radians. 0 looks toward -z ("north"), positive turns left. */
  yaw: number;
}

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RoadNode {
  id: string;
  x: number;
  z: number;
  roundabout?: boolean;
}

export type RoadKind = "ring" | "avenue" | "street" | "roundabout";

export interface RoadEdge {
  id: string;
  a: string;
  b: string;
  name: string;
  kind: RoadKind;
  /** Centerline polyline from node a to node b (inclusive). */
  points: Vec2[];
  length: number;
}

export type BuildingType =
  | "house"
  | "home"
  | "apartment"
  | "school"
  | "bank"
  | "church"
  | "police"
  | "fire"
  | "coffee"
  | "supermarket"
  | "gas"
  | "shop";

export type Facing = "n" | "s" | "e" | "w";

export type InteriorId =
  | "police"
  | "fire"
  | "school"
  | "bank"
  | "coffee"
  | "supermarket";

export interface BuildingDef {
  id: string;
  name: string;
  type: BuildingType;
  /** Footprint center. */
  x: number;
  z: number;
  /** Facade width (local x) and depth (local z) before rotation. */
  w: number;
  d: number;
  /** Direction the front door faces. */
  facing: Facing;
  district: string;
  description: string;
  color?: string;
  roofColor?: string;
  signText?: string;
  interior?: InteriorId;
  /** Shown in the destination list. */
  destination?: boolean;
}

export type ManeuverType =
  | "depart"
  | "straight"
  | "slight-left"
  | "slight-right"
  | "left"
  | "right"
  | "uturn"
  | "roundabout"
  | "arrive";

export interface Maneuver {
  /** Distance along the route where the maneuver happens. */
  s: number;
  type: ManeuverType;
  text: string;
  point: Vec2;
}

export interface Route {
  destinationId: string;
  points: Vec2[];
  length: number;
  maneuvers: Maneuver[];
  /** Road edges traversed, for highlighting. */
  edgeIds: string[];
}
