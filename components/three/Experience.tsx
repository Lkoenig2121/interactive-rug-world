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
import { DayNight } from "./explore/DayNight";
import { Passages } from "./explore/Passages";
import { Rides } from "./explore/Rides";
import { Baggage } from "./explore/Baggage";
import { ClawMachine } from "./explore/ClawMachine";
import { Incinerator } from "./explore/Incinerator";
import { Rooftops } from "./explore/Rooftops";
import { Sewer } from "./explore/Sewer";
import { SkyDome } from "./explore/SkyDome";
import { Stars } from "./explore/Stars";
import { Sunnyside } from "./explore/Sunnyside";
import { FriendShelf, Friends } from "./explore/Friends";
import { Neighbors } from "./explore/Neighbors";
import { Traffic } from "./explore/Traffic";
import { Weather } from "./explore/Weather";
import { WorldEvents } from "./explore/WorldEvents";
import { HouseExterior } from "./house/HouseExterior";
import { HouseInterior } from "./house/HouseInterior";
import { Neighborhood, Sky } from "./house/Neighborhood";
import { InteriorScene } from "./InteriorScene";
import { MapCameraControls } from "./MapCameraControls";
import { MapLabels } from "./MapLabels";
import { NavigationSystem } from "./NavigationSystem";
import { RoomLighting, RoomScene } from "./RoomScene";
import { RugScene } from "./RugScene";
import { SpaceLevel } from "./space/SpaceLevel";
import { SpawnPicker } from "./toys/SpawnPicker";
import { Toy } from "./toys/Toy";
import { ToyController } from "./toys/ToyController";
import { TownRoute } from "./town/TownRoute";
import { MissionWorld } from "./town/MissionWorld";
import { ToyStoryTown } from "./town/ToyStoryTown";
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
  const inSpace = useStore((s) => s.inSpace);
  const showHouse = (mode === "room" || mode === "house" || mode === "toy" || mode === "transition") && !inSpace;
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
        if (s.mode === "room" || s.mode === "overhead" || s.mode === "house" || s.mode === "toy") s.select(null);
      }}
    >
      <color attach="background" args={["#cfe3f0"]} />
      <fog attach="fog" args={["#d9e9f3", 8000, 90000]} />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <SceneEnvironment />
      </Suspense>

      <group visible={mode !== "interior"}>
        <RoomLighting />
        <group visible={!inSpace}>
          <RoomScene />
          <FriendShelf />
          <RugScene />
          <NavigationSystem />
          <MapLabels />
        </group>
        {/* The rest of the house and the suburb are only drawn when they can be seen. */}
        <group visible={showHouse}>
          <Sky />
          <HouseInterior />
          <HouseExterior />
          <Neighborhood />
          <ToyStoryTown />
          <MissionWorld />
          <TownRoute />
          <Stars />
          <SkyDome />
          <Passages />
          <Rides />
          <WorldEvents />
          <Traffic />
          <Neighbors />
          <Weather />
          <Friends />
          <Sunnyside />
          <Sewer />
          <Baggage />
          <ClawMachine />
          <Incinerator />
          <Rooftops />
        </group>
        {inSpace && <SpaceLevel />}
        <Toy />
      </group>
      <DayNight />

      {mode === "interior" && <InteriorScene />}

      <CameraTransition />
      {(mode === "room" || mode === "overhead" || mode === "house") && <MapCameraControls key={mode} variant={mode} />}
      {mode === "walk" && (
        <WalkingController pose={runtime.player} colliders={worldColliders} findInteraction={worldWalkInteraction} />
      )}
      {mode === "drive" && <DrivingController />}
      {mode === "toy" && <ToyController />}
      <SpawnPicker />
    </Canvas>
  );
}
