// src/types.ts
export interface PatternSequence {
  sequenceNum: number;
  instruction: string;
  notes: string[];
  position: {
    line: number;
    startCol: number;
    endCol: number;
  };
  annotations: ("EndOfRound" | "EndOfGroup")[];
}

export interface Pattern {
  currentSeq: number;
  pattern: string;
}

export enum ProgressMode {
  Stitch = "stitch",
  Group = "group",
  Round = "round",
}

export interface AppStorage {
  patterns: { [name: string]: Pattern }; 
  progressMode: ProgressMode;
}

export const DefaultAppState: AppStorage = {
  patterns: {
    "Test Pattern 1 (rounds and comments)": {
      currentSeq: 0,
      pattern: "Rnd 1-3: 2 sc\nRnd 4: [sc inc] x 6 (some comment)"
    }
  },
  progressMode: ProgressMode.Stitch
};
