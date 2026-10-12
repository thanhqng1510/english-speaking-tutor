export type DatasetSet = "tuning" | "evaluation";

export type ParagraphCategory = "exam" | "everyday" | "learner";

export type LengthTier = "short" | "medium" | "long" | "ceiling";

export type ProsodicChallengeTag =
  | "long-subject"
  | "compound-predicate"
  | "numbers-dates"
  | "dialogue"
  | "list"
  | "hesitation"
  | (string & {});

export interface PracticeParagraph {
  /** Unique paragraph identifier (e.g. 'tune-exam-01', 'eval-learner-08') */
  readonly id: string;
  /** Short scenario title or description */
  readonly title: string;
  /** Spoken text of the practice paragraph */
  readonly text: string;
  /** Dataset partition: 'tuning' (prompt development & unit test fixtures) or 'evaluation' (held-out model comparison) */
  readonly set: DatasetSet;
  /** Speaking context category: 'exam', 'everyday', or 'learner' */
  readonly category: ParagraphCategory;
  /** Length tier: 'short' (80-180), 'medium' (200-350), 'long' (400-500), 'ceiling' (1,000-1,200) */
  readonly lengthTier: LengthTier;
  /** Deliberate spoken prosodic challenges targeted by this paragraph */
  readonly tags: readonly ProsodicChallengeTag[];
  /** Exact character count (`text.length`) */
  readonly characterCount: number;
  /** Word count (`text.trim().split(/\s+/).length`) */
  readonly wordCount: number;
}

export interface ParagraphFilter {
  readonly set?: DatasetSet;
  readonly category?: ParagraphCategory;
  readonly lengthTier?: LengthTier;
  /** Single challenge tag filter (matches if paragraph contains this tag) */
  readonly tag?: ProsodicChallengeTag;
  /** Multi-tag filter (matches if paragraph contains all specified tags) */
  readonly tags?: readonly ProsodicChallengeTag[];
  readonly minCharacters?: number;
  readonly maxCharacters?: number;
  readonly minWords?: number;
  readonly maxWords?: number;
}

export interface DatasetSummary {
  readonly totalCount: number;
  readonly bySet: Record<DatasetSet, number>;
  readonly byCategory: Record<ParagraphCategory, number>;
  readonly byTier: Record<LengthTier, number>;
  readonly byTag: Record<string, number>;
}
