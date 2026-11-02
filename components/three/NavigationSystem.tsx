"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ribbonGeometry } from "@/lib/three/ribbon";
import { currentOrigin } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { buildingById, buildingHeight, doorPoint, TYPE_LABELS } from "@/lib/world/buildings";
import { dist, pointAtDistance, projectOnPolyline } from "@/lib/world/geometry";
import { ROAD_Y } from "@/lib/world/roads";
import type { Route } from "@/lib/world/types";

const CHEVRON_SPACING = 5;

function chevronGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.9);
  s.lineTo(0.9, -0.2);
  s.lineTo(0.55, -0.55);
  s.lineTo(0, 0.15);
  s.lineTo(-0.55, -0.55);
  s.lineTo(-0.9, -0.2);
  s.closePath();
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  return g;
}

function RouteLine({ route }: { route: Route }) {
  const { core, halo } = useMemo(
    () => ({
      core: ribbonGeometry(route.points, 2.4, ROAD_Y + 0.06),
      halo: ribbonGeometry(route.points, 3.4, ROAD_Y + 0.05),
    }),
    [route],
  );
  const chevrons = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => chevronGeometry(), []);
  const count = Math.max(1, Math.floor(route.length / CHEVRON_SPACING));
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(({ clock }) => {
    const mesh = chevrons.current;
    if (!mesh) return;
    const offset = (clock.elapsedTime * 4) % CHEVRON_SPACING;
    for (let i = 0; i < count; i++) {
      const s = i * CHEVRON_SPACING + offset;
      const { point, dir } = pointAtDistance(route.points, Math.min(s, route.length));
      q.setFromAxisAngle(up, Math.atan2(dir.x, dir.z) + Math.PI);
      m.compose(new THREE.Vector3(point.x, ROAD_Y + 0.08, point.z), q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={halo} raycast={() => null}>
        <meshBasicMaterial color="#1e40af" transparent opacity={0.85} polygonOffset polygonOffsetFactor={-4} />
      </mesh>
      <mesh geometry={core} raycast={() => null}>
        <meshBasicMaterial color="#4f8ff7" toneMapped={false} polygonOffset polygonOffsetFactor={-6} />
      </mesh>
      <instancedMesh key={count} ref={chevrons} args={[geo, undefined, count]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} polygonOffset polygonOffsetFactor={-8} />
      </instancedMesh>
    </group>
  );
}

function DestinationPin({ id }: { id: string }) {
  const b = buildingById[id];
  const pin = useRef<THREE.Group>(null);
  const door = doorPoint(b);
  const h = buildingHeight(b) + 5;
  const mode = useStore((s) => s.mode);
  useFrame(({ clock }) => {
    if (!pin.current) return;
    pin.current.position.y = h + Math.sin(clock.elapsedTime * 2.2) * 0.6;
    pin.current.rotation.y = clock.elapsedTime * 0.8;
  });
  return (
    <group position={[b.x, 0, b.z]}>
      <group ref={pin}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <sphereGeometry args={[1.5, 24, 16]} />
          <meshStandardMaterial color="#ea4335" roughness={0.3} emissive="#b91c1c" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.6, 16, 12]} />
          <meshBasicMaterial color="#7f1d1d" />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation-x={Math.PI} castShadow>
          <coneGeometry args={[1.25, 2.6, 24]} />
          <meshStandardMaterial color="#ea4335" roughness={0.3} emissive="#b91c1c" emissiveIntensity={0.4} />
        </mesh>
        {mode !== "room" && (
          <Html center position={[0, 4.6, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-black/5">
              {b.name}
              <span className="ml-1.5 font-normal text-slate-500">{TYPE_LABELS[b.type]}</span>
            </div>
          </Html>
        )}
      </group>
      <mesh position={[0, h / 2, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.12, 0.12, h, 8]} />
        <meshBasicMaterial color="#ea4335" transparent opacity={0.35} />
      </mesh>
      <mesh position={[door.x - b.x, ROAD_Y + 0.1, door.z - b.z]} rotation-x={-Math.PI / 2} raycast={() => null}>
        <ringGeometry args={[1.6, 2.4, 32]} />
        <meshBasicMaterial color="#ea4335" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/** Tracks progress along the active route, feeds the HUD and reroutes when the traveller strays. */
function RouteTracker() {
  const timers = useRef({ hud: 0, reroute: 0 });
  useFrame((_, dt) => {
    const st = useStore.getState();
    const { route, mode } = st;
    if (!route || (mode !== "walk" && mode !== "drive")) return;
    const t = timers.current;
    t.hud -= dt;
    t.reroute -= dt;
    if (t.hud > 0) return;
    t.hud = 0.2;

    const origin = currentOrigin(mode);
    const pr = projectOnPolyline(route.points, origin);
    if (pr.dist > 14 && t.reroute <= 0) {
      t.reroute = 1.5;
      st.recomputeRoute();
      return;
    }
    const end = route.points[route.points.length - 1];
    const arrived = dist(origin, end) < (mode === "drive" ? 11 : 4.5);
    const next = route.maneuvers.find((mv) => mv.type !== "depart" && mv.s > pr.s + 1.5) ?? route.maneuvers[route.maneuvers.length - 1];
    const hud = {
      instruction: arrived ? `You have arrived at ${buildingById[route.destinationId]?.name ?? "your destination"}` : next.text,
      maneuver: arrived ? ("arrive" as const) : next.type,
      distanceToManeuver: Math.max(0, Math.round(next.s - pr.s)),
      remaining: Math.max(0, Math.round(route.length - pr.s)),
      arrived,
      speed: 0,
    };
    const prev = st.hud;
    if (
      !prev ||
      prev.instruction !== hud.instruction ||
      prev.distanceToManeuver !== hud.distanceToManeuver ||
      prev.remaining !== hud.remaining ||
      prev.arrived !== hud.arrived
    ) {
      st.setHud(hud);
    }
  });
  return null;
}

export function NavigationSystem() {
  const route = useStore((s) => s.route);
  const destinationId = useStore((s) => s.destinationId);
  return (
    <group>
      {route && <RouteLine route={route} />}
      {destinationId && <DestinationPin id={destinationId} />}
      <RouteTracker />
    </group>
  );
}
