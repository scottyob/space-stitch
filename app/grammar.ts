import { CstParser, Lexer, createToken } from "chevrotain";

// Example grammar
//

// Rnd 1: sc
// Rnd 2-3: [sc, inc] x 6 (18 sts)
// Rnd 3: sc

const Rnd = createToken({ name: "Rnd", pattern: /Rnd/ });
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\ +/,
  group: Lexer.SKIPPED,
});
const NumberLiteral = createToken({ name: "NumberLiteral", pattern: /\d+/ });

const allTokens = [
    Rnd,
    WhiteSpace,
    NumberLiteral,
];

const PatternLexer = new Lexer(allTokens);

class PatternParser extends CstParser {
    constructor() {
        super(allTokens);

        const $ = this;
        $.RULE("RndStatement", () => {
          $.SUBRULE($.RndClause);
        });

        $.RULE("RndClause", () => {
          $.CONSUME(Rnd);
          $.CONSUME(NumberLiteral);
        })



        this.performSelfAnalysis();
    }
}

const parserInstance = new PatternParser();

export function Parse(inputText: string) {
  const lexResult = PatternLexer.tokenize(inputText);
  parserInstance.input = lexResult.tokens;
  debugger;

  parserInstance.RndStatement();

}