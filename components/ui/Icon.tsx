import type { SVGProps } from "react";

const PATHS = {
  enter: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  reset: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  expand: "M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3",
  shrink: "M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  walk: "M13 4a1.5 1.5 0 1 0 0-.01M10 21l2-6 3 3v3M9 12l1-4 4 1 2 3 3 1M10 8 7 10v3",
  car: "M5 17h14M6 17v2M18 17v2M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4H3v-4zM3 13h18M7 15h.01M17 15h.01",
  nav: "M3 11l19-9-9 19-2-8-8-2z",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z",
  room: "M3 21V8l9-5 9 5v13M7 21v-6h10v6M3 21h18",
  x: "M18 6 6 18M6 6l12 12",
  pin: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  target: "M12 2v3M12 19v3M2 12h3M19 12h3M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  door: "M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.6v16.4l-8-1.6V6.2a2 2 0 0 1 1.6-2L13 3",
  road: "M4 21 8 3M20 21 16 3M12 4v2M12 10v2M12 16v2",
  layers: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  autopilot: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v6M4.9 16l4.6-2M19.1 16l-4.6-2",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}

const ARROWS: Record<string, string> = {
  straight: "M12 20V5M6 11l6-6 6 6",
  depart: "M12 20V5M6 11l6-6 6 6",
  "slight-left": "M16 20v-6L8 6M8 13V6h7",
  "slight-right": "M8 20v-6l8-8M16 13V6H9",
  left: "M18 20v-8a3 3 0 0 0-3-3H5M9 5 5 9l4 4",
  right: "M6 20v-8a3 3 0 0 1 3-3h10M15 5l4 4-4 4",
  uturn: "M8 20V9a4 4 0 0 1 8 0v4M12 10l4 4 4-4",
  roundabout: "M12 21v-6M12 15a4 4 0 1 1 4-4M16 11V6h-5",
  arrive: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};

export function ManeuverIcon({ type, className = "h-8 w-8" }: { type: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={ARROWS[type] ?? ARROWS.straight} />
    </svg>
  );
}
