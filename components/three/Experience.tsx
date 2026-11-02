"use client";

import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { worldWalkInteraction } from "@/lib/interactions";
import { roomCameraPose } from "@/lib/three/cameraPoses";
import { runtime } from "@/lib/runtime";
import { useStore } from "@/lib/store";
import { worldColliders } from "@/lib/world/colliders";
import { CameraTransition } from "./CameraTransition";
import { DrivingController } from "./DrivingController";
import { HouseExterior } from "./house/HouseExterior";
import { HouseInterior } from "./house/HouseInterior";
import { Neighborhood, Sky } from "./house/Neighborhood";
import { InteriorScene } from "./InteriorScene";
import { MapCameraControls } from "./MapCameraControls";
import { MapLabels } from "./MapLabels";
import { NavigationSystem } from "./NavigationSystem";
import { RoomLighting, RoomScene } from "./RoomScene";
import { RugScene } from "./RugScene";
import { WalkingController } from "./WalkingController";

function SceneEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#c9b9a2"]} />
      <Lightformer form="rect" intensity={3.2} color="#fff8ec" position={[-150, 150, -255]} scale={[170, 240, 1]} />
      <Lightformer form="rect" intensity={3.2} color="#fff8ec" position={[150, 150, -255]} scale={[170, 240, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#fff0dc" position={[0, 320, 120]} rotation-x={Math.PI / 2} scale={[700, 600, 1]} />
      <Lightformer form="rect" intensity={0.5} color="#f3e6d3" position={[0, 120, 520]} rotation-y={Math.PI} scale={[900, 300, 1]} />
    </Environment>
  );
}

export default function Experience() {
  const mode = useStore((s) => s.mode);
  const showHouse = mode === "room" || mode === "house" || mode === "transition";
  const initial = useMemo(() => roomCameraPose(typeof window === "undefined" ? 1.6 : window.innerWidth / window.innerHeight), []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 42, near: 0.5, far: 120000, position: initial.pos.toArray() as [number, number, number] }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(initial.target);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerMissed={() => {
        const s = useStore.getState();
        if (s.mode === "room" || s.mode === "overhead") s.select(null);
      }}
    >
      <color attach="background" args={["#cfe3f0"]} />
      <fog attach="fog" args={["#d9e9f3", 4000, 42000]} />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <SceneEnvironment />
      </Suspense>

      <group visible={mode !== "interior"}>
        <RoomLighting />
        <RoomScene />
        <RugScene />
        <NavigationSystem />
        <MapLabels />
        {/* The rest of the house and the suburb are only drawn when they can be seen. */}
        <group visible={showHouse}>
          <Sky />
          <HouseInterior />
          <HouseExterior />
          <Neighborhood />
        </group>
      </group>

      {mode === "interior" && <InteriorScene />}

      <CameraTransition />
      {(mode === "room" || mode === "overhead" || mode === "house") && <MapCameraControls key={mode} variant={mode} />}
      {mode === "walk" && (
        <WalkingController pose={runtime.player} colliders={worldColliders} findInteraction={worldWalkInteraction} />
      )}
      {mode === "drive" && <DrivingController />}
    </Canvas>
  );
}
