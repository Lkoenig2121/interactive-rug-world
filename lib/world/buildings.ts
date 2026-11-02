import type { BuildingDef, BuildingType, Facing, Pose, Rect, Vec2 } from "./types";

const house = (
  id: string,
  name: string,
  x: number,
  z: number,
  facing: Facing,
  color: string,
  roofColor: string,
  district: string,
): BuildingDef => ({
  id,
  name,
  type: "house",
  x,
  z,
  w: 11,
  d: 10,
  facing,
  color,
  roofColor,
  district,
  description: "A cosy family house with a pitched roof and a little front garden.",
});

export const buildings: BuildingDef[] = [
  // --- West side ---------------------------------------------------------
  house("house-nw-1", "Rose Cottage", -112, -63, "n", "#f3d9b8", "#b4513a", "Northwest Quarter"),
  house("house-nw-2", "Ivy House", -99, -63, "n", "#cfe0ef", "#4f5d75", "Northwest Quarter"),
  house("house-nw-3", "Blue Door House", -86, -63, "n", "#f6efe1", "#8c3b2e", "Northwest Quarter"),
  {
    id: "fire-station",
    name: "Fire Station",
    type: "fire",
    x: -88,
    z: -20,
    w: 20,
    d: 16,
    facing: "e",
    district: "West Carpet World",
    description: "Station No. 1, home of the bravest firefighters on the rug.",
    interior: "fire",
    destination: true,
  },
  house("house-w-4", "Garden House", -112, -20, "w", "#e9d3a6", "#6b4a35", "West Carpet World"),
  {
    id: "school",
    name: "Carpet Primary School",
    type: "school",
    x: -104,
    z: 18,
    w: 26,
    d: 16,
    facing: "s",
    district: "West Carpet World",
    description: "Classrooms, a clock tower and a playground next door.",
    interior: "school",
    destination: true,
  },
  house("house-sw-1", "Sunny Cottage", -112, 58, "n", "#f7e3a1", "#a0442f", "Southwest Quarter"),
  house("house-sw-2", "Fern House", -99, 58, "n", "#d7ead2", "#55634b", "Southwest Quarter"),
  house("house-sw-3", "Brick House", -86, 58, "n", "#d9a48a", "#5b3a2e", "Southwest Quarter"),

  // --- Center west -------------------------------------------------------
  {
    id: "church",
    name: "St. Tufted Church",
    type: "church",
    x: -48,
    z: -55,
    w: 14,
    d: 24,
    facing: "n",
    district: "Old Town",
    description: "The tallest steeple on the rug. Its bell rings every carpet hour.",
    destination: true,
  },
  {
    id: "post-office",
    name: "Post Office",
    type: "shop",
    x: -18,
    z: -60,
    w: 10,
    d: 10,
    facing: "e",
    district: "Old Town",
    color: "#e8ecf2",
    signText: "POST",
    description: "Letters and parcels for every corner of the rug.",
  },
  {
    id: "police",
    name: "Police Station",
    type: "police",
    x: -46,
    z: 18,
    w: 20,
    d: 14,
    facing: "n",
    district: "Central Carpet World",
    description: "Keeping Carpet World safe, one lost toy at a time.",
    interior: "police",
    destination: true,
  },
  {
    id: "bank",
    name: "Carpet Savings Bank",
    type: "bank",
    x: -26,
    z: 26,
    w: 14,
    d: 12,
    facing: "n",
    district: "Central Carpet World",
    description: "A columned bank with a vault full of carpet coins.",
    interior: "bank",
    destination: true,
  },
  {
    id: "coffee",
    name: "Rug & Mug Coffee",
    type: "coffee",
    x: -50,
    z: 64,
    w: 12,
    d: 8,
    facing: "n",
    district: "Willow Crescent",
    description: "Tiny espressos and big cinnamon rolls on Willow Crescent.",
    interior: "coffee",
    destination: true,
  },
  {
    id: "toy-store",
    name: "Toy Store",
    type: "shop",
    x: -24,
    z: 65,
    w: 10,
    d: 7,
    facing: "n",
    district: "Willow Crescent",
    color: "#ffd6e0",
    signText: "TOYS",
    description: "Toys for the toys.",
  },

  // --- Center east -------------------------------------------------------
  {
    id: "supermarket",
    name: "FreshMart Supermarket",
    type: "supermarket",
    x: 40,
    z: -30,
    w: 30,
    d: 14,
    facing: "s",
    district: "Market District",
    description: "Groceries, fresh produce and a big parking lot out front.",
    interior: "supermarket",
    destination: true,
  },
  {
    id: "bakery",
    name: "Sweet Bakery",
    type: "shop",
    x: 25,
    z: -66,
    w: 9,
    d: 7,
    facing: "n",
    district: "Market District",
    color: "#fbe7c6",
    signText: "BAKERY",
    description: "Fresh bread every morning.",
  },
  {
    id: "flower-shop",
    name: "Flower Shop",
    type: "shop",
    x: 45,
    z: -66,
    w: 9,
    d: 7,
    facing: "n",
    district: "Market District",
    color: "#e4f2df",
    signText: "FLOWERS",
    description: "Tulips, daisies and tiny bouquets.",
  },
  {
    id: "gas-station",
    name: "Fuel Stop Gas Station",
    type: "gas",
    x: 40,
    z: 20,
    w: 22,
    d: 18,
    facing: "n",
    district: "Central Carpet World",
    description: "Fill up before a long drive around the ring road.",
    destination: true,
  },
  {
    id: "apartments-se",
    name: "Sunset Apartments",
    type: "apartment",
    x: 42,
    z: 58,
    w: 18,
    d: 12,
    facing: "s",
    district: "Duck Pond Park",
    color: "#f0c9a0",
    description: "Four floors of balconies overlooking Duck Pond Park.",
  },

  // --- East side ---------------------------------------------------------
  {
    id: "apartments-ne",
    name: "Harbor Apartments",
    type: "apartment",
    x: 99,
    z: -60,
    w: 18,
    d: 12,
    facing: "n",
    district: "Northeast Quarter",
    color: "#b9d3e3",
    description: "A tall apartment block on North Road.",
  },
  {
    id: "home",
    name: "Home",
    type: "home",
    x: 90,
    z: -20,
    w: 12,
    d: 11,
    facing: "w",
    district: "Oak Lane",
    color: "#fff4dc",
    roofColor: "#c0392b",
    description: "Your house on Oak Lane, with a red roof and a garage.",
    destination: true,
  },
  house("house-e-2", "Maple House", 110, -20, "e", "#e5d0f0", "#5e4b7a", "East Carpet World"),
  {
    id: "pizza",
    name: "Pizza Corner",
    type: "shop",
    x: 110,
    z: 20,
    w: 12,
    d: 10,
    facing: "w",
    district: "East Carpet World",
    color: "#fff1d0",
    signText: "PIZZA",
    description: "Wood-fired pizza next to the big parking lot.",
  },
  house("house-se-1", "Lilac House", 86, 60, "s", "#e7dcf3", "#7a4b6f", "Southeast Quarter"),
  house("house-se-2", "Mint House", 99, 60, "s", "#d4efe4", "#3f6f5a", "Southeast Quarter"),
  house("house-se-3", "Peach House", 112, 60, "s", "#fbd8c4", "#9a4a32", "Southeast Quarter"),
];

