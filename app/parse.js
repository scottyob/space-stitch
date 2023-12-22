// Remove me for playground
import * as chevrotain from "chevrotain";

// Example syntax
/*
Rnd 1: sc
Rnd 2-3: [sc, inc] x 6 (18 sts)
Rnd 4: sc
*/

// ----------------- lexer -----------------
const createToken = chevrotain.createToken;
const Lexer = chevrotain.Lexer;
const EmbeddedActionsParser = chevrotain.EmbeddedActionsParser;

const RndKeyword = createToken({
  name: "RndKeyword",
  pattern: /Rnd/,
});

// using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
// AdditionOperator defines a Tokens hierarchy but only leafs in this hierarchy
// define actual Tokens that can appear in the text
const InstructionOperator = createToken({
  name: "InstructionOperator",
  pattern: Lexer.NA,
});
const Sc = createToken({
  name: "sc",
  pattern: /sc/,
  categories: InstructionOperator,
});
const Inc = createToken({
  name: "inc",
  pattern: /inc/,
  categories: InstructionOperator,
});
const Dec = createToken({
  name: "dec",
  pattern: /dec/,
  categories: InstructionOperator,
});

const Colon = createToken({
  name: "Colon",
  pattern: /\:/,
});

const Dash = createToken({
  name: "Dash",
  pattern: /\-/,
});

const Multiplication = createToken({
  name: "Multiplication",
  pattern: /x/,
});

const LParen = createToken({ name: "LParen", pattern: /\[/ });
const RParen = createToken({ name: "RParen", pattern: /\]/ });
const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /[1-9]\d*/,
});
const Return = createToken({
  name: "Return",
  pattern: /\n/,
});
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});
const Comma = createToken({
  name: "Comma",
  pattern: /\,/,
  group: Lexer.SKIPPED,
});
const Comment = createToken({
  name: "Comment",
  pattern: /\(.+\)/,
  group: Lexer.SKIPPED,
});

// whitespace is normally very common so it is placed first to speed up the lexer
const allTokens = [
  Comment,
  RndKeyword,
  WhiteSpace,
  LParen,
  RParen,
  NumberLiteral,
  Multiplication,
  Colon,
  Inc,
  Sc,
  Dec,
  InstructionOperator,
  Dash,
  Comma,
];
const PatternLexer = new Lexer(allTokens);

// ----------------------- PARSER ----------------------------------------
class PatternParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);

    const $ = this;

    $.RULE("pattern", () => {
      let ret = {};

      // Parse all the rounds we have into an object of Rnd number to instruction list
      $.MANY(() => {
        let child = $.SUBRULE($.rnd);
        child = { ...child };
        delete child["description"];

        ret = { ...ret, ...child };
      });

      // Add helpful notes for the round number
      // and build a list of sequences to return
      const sequences = [];
      let sequenceNum = 1;
      const rounds = Object.keys(ret);
      const totalRounds = rounds.length;
      rounds.forEach((r) => {
        for (let i = 0; i < ret[r].length; i++) {
          const seqObj = {
            ...ret[r][i],
            sequenceNum: sequenceNum++,
          };
          seqObj.notes = [`Round: ${r} of ${totalRounds}`, ...seqObj.notes];
          sequences.push(seqObj);
        }

        if (sequences.length == 0) {
          return;
        }
        sequences[sequences.length - 1].annotations = [
          ...sequences[sequences.length - 1].annotations,
          "EndOfRound",
        ];
      });

      return sequences;
    });

    $.RULE("rnd", () => {
      // A single round (line), may contain multiple rounds.
      // Return a map of round to instruction set.
      $.CONSUME(RndKeyword);
      const roundItems = Array.from($.SUBRULE($.RndNumber));
      $.CONSUME2(Colon);

      let instructions = $.SUBRULE2($.atomicExpression);

      return Object.fromEntries(roundItems.map((r) => [r, instructions]));
    });

    $.RULE("RndNumber", () => {
      // Extract round numbers.  ex "1" or "1-3".
      // Return a list of rounds included.
      const ret = [];
      const lower = Number.parseInt($.CONSUME(NumberLiteral).image, 10);
      let upper = lower;
      $.OPTION(() => {
        $.CONSUME2(Dash);
        upper = Number.parseInt($.CONSUME3(NumberLiteral).image, 10);
      });

      // Calculate the ranges between the lower and upper
      for (var i = lower; i <= upper; i++) {
        ret.push(i);
      }
      return ret;
    });

    $.RULE("instruction", () => {
      // An instruction (like "2 sc") has
      // should return:
      // {
      //   "instruction": "sc",
      //   "notes": ["instruction 1 of 2"]
      //   "instructionRepeat": "1 of 2",
      // }

      // Parse the instruction and instruction repeat count
      let instructions = [];
      let times = 1;
      let rpt = undefined;
      $.OPTION(() => {
        rpt = $.CONSUME(NumberLiteral);
        times = Number.parseInt(rpt.image, 10) || 1;
      });
      let op = $.CONSUME2(InstructionOperator);

      // Build the objects, with information of it's position in the pattern
      for (let i = 1; i <= times; i++) {
        // Build an object to insert
        const obj = {
          instruction: op.image,
          notes: [],
          position: {
            line: op.startLine,
            startCol: rpt?.startColumn ?? op.startColumn,
            endCol: op.endColumn,
          },
          annotations: [],
        };

        if (times > 1) {
          obj.notes.push(`Instruction: ${i} of ${times}`);
        }

        // Some instructions require multiple instructions
        let objs = [];
        switch (op.image) {
          case "inc":
            objs = [
              { ...obj, instruction: "inc1" },
              { ...obj, instruction: "inc2" },
            ];
            break;
          default:
            objs = [obj];
        }

        instructions.push(...objs);
      }
      return instructions;
    });

    $.RULE("atomicExpression", () => {
      let instructions = [];
      $.MANY(() => {
        instructions.push(
          $.OR([
            { ALT: () => $.SUBRULE($.instruction) },
            { ALT: () => $.SUBRULE($.parenthesisExpression) },
          ]),
        );
      });
      return instructions.flat();
    });

    $.RULE("parenthesisExpression", () => {
      // The only reason we'd want parenthesis is for multiplication after
      // right now.  So this can just go in here without worrying about
      // multiplying things.

      $.CONSUME(LParen);
      let expressions = $.SUBRULE($.atomicExpression);
      $.CONSUME2(RParen);

      let multiplication = 1;
      $.OPTION(() => {
        $.CONSUME3(Multiplication);
        multiplication =
          Number.parseInt($.CONSUME4(NumberLiteral).image, 10) || 1;
      });

      if (expressions.length > 0) {
        expressions[expressions.length - 1].annotations = [
          "EndOfGroup",
          ...expressions[expressions.length - 1].annotations,
        ];
      }

      // Short circuit if no multiplications
      if (multiplication == 1) {
        return expressions;
      }

      // Build a list of instructions to return, adding our notes of
      // multiplication number to them
      let ret = [];
      for (let i = 1; i <= multiplication; i++) {
        expressions.forEach((e) => {
          ret.push({
            ...e,
            notes: [`Repeat: ${i} of ${multiplication}`, ...e.notes],
            annotations: ["Grp", ...e.annotations]
          });
        });
      }

      return ret;
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis();
  }
}

// For playground
(function calculatorExample() {
  // for the playground to work the returned object must contain these fields
  return {
    lexer: PatternLexer,
    parser: PatternParser,
    defaultRule: "pattern",
  };
})();

// Remove me for playground
export { PatternLexer, PatternParser };
