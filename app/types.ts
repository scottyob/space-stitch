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
