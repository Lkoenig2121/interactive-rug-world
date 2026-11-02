"use client";

import { useEffect, useMemo } from "react";
import { EXT_Y } from "@/lib/house/layout";
import { useStore } from "@/lib/store";
import { landmarkById } from "@/lib/town/config";
import { ribbonGeometry } from "@/lib/three/ribbon";

/** Blue road-following path to the chosen town destination, plus a pin at the end. */
export function TownRoute() {
  const points = useStore((s) => s.townRoute?.points);
  const destId = useStore((s) => s.townDestination);
  const geom = useMemo(() => {
    if (!points || points.length < 2) return null;
    return ribbonGeometry(points, 90, EXT_Y + 6);
  }, [points]);
  useEffect(() => () => geom?.dispose(), [geom]);
  const dest = destId ? landmarkById[destId] : null;
  if (!geom || !dest) return null;
  const end = points![points!.length - 1];
  return (
    <group>
      <mesh geometry={geom} raycast={() => null}>
        <meshBasicMaterial color="#2563eb" transparent opacity={0.72} depthWrite={false} />
      </mesh>
      <mesh position={[end.x, EXT_Y + 160, end.z]} rotation-x={Math.PI} raycast={() => null}>
        <coneGeometry args={[40, 90, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[end.x, EXT_Y + 40, end.z]} raycast={() => null}>
        <sphereGeometry args={[22, 12, 10]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}
