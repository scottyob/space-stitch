"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import * as PatternParse from "../../parse";
import {
  AppStorage,
  DefaultAppState,
  Pattern,
  PatternSequence,
  ProgressMode,
} from "../../types";
import { useLocalStorage } from "@uidotdev/usehooks";
// @ts-ignore
import useKeypress from "react-use-keypress";
import { kebabCase } from "lodash";
import useSound from "use-sound";
import { Popover } from "react-tiny-popover";
import ProgressSettings from "./settings";

export default function PlayerLoader(props: { params: { name: string } }) {
  let [localStore, setLocalStore] = useLocalStorage<AppStorage>(
    "stitch",
    DefaultAppState
  );

  const patternName = Object.keys(localStore.patterns).filter(
    (x) => props.params.name == kebabCase(x)
  )?.[0];

  if (!patternName) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        Pattern not found
      </div>
    );
  }

  return (
    <Player
      pattern={localStore.patterns[patternName]}
      localStore={localStore}
      updateLocalStore={setLocalStore}
      patternName={patternName}
    />
  );
}

function Player(props: {
  pattern: Pattern;
  localStore: AppStorage;
  updateLocalStore: Dispatch<SetStateAction<AppStorage>>;
  patternName: string;
}) {
  const { pattern, localStore, updateLocalStore, patternName } = props;

  let seqNum = pattern.currentSeq;
  const setSeqNum = (newNum: number) => {
    const newStore = { ...localStore };
    pattern.currentSeq = newNum;
    newStore.patterns = { ...newStore.patterns, [patternName]: pattern };
    updateLocalStore(newStore);
  };

  const tableRefs = useRef(new Array());
  const instructionRefs = useRef(new Array());

  // Parse the instructions
  const lexer = PatternParse.PatternLexer;
  const parser = new PatternParse.PatternParser();
  const lexingResult = lexer.tokenize(pattern.pattern);
  parser.input = lexingResult.tokens;
  // @ts-expect-error
  const seqs = parser.pattern() as PatternSequence[];
  const seq = seqs[seqNum - 1] ?? seqs[0];
  seqNum = seq.sequenceNum;

  // Sound effects
  const [ding] = useSound("/sounds/ding.wav");
  const [woosh] = useSound("/sounds/woosh.flac");
  const [click] = useSound("/sounds/type.wav");

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
        seq.position.endCol
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
      all: "min-w-[80px] min-h-[40px] text-center align-middle border-r",
      selected: "text-black font-black",
      future: "text-gray-600 font-normal",
      past: "text-gray-300 font-normal",
      endOfGroup: "border-r-4 border-r-gray-400",
    };

    let tableStyle =
      tableStyles.all +
      " " +
      (seqNum == s.sequenceNum
        ? tableStyles.selected
        : s.sequenceNum < seqNum
          ? tableStyles.past
          : tableStyles.future);

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
      </th>
    );
    tableBody.push(
      <td key={s.sequenceNum} className={tableStyle}>
        {s.sequenceNum < seqNum ? "✅" : "."}
      </td>
    );

    if (s.annotations.indexOf("EndOfRound") !== -1) {
      // We're at the end of the round, Add a table
      tables.push(
        <table
          key={tables.length}
          className="table-fixed border border-gray-400 divide-x m-2 h-8"
        >
          <thead>
            <tr>{tableHead}</tr>
          </thead>
          <tbody>
            <tr>{tableBody}</tr>
          </tbody>
        </table>
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
    let snd = click;
    let newSeqNum = seqNum;
    if (localStore.progressMode == ProgressMode.Stitch) {
      // Progress one stitch
      if (seqNum < seqs.length) {
        if (seq.annotations.indexOf("EndOfRound") != -1) {
          snd = ding;
        }
        newSeqNum = seqNum + 1;
      }
    } else if (
      localStore.progressMode == ProgressMode.Group &&
      seq.annotations.indexOf("Grp") != -1
    ) {
      // Progress one Group
      do {
        newSeqNum += 1;
      } while (
        seqNum < seqs.length &&
        seqs[newSeqNum - 2].annotations.indexOf("EndOfGroup") == -1
      );
    } else {
      // Progress one row (default to if we're not in a group)
      do {
        newSeqNum += 1;
      } while (
        seqNum < seqs.length &&
        seqs[newSeqNum - 2].annotations.indexOf("EndOfRound") == -1
      );
    }
    snd();
    setSeqNum(newSeqNum);
  };

  const backward = () => {
    let newSeqNum = seqNum - 1; // make this index based 0
    switch (localStore.progressMode) {
      case ProgressMode.Stitch:
        newSeqNum -= 1;
        break;
      case ProgressMode.Group:
        newSeqNum -= 1;
        while (
          newSeqNum > 0 &&
          (seqs[newSeqNum - 1].annotations.indexOf("EndOfGroup") == -1 &&
            seqs[newSeqNum - 1].annotations.indexOf("EndOfRound") == -1)
        ) {
          newSeqNum -= 1;
        }
        break;
      case ProgressMode.Round:
        newSeqNum -= 1;
        while (
          newSeqNum > 0 &&
          seqs[newSeqNum - 1].annotations.indexOf("EndOfRound") == -1
        ) {
          newSeqNum -= 1;
        }
        break;
      default:
        newSeqNum -= 1;
    }

    if (newSeqNum >= 0 && newSeqNum != seqNum) {
      setSeqNum(newSeqNum + 1); // Store as index base 1
      woosh();
    }
  };

  // Navigation
  useKeypress(["ArrowLeft", "Backspace"], () => {
    backward();
  });
  useKeypress(["ArrowRight", " "], (e: KeyboardEvent) => {
    e.preventDefault();
    forward();
  });
  useKeypress(["Home", "H"], () => {
    setSeqNum(1);
  });
  useKeypress(["End", "E"], () => {
    setSeqNum(seqs.length);
  });
  const navStyles = {
    disabled:
      "bg-gray-300 px-4 py-2 pt-4 rounded-md cursor-not-allowed opacity-50",
    enabled:
      "bg-green-500 hover:bg-green-700 active:bg-green-800 px-4 py-2 pt-4 rounded-md text-white",
  };

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      <div className="flex-grow overflow-hidden text-center">
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
      <div className="flex flex-row px-16 w-full overflow-hidden h-72 min-h-[90px]">
        {tables}
        <div className="min-w-[120px]" />
      </div>

      {/* Back/Forward Buttons */}
      <div className="flex flex-row h-[150px]">
        <div className="flex flex-row text-5xl m-auto p-8 space-x-8 select-none">
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
        {/* Settings */}
        <Popover
          isOpen={settingsOpen}
          content={
            <ProgressSettings
              progressMode={localStore.progressMode}
              updateProgressMode={(p) => {
                // Callback from settings to update the mode of which we progress
                updateLocalStore({ ...localStore, progressMode: p });
              }}
            />
          }
        >
          <div
            onClick={() => {
              setSettingsOpen(!settingsOpen);
            }}
            className="absolute bottom-0 right-0 rounded-md bg-gray-600 hover:bg-gray-700 active:bg-gray-800 p-2 pr-3 pl-3 m-4 text-white"
          >
            ⚙
          </div>
        </Popover>
      </div>
    </div>
  );
}
