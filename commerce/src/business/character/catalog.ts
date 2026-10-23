import type { Style } from "@/lib/types";

export const STYLES: { id: Style; name: string; index: number }[] = [
  { id: "3d", name: "3D character", index: 0 },
  { id: "cartoon", name: "Cartoon", index: 1 },
  { id: "anime", name: "Anime", index: 2 },
  { id: "watercolor", name: "Watercolor", index: 3 },
  { id: "fantasy", name: "Fantasy", index: 4 },
  { id: "realistic", name: "Illustration", index: 5 },
];

export const PACKS = {
  expressions: [
    "Happy smile",
    "Thoughtful",
    "Surprised",
    "Confident",
    "Sad",
    "Laughing",
  ],
  views: ["Front view", "Side profile", "Back view"],
  scenes: [
    "A quiet bookshop",
    "A forest trail",
    "A city at golden hour",
    "A cozy creative studio",
  ],
};
