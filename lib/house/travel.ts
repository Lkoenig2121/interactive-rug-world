import { useStore } from "../store";
import { housePlaceAtPoint, placeById, placeCenter, type Portal } from "./doors";

/** Follow a doorway arrow: enter that room, or step outside. */
export function travelPortal(p: Portal) {
  const s = useStore.getState();
  if (p.outside) {
    if (s.mode !== "house") s.goOutside();
    return;
  }
  const dest = (p.toId ? placeById(p.toId) : null) ?? housePlaceAtPoint(p.to);
  if (!dest) {
    if (s.mode !== "house") s.goOutside();
    return;
  }
  s.lookRoom(placeCenter(dest));
}
