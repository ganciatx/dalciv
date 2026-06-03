/** Time Timer MOD–style colorways (frame, face, disk, markings). */

export type ThemeFamily = "classic" | "mod-home" | "mod-metallic" | "mod-sandstone";

export interface TimerTheme {
  id: string;
  name: string;
  family: ThemeFamily;
  familyLabel: string;
  frame: string;
  frameRing: string;
  face: string;
  disk: string;
  marks: string;
  center: string;
  centerDigits: string;
  centerCaption: string;
  lensHighlight: string;
  lensEdge: string;
}

export const TIMER_THEMES: TimerTheme[] = [
  {
    id: "classic",
    name: "Classic",
    family: "classic",
    familyLabel: "Original",
    frame: "#1a1a1a",
    frameRing: "#2b2b2b",
    face: "#f5f4f0",
    disk: "#d62828",
    marks: "#2a2a2a",
    center: "rgba(245, 244, 240, 0.96)",
    centerDigits: "#1a1a1a",
    centerCaption: "#5c5a55",
    lensHighlight: "rgba(255, 255, 255, 0.35)",
    lensEdge: "rgba(0, 0, 0, 0.12)",
  },
  {
    id: "mint-green",
    name: "Mint & forest",
    family: "mod-home",
    familyLabel: "MOD · Home",
    frame: "#9fd4b8",
    frameRing: "#7fb89a",
    face: "#f7f6f2",
    disk: "#1b5e3b",
    marks: "#2a2a2a",
    center: "rgba(247, 246, 242, 0.96)",
    centerDigits: "#1a1a1a",
    centerCaption: "#5c5a55",
    lensHighlight: "rgba(255, 255, 255, 0.4)",
    lensEdge: "rgba(0, 0, 0, 0.1)",
  },
  {
    id: "coral-red",
    name: "Coral & red",
    family: "mod-home",
    familyLabel: "MOD · Home",
    frame: "#f2a89a",
    frameRing: "#e08a7a",
    face: "#f7f6f2",
    disk: "#e63946",
    marks: "#2a2a2a",
    center: "rgba(247, 246, 242, 0.96)",
    centerDigits: "#1a1a1a",
    centerCaption: "#5c5a55",
    lensHighlight: "rgba(255, 255, 255, 0.4)",
    lensEdge: "rgba(0, 0, 0, 0.1)",
  },
  {
    id: "blush-pink",
    name: "Blush & magenta",
    family: "mod-home",
    familyLabel: "MOD · Home",
    frame: "#f4b8d4",
    frameRing: "#e89abc",
    face: "#f7f6f2",
    disk: "#c2185b",
    marks: "#2a2a2a",
    center: "rgba(247, 246, 242, 0.96)",
    centerDigits: "#1a1a1a",
    centerCaption: "#5c5a55",
    lensHighlight: "rgba(255, 255, 255, 0.4)",
    lensEdge: "rgba(0, 0, 0, 0.1)",
  },
  {
    id: "sky-teal",
    name: "Sky & teal",
    family: "mod-home",
    familyLabel: "MOD · Home",
    frame: "#7ec8e3",
    frameRing: "#5eb0d0",
    face: "#f7f6f2",
    disk: "#1a4d5c",
    marks: "#2a2a2a",
    center: "rgba(247, 246, 242, 0.96)",
    centerDigits: "#1a1a1a",
    centerCaption: "#5c5a55",
    lensHighlight: "rgba(255, 255, 255, 0.4)",
    lensEdge: "rgba(0, 0, 0, 0.1)",
  },
  {
    id: "white-burgundy",
    name: "White & burgundy",
    family: "mod-home",
    familyLabel: "MOD · Home",
    frame: "#eceae4",
    frameRing: "#d8d4cc",
    face: "#f7f6f2",
    disk: "#6b1c3a",
    marks: "#2a2a2a",
    center: "rgba(247, 246, 242, 0.96)",
    centerDigits: "#1a1a1a",
    centerCaption: "#5c5a55",
    lensHighlight: "rgba(255, 255, 255, 0.45)",
    lensEdge: "rgba(0, 0, 0, 0.1)",
  },
  {
    id: "grey-slate",
    name: "Grey & slate",
    family: "mod-home",
    familyLabel: "MOD · Home",
    frame: "#a8a8a8",
    frameRing: "#8e8e8e",
    face: "#f7f6f2",
    disk: "#37474f",
    marks: "#2a2a2a",
    center: "rgba(247, 246, 242, 0.96)",
    centerDigits: "#1a1a1a",
    centerCaption: "#5c5a55",
    lensHighlight: "rgba(255, 255, 255, 0.4)",
    lensEdge: "rgba(0, 0, 0, 0.1)",
  },
  {
    id: "forest-gold",
    name: "Forest & gold",
    family: "mod-metallic",
    familyLabel: "MOD · Metallic",
    frame: "#1b4332",
    frameRing: "#163728",
    face: "#1b4332",
    disk: "#d4a72c",
    marks: "#f5f4f0",
    center: "rgba(27, 67, 50, 0.92)",
    centerDigits: "#ffffff",
    centerCaption: "rgba(255, 255, 255, 0.72)",
    lensHighlight: "rgba(255, 255, 255, 0.22)",
    lensEdge: "rgba(255, 255, 255, 0.12)",
  },
  {
    id: "navy-gold",
    name: "Navy & gold",
    family: "mod-metallic",
    familyLabel: "MOD · Metallic",
    frame: "#1a2744",
    frameRing: "#141f33",
    face: "#1a2744",
    disk: "#d4a72c",
    marks: "#f5f4f0",
    center: "rgba(26, 39, 68, 0.92)",
    centerDigits: "#ffffff",
    centerCaption: "rgba(255, 255, 255, 0.72)",
    lensHighlight: "rgba(255, 255, 255, 0.22)",
    lensEdge: "rgba(255, 255, 255, 0.12)",
  },
  {
    id: "navy-lavender",
    name: "Navy & lavender",
    family: "mod-metallic",
    familyLabel: "MOD · Metallic",
    frame: "#1a2744",
    frameRing: "#141f33",
    face: "#1a2744",
    disk: "#b8a9c9",
    marks: "#f5f4f0",
    center: "rgba(26, 39, 68, 0.92)",
    centerDigits: "#ffffff",
    centerCaption: "rgba(255, 255, 255, 0.72)",
    lensHighlight: "rgba(255, 255, 255, 0.22)",
    lensEdge: "rgba(255, 255, 255, 0.12)",
  },
  {
    id: "charcoal-rose",
    name: "Charcoal & rose",
    family: "mod-metallic",
    familyLabel: "MOD · Metallic",
    frame: "#2d2d2d",
    frameRing: "#222222",
    face: "#2d2d2d",
    disk: "#c9a9a6",
    marks: "#f5f4f0",
    center: "rgba(45, 45, 45, 0.92)",
    centerDigits: "#ffffff",
    centerCaption: "rgba(255, 255, 255, 0.72)",
    lensHighlight: "rgba(255, 255, 255, 0.2)",
    lensEdge: "rgba(255, 255, 255, 0.1)",
  },
  {
    id: "sandstone-blue",
    name: "Sandstone & sky",
    family: "mod-sandstone",
    familyLabel: "MOD · Sandstone",
    frame: "#d4c4b0",
    frameRing: "#c4b49c",
    face: "#1a2744",
    disk: "#7ec8e3",
    marks: "#f5f4f0",
    center: "rgba(26, 39, 68, 0.9)",
    centerDigits: "#ffffff",
    centerCaption: "rgba(255, 255, 255, 0.72)",
    lensHighlight: "rgba(255, 255, 255, 0.22)",
    lensEdge: "rgba(255, 255, 255, 0.12)",
  },
  {
    id: "sandstone-green",
    name: "Sandstone & sage",
    family: "mod-sandstone",
    familyLabel: "MOD · Sandstone",
    frame: "#d4c4b0",
    frameRing: "#c4b49c",
    face: "#1b4332",
    disk: "#a8d5ba",
    marks: "#f5f4f0",
    center: "rgba(27, 67, 50, 0.9)",
    centerDigits: "#ffffff",
    centerCaption: "rgba(255, 255, 255, 0.72)",
    lensHighlight: "rgba(255, 255, 255, 0.22)",
    lensEdge: "rgba(255, 255, 255, 0.12)",
  },
];

export const DEFAULT_THEME_ID = "classic";

const themeById = new Map(TIMER_THEMES.map((t) => [t.id, t]));

export function getTheme(id: string): TimerTheme {
  return themeById.get(id) ?? themeById.get(DEFAULT_THEME_ID)!;
}

/** Groups for the picker UI (preserves catalog order). */
export function themePickerGroups(): { label: string; themes: TimerTheme[] }[] {
  const order: ThemeFamily[] = [
    "classic",
    "mod-home",
    "mod-metallic",
    "mod-sandstone",
  ];
  return order.map((family) => {
    const themes = TIMER_THEMES.filter((t) => t.family === family);
    return { label: themes[0]?.familyLabel ?? family, themes };
  });
}
