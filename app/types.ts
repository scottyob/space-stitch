// src/types.ts
export interface Round {
  id: number;
  instructions: string;
}

// src/types.ts
export interface ProgressStep {
    seq: number;
    round: number;
    instruction: string;
    highlightPosition?: number;
    highlightLength?: number;
  }