export const buildingById: Record<string, BuildingDef> = Object.fromEntries(buildings.map((b) => [b.id, b]));

export const destinations = buildings.filter((b) => b.destination);

export const TYPE_LABELS: Record<BuildingType, string> = {
  house: "Residential house",
  home: "Your home",
  apartment: "Apartment building",
  school: "School",
  bank: "Bank",
  church: "Church",
  police: "Police station",
  fire: "Fire station",
  coffee: "Coffee shop",
  supermarket: "Supermarket",
  gas: "Gas station",
  shop: "Shop",
};

export const TYPE_COLORS: Record<BuildingType, string> = {
  house: "#e9c9a4",
  home: "#ef4444",
  apartment: "#f59e0b",
  school: "#eab308",
  bank: "#10b981",
  church: "#a78bfa",
  police: "#3b82f6",
  fire: "#dc2626",
  coffee: "#92400e",
  supermarket: "#22c55e",
  gas: "#f97316",
  shop: "#ec4899",
};

export function facingRotation(f: Facing): number {
  switch (f) {
    case "s":
      return 0;
    case "n":
      return Math.PI;
    case "e":
      return Math.PI / 2;
    case "w":
      return -Math.PI / 2;
  }
}

export function facingVector(f: Facing): Vec2 {
  switch (f) {
    case "s":
      return { x: 0, z: 1 };
    case "n":
      return { x: 0, z: -1 };
    case "e":
      return { x: 1, z: 0 };
    case "w":
      return { x: -1, z: 0 };
  }
}

export function footprint(b: BuildingDef): Rect {
  const sideways = b.facing === "e" || b.facing === "w";
  const wx = sideways ? b.d : b.w;
  const wz = sideways ? b.w : b.d;
  return { minX: b.x - wx / 2, maxX: b.x + wx / 2, minZ: b.z - wz / 2, maxZ: b.z + wz / 2 };
}

export function doorPoint(b: BuildingDef): Vec2 {
  const f = facingVector(b.facing);
  return { x: b.x + f.x * (b.d / 2 + 0.6), z: b.z + f.z * (b.d / 2 + 0.6) };
}

/** Standing spot in front of the door, looking at the building. */
export function poseInFrontOf(b: BuildingDef, distance = 6): Pose {
  const f = facingVector(b.facing);
  const extra = b.type === "gas" ? -4 : 0;
  return {
    x: b.x + f.x * (b.d / 2 + distance + extra),
    z: b.z + f.z * (b.d / 2 + distance + extra),
    yaw: Math.atan2(f.x, f.z),
  };
}

export function buildingHeight(b: BuildingDef): number {
  switch (b.type) {
    case "house":
      return 9;
    case "home":
      return 10;
    case "apartment":
      return 14.5;
    case "school":
      return 15;
    case "bank":
      return 10;
    case "church":
      return 30;
    case "police":
      return 10;
    case "fire":
      return 15;
    case "coffee":
      return 7;
    case "supermarket":
      return 9;
    case "gas":
      return 10;
    case "shop":
      return 7;
  }
}
