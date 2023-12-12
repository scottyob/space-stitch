"use client";

import { useEffect, useRef, useState } from "react";
import * as PatternParse from "../../parse";
import { PatternSequence } from "../../types";
import { Pattern } from "@prisma/client";
import { useLocalStorage } from "@uidotdev/usehooks";
// @ts-ignore
import useKeypress from "react-use-keypress";

export default function Player(props: { patternId: string; pattern: Pattern }) {
  let [seqNum, setSeqNum] = useLocalStorage(props.patternId, 1);

  const tableRefs = useRef(new Array());
  const instructionRefs = useRef(new Array());

  const pattern = props.pattern;

  // Parse the instructions
  const lexer = PatternParse.PatternLexer;
  const parser = new PatternParse.PatternParser();
  const lexingResult = lexer.tokenize(pattern.pattern);
  parser.input = lexingResult.tokens;
  // @ts-expect-error
  const seqs = parser.pattern() as PatternSequence[];
  const seq = seqs[seqNum - 1] ?? seqs[0];
  seqNum = seq.sequenceNum;

  // Build a list of instructions to show
  const lineClassStyles = {
    activeLine: "text-gray-900 text-lg",
    unactiveNear: "text-gray-400 text",
    unactiveFar: "text-gray-200 text",
    activeInstruction: "font-bold text-xl",
  };

  //Build a list instructions to show
  const currentLine = seq.position.line - 1;
  const instructionLines = pattern.pattern.split("\n");
  let instructions = instructionLines.map((i, index) => {
    const lineDiff = Math.abs(index - currentLine);
    let style = lineClassStyles.unactiveFar;
    let content = <>{i}</>;

    if (lineDiff == 0) {
      // This is the selected line.  Make sure to highlight the
      // appropriate elements
      style = lineClassStyles.activeLine;
      var before = i.substring(0, seq.position.startCol - 1);
      var highlighted = i.substring(
        seq.position.startCol - 1,
        seq.position.endCol,
      );
      var after = i.substring(seq.position.endCol);
      content = (
        <>
          <span>{before}</span>
          <span className={lineClassStyles.activeInstruction}>
            {highlighted}
          </span>
          <span>{after}</span>
        </>
      );
    } else if (lineDiff == 1) {
      style = lineClassStyles.unactiveNear;
    }

    return (
      <div
        key={index}
        className={style}
        ref={(e) => (instructionRefs.current[index] = e)}
      >
        {content}
      </div>
    );
  });

  const percentage = (seqNum / seqs.length) * 100;

  // Render the table
  let tables: React.ReactNode[] = [];
  let tableHead: React.ReactNode[] = [];
  let tableBody: React.ReactNode[] = [];

  seqs.forEach((s, index) => {
    const tableStyles = {
      all: "min-w-[40px] min-h-[40px] text-center align-middle border-r",
      selected: "font-extrabold text-black",
      unselected: "text-gray-600",
      endOfGroup: "border-r-2 border-r-gray-300",
    };

    let tableStyle =
      tableStyles.all +
      " " +
      (seqNum == s.sequenceNum ? tableStyles.selected : tableStyles.unselected);

    if (s.annotations.indexOf("EndOfGroup") !== -1) {
      tableStyle += " " + tableStyles.endOfGroup;
    }

    tableHead.push(
      <th
        key={s.sequenceNum}
        className={tableStyle}
        ref={(e) => (tableRefs.current[index] = e)}
      >
        {s.instruction}
      </th>,
    );
    tableBody.push(
      <td key={s.sequenceNum} className={tableStyle}>
        {s.sequenceNum < seqNum ? "✅" : "."}
      </td>,
    );

    if (s.annotations.indexOf("EndOfRound") !== -1) {
      // We're at the end of the round, Add a table
      tables.push(
        <table
          key={tables.length}
          className="table-fixed border border-gray-300 divide-x m-2 h-8"
        >
          <thead>
            <tr>{tableHead}</tr>
          </thead>
          <tbody>
            <tr>{tableBody}</tr>
          </tbody>
        </table>,
      );
      tableHead = [];
      tableBody = [];
    }
  });

  useEffect(() => {
    tableRefs.current[seqNum - 1].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    instructionRefs.current[seqs[seqNum - 1].position.line - 1].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [seqNum, seqs]);

  const forward = () => {
    if (seqNum < seqs.length) {
      setSeqNum(seqNum + 1);
    }
  };

  const backward = () => {
    if (seqNum > 1) {
      setSeqNum(seqNum - 1);
    }
  };

  useKeypress(["ArrowLeft", "Backspace"], () => {
    backward();
  });
  useKeypress(["ArrowRight", " "], (e: KeyboardEvent) => {
    e.preventDefault();
    forward();
  });
  useKeypress(["Home", 'H'], () => {
    setSeqNum(1);
  });
  useKeypress(["End", 'E'], () => {
    setSeqNum(seqs.length);
  });
  const navStyles = {
    disabled: "bg-gray-300 px-4 py-2 rounded-md cursor-not-allowed opacity-50",
    enabled:
      "bg-green-500 hover:bg-green-700 active:bg-green-800 px-4 py-2 rounded-md text-white",
  };

  return (
    <div className="flex flex-col max-h-[100dvh]">
      {/* Progress bar at the top*/}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: percentage + "%" }}
        />
      </div>

      {/* Text Instruction renderer */}
      <div className="flex-grow overflow-hidden">
        <div className="h-screen" />
        {instructions}
        <div className="h-screen" />
      </div>

      {/* Notes */}
      <div className="flex text-left">
        <ul className="text-sm list-none m-auto p-4 h-28 text-center">
          <li>
            Sequence: {seqNum} of {seqs.length}
          </li>
          {seq.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>

      {/* Table */}
      <div className="flex flex-row px-16 w-full overflow-hidden h-72 min-h-[66px]">
        {tables}
        <div className="min-w-[120px]" />
      </div>

      {/* Back/Forward Buttons */}
      <div className="flex flex-row h-60 text-5xl m-auto p-8 space-x-8 select-none">
        <div
          className={seqNum > 1 ? navStyles.enabled : navStyles.disabled}
          onClick={backward}
        >
          ←
        </div>
        <div
          className={
            seqNum < seqs.length ? navStyles.enabled : navStyles.disabled
          }
          onClick={forward}
        >
          →
        </div>
      </div>
    </div>
  );
}
