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

export type PrototypeVariantKey = "A" | "B" | "C";

export interface VariantDefinition {
  readonly key: PrototypeVariantKey;
  readonly name: string;
  readonly description: string;
}

export const PROTOTYPE_VARIANTS: readonly VariantDefinition[] = [
  {
    key: "A",
    name: "Teleprompter",
    description: "Centered karaoke teleprompter with depth-of-field dimming and glowing focus pill",
  },
  {
    key: "B",
    name: "Split Studio",
    description: "Two-column studio with rhythm score list and dedicated Focus Inspector card",
  },
  {
    key: "C",
    name: "Flow Ribbon",
    description: "Document rhythm card stream with docked bottom media ribbon",
  },
];
