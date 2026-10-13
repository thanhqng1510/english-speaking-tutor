export type PartRole = "normal" | "focus_word";

export interface ChunkPart {
  readonly text: string;
  readonly role: PartRole;
}

export interface Chunk {
  readonly parts: readonly ChunkPart[];
}

export type PracticeSessionStatus = "draft" | "preparing" | "practicing";

export interface PracticeSessionState {
  status: PracticeSessionStatus;
  text: string;
  chunks: readonly Chunk[];
  activeChunkIndex: number;
}

export type PrototypeVariantKey = "FINAL" | "A" | "B" | "C";

export interface VariantDefinition {
  readonly key: PrototypeVariantKey;
  readonly name: string;
  readonly description: string;
}

export const PROTOTYPE_VARIANTS: readonly VariantDefinition[] = [
  {
    key: "FINAL",
    name: "Unified Final",
    description: "Immersive canvas, neutral filling progress bar, right info panel, and sleek bottom ribbon",
  },
  {
    key: "A",
    name: "Teleprompter",
    description: "Centered karaoke teleprompter with depth-of-field dimming",
  },
  {
    key: "B",
    name: "Split Studio",
    description: "Two-column studio with rhythm score list and inspector",
  },
  {
    key: "C",
    name: "Flow Ribbon",
    description: "Document rhythm card stream with docked media ribbon",
  },
];
