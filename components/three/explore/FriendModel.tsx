"use client";

import type { Friend } from "@/lib/explore/friends";

const M = ({ c, r = 0.55, m = 0 }: { c: string; r?: number; m?: number }) => <meshStandardMaterial color={c} roughness={r} metalness={m} />;

function Eyes({ y, z, gap = 2.6, r = 1.2 }: { y: number; z: number; gap?: number; r?: number }) {
  return (
    <>
      {[-gap, gap].map((x) => (
        <mesh key={x} position={[x, y, z]}>
          <sphereGeometry args={[r, 8, 6]} />
          <M c="#1d1d1f" r={0.2} />
        </mesh>
      ))}
    </>
  );
}

/** A small recruitable toy (about 20–25 cm tall, facing +z) built from simple shapes. */
export function FriendModel({ friend }: { friend: Friend }) {
  const { kind, color: c, accent: a } = friend;
  switch (kind) {
    case "teddy":
      return (
        <group>
          <mesh position={[0, 8, 0]} castShadow>
            <sphereGeometry args={[7, 14, 12]} />
            <M c={c} r={1} />
          </mesh>
          <mesh position={[0, 18, 0]} castShadow>
            <sphereGeometry args={[5.5, 14, 12]} />
            <M c={c} r={1} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 4, 22.5, 0]}>
              <sphereGeometry args={[2, 8, 6]} />
              <M c={c} r={1} />
            </mesh>
          ))}
          <mesh position={[0, 16.5, 4.8]}>
            <sphereGeometry args={[2, 8, 6]} />
            <M c="#e9c9a0" r={1} />
          </mesh>
          <Eyes y={19.5} z={4.6} gap={2} r={0.9} />
          <mesh position={[0, 13, 3]} rotation-x={0.3}>
            <boxGeometry args={[6, 1.6, 2]} />
            <M c={a} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`a${s}`} position={[s * 7, 9, 1]} castShadow>
              <sphereGeometry args={[2.4, 8, 6]} />
              <M c={c} r={1} />
            </mesh>
          ))}
        </group>
      );
    case "duck":
      return (
        <group>
          <mesh position={[0, 6, 0]} scale={[1, 0.8, 1.3]} castShadow>
            <sphereGeometry args={[7, 16, 12]} />
            <M c={c} r={0.3} />
          </mesh>
          <mesh position={[0, 14, 3]} castShadow>
            <sphereGeometry args={[4.5, 14, 12]} />
            <M c={c} r={0.3} />
          </mesh>
          <mesh position={[0, 13.5, 8]} scale={[1.2, 0.5, 1]}>
            <sphereGeometry args={[2.4, 10, 8]} />
            <M c={a} r={0.3} />
          </mesh>
          <Eyes y={15.5} z={6.6} gap={2} r={0.8} />
        </group>
      );
    case "dino":
      return (
        <group>
          <mesh position={[0, 9, 0]} scale={[1, 1.1, 1.3]} castShadow>
            <sphereGeometry args={[6, 14, 12]} />
            <M c={c} />
          </mesh>
          <mesh position={[0, 18, 5]} castShadow>
            <boxGeometry args={[7, 6, 9]} />
            <M c={c} />
          </mesh>
          <Eyes y={20} z={8} gap={2.2} r={0.8} />
          <mesh position={[0, 8, -9]} rotation-x={-1.1}>
            <coneGeometry args={[3, 10, 8]} />
            <M c={c} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 15.5 - i * 2, -1 - i * 3.5]}>
              <coneGeometry args={[1.5, 3, 4]} />
              <M c={a} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 3.5, 2, 1]}>
              <boxGeometry args={[3, 4, 4]} />
              <M c={c} />
            </mesh>
          ))}
        </group>
      );
    case "rocket":
      return (
        <group>
          <mesh position={[0, 12, 0]} castShadow>
            <cylinderGeometry args={[4, 4, 16, 14]} />
            <M c={c} r={0.3} m={0.3} />
          </mesh>
          <mesh position={[0, 23, 0]} castShadow>
            <coneGeometry args={[4, 7, 14]} />
            <M c={a} r={0.3} />
          </mesh>
          <mesh position={[0, 15, 3.8]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[1.8, 1.8, 0.8, 12]} />
            <M c="#8ecae6" r={0.1} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.sin((i * Math.PI * 2) / 3) * 4.5, 5, Math.cos((i * Math.PI * 2) / 3) * 4.5]} rotation-y={(i * Math.PI * 2) / 3}>
              <boxGeometry args={[0.8, 7, 4]} />
              <M c={a} />
            </mesh>
          ))}
        </group>
      );
    case "soldier":
      return (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.8, 4.5, 0]}>
              <boxGeometry args={[2.6, 9, 3]} />
              <M c={c} />
            </mesh>
          ))}
          <mesh position={[0, 13, 0]} castShadow>
            <boxGeometry args={[7, 8, 4]} />
            <M c={c} />
          </mesh>
          <mesh position={[0, 20, 0]}>
            <sphereGeometry args={[3, 12, 10]} />
            <M c={c} />
          </mesh>
          <mesh position={[0, 21.5, 0]} scale={[1.15, 0.6, 1.15]}>
            <sphereGeometry args={[3.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={a} />
          </mesh>
          <mesh position={[4.5, 14, 2]} rotation-x={-0.4}>
            <boxGeometry args={[1.2, 1.2, 10]} />
            <M c={a} />
          </mesh>
          <Eyes y={20.3} z={2.8} gap={1.1} r={0.5} />
        </group>
      );
    case "bunny":
      return (
        <group>
          <mesh position={[0, 7, 0]} castShadow>
            <sphereGeometry args={[6.5, 14, 12]} />
            <M c={c} r={1} />
          </mesh>
          <mesh position={[0, 16, 1]} castShadow>
            <sphereGeometry args={[5, 14, 12]} />
            <M c={c} r={1} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 2.4, 21, 0]} rotation-z={s * -0.25}>
              <mesh position={[0, 5, 0]} scale={[1, 1, 0.5]}>
                <capsuleGeometry args={[1.6, 7, 4, 8]} />
                <M c={c} r={1} />
              </mesh>
              <mesh position={[0, 5, 0.6]} scale={[0.6, 0.8, 0.3]}>
                <capsuleGeometry args={[1.6, 7, 4, 8]} />
                <M c={a} r={1} />
              </mesh>
            </group>
          ))}
          <Eyes y={17} z={5} gap={1.8} r={0.8} />
          <mesh position={[0, 15.2, 5.3]}>
            <sphereGeometry args={[0.8, 8, 6]} />
            <M c={a} />
          </mesh>
        </group>
      );
    case "car":
      return (
        <group>
          <mesh position={[0, 4.5, 0]} castShadow>
            <boxGeometry args={[9, 4, 18]} />
            <M c={c} r={0.25} m={0.2} />
          </mesh>
          <mesh position={[0, 8, -1.5]}>
            <boxGeometry args={[7.5, 3.5, 8]} />
            <M c="#26323d" r={0.1} />
          </mesh>
          <mesh position={[0, 6.6, 0]}>
            <boxGeometry args={[9.2, 0.6, 18.2]} />
            <M c={a} />
          </mesh>
          {[
            [-4.6, 5.5],
            [4.6, 5.5],
            [-4.6, -5.5],
            [4.6, -5.5],
          ].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 2.4, z]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[2.4, 2.4, 1.8, 12]} />
              <M c="#1d1d1f" r={0.8} />
            </mesh>
          ))}
          <Eyes y={7.5} z={2.6} gap={2} r={0.9} />
        </group>
      );
    case "horse":
      return (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 4, 1, 0]} scale={[1, 0.25, 1]}>
              <torusGeometry args={[9, 1, 6, 20, Math.PI]} />
              <M c="#7f4f24" />
            </mesh>
          ))}
          <mesh position={[0, 9, 0]} castShadow>
            <boxGeometry args={[6, 6, 14]} />
            <M c={c} />
          </mesh>
          <mesh position={[0, 15, 7]} rotation-x={-0.4} castShadow>
            <boxGeometry args={[4.5, 9, 5]} />
            <M c={c} />
          </mesh>
          <mesh position={[0, 18, 10]}>
            <boxGeometry args={[4, 4, 6]} />
            <M c={c} />
          </mesh>
          <mesh position={[0, 17, 5]} rotation-x={-0.4}>
            <boxGeometry args={[1.2, 10, 4]} />
            <M c={a} />
          </mesh>
          <Eyes y={19.5} z={11} gap={2.1} r={0.7} />
          {[-1, 1].map((sx) =>
            [-1, 1].map((sz) => (
              <mesh key={`${sx}${sz}`} position={[sx * 2.4, 3.5, sz * 5]}>
                <boxGeometry args={[1.5, 6, 1.5]} />
                <M c={c} />
              </mesh>
            )),
          )}
        </group>
      );
    case "robot":
      return (
        <group>
          <mesh position={[0, 8, 0]} castShadow>
            <boxGeometry args={[11, 11, 8]} />
            <M c={c} r={0.4} m={0.3} />
          </mesh>
          <mesh position={[0, 18, 0]} castShadow>
            <boxGeometry args={[8, 7, 7]} />
            <M c={a} r={0.3} m={0.6} />
          </mesh>
          {[-2, 2].map((x) => (
            <mesh key={x} position={[x, 18.5, 3.6]}>
              <sphereGeometry args={[1.1, 8, 6]} />
              <meshBasicMaterial color="#57ff8f" toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0, 23, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 4, 6]} />
            <M c={a} m={0.6} />
          </mesh>
          <mesh position={[0, 25.5, 0]}>
            <sphereGeometry args={[1, 8, 6]} />
            <M c="#e63946" />
          </mesh>
          <mesh position={[0, 8, -4.6]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[2.4, 0.6, 6, 12]} />
            <M c="#c9a227" m={0.7} r={0.3} />
          </mesh>
        </group>
      );
    case "frog":
      return (
        <group>
          <mesh position={[0, 5, 0]} scale={[1.2, 0.75, 1.1]} castShadow>
            <sphereGeometry args={[6.5, 16, 12]} />
            <M c={c} r={0.35} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 3, 10, 3]}>
                <sphereGeometry args={[2.4, 10, 8]} />
                <M c={a} r={0.3} />
              </mesh>
              <mesh position={[s * 3, 10.3, 5]}>
                <sphereGeometry args={[1.1, 8, 6]} />
                <M c="#1d1d1f" r={0.2} />
              </mesh>
              <mesh position={[s * 6.5, 2, -2]} scale={[1, 0.6, 1.4]}>
                <sphereGeometry args={[2.6, 8, 6]} />
                <M c={c} r={0.35} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 4.5, 6.4]} rotation-z={Math.PI / 2}>
            <torusGeometry args={[2.4, 0.4, 6, 12, Math.PI]} />
            <M c="#1d3d23" />
          </mesh>
        </group>
      );
    case "bendy":
      return (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.8, 5, 0]}>
              <cylinderGeometry args={[1, 1, 10, 6]} />
              <M c={c} />
            </mesh>
          ))}
          <mesh position={[0, 14, 0]} castShadow>
            <boxGeometry args={[6, 9, 4]} />
            <M c={c} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`a${s}`} position={[s * 4.5, 15, 0]} rotation-z={s * 0.9}>
              <cylinderGeometry args={[0.8, 0.8, 8, 6]} />
              <M c={c} />
            </mesh>
          ))}
          <mesh position={[0, 21.5, 0]} castShadow>
            <sphereGeometry args={[3.6, 12, 10]} />
            <M c={a} />
          </mesh>
          <Eyes y={22} z={3.3} gap={1.3} r={0.6} />
        </group>
      );
    case "ball":
      return (
        <group>
          <mesh position={[0, 8, 0]} castShadow>
            <sphereGeometry args={[8, 18, 14]} />
            <M c={c} r={0.3} />
          </mesh>
          <mesh position={[0, 8, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[8.05, 0.9, 6, 24]} />
            <M c={a} r={0.3} />
          </mesh>
          <Eyes y={10.5} z={7.2} gap={2.4} r={1.1} />
          <mesh position={[0, 6.5, 7.5]} rotation-z={Math.PI}>
            <torusGeometry args={[2.4, 0.45, 6, 12, Math.PI]} />
            <M c="#1d1d1f" />
          </mesh>
        </group>
      );
  }
}
