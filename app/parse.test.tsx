import { expect, test } from "vitest";
import { PatternLexer, PatternParser } from "./parse";
import { PatternSequence } from "./types";

test("Test parsing tokens", () => {
  const testStr = "Rnd 1: sc, 2 inc";
  const lexer = PatternLexer;
  const parser = new PatternParser();
  const lexingResult = lexer.tokenize(testStr);
  parser.input = lexingResult.tokens;

  // @ts-expect-error
  const seqs = parser.pattern() as PatternSequence[];

  //expect(seqs, "Expect three tokens").toHaveLength(3);
  expect(
    seqs.map((s) => s.instruction),
    "Expected sc, inc1, inc2",
  ).toEqual(["sc", "inc1", "inc2", "inc1", "inc2"]);
});
