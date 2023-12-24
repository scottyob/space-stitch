"use client";

import { Editor } from "@monaco-editor/react";
import { redirect, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import * as PatternParse from "../parse";
import {
  AppStorage,
  DefaultAppState,
  Pattern,
  PatternSequence,
} from "../types";
import { useLocalStorage } from "@uidotdev/usehooks";
import { kebabCase } from "lodash";
import { useRouter } from "next/navigation";

export default function Page() {
  // Custom language created with: https://ohdarling88.medium.com/4-steps-to-add-custom-language-support-to-monaco-editor-5075eafa156d
  let [localStore, setLocalStore] = useLocalStorage<AppStorage>(
    "stitch",
    DefaultAppState,
  );

  // Find the title for our URL
  let patternName = Object.keys(localStore.patterns).filter(
    (x) => window.location.hash.split("#")[1] == kebabCase(x),
  )?.[0];

  if (!patternName) {
    patternName = window.location.hash.split("#")[1];
  }

  let startingPattern: Pattern | null = null;
  if (patternName) {
    startingPattern = localStore.patterns[patternName];
  }

  // Load up the pattern parser
  const lexer = PatternParse.PatternLexer;
  const parser = new PatternParse.PatternParser();
  const [pattern, setPattern] = useState<PatternSequence[] | null>(null);

  const monacoRef = useRef(null);

  const id = 0;

  const patternDesc =
    pattern && pattern.length > 0 ? (
      <>
        <div>{`${pattern.length} stitches`}</div>
        <div>
          {`Last Instruction: ${pattern[pattern.length - 1].notes.join(" - ")}`}
        </div>
      </>
    ) : (
      "ERROR PARSING PATTERN"
    );

  // States for new object information
  const [title, setTitle] = useState(patternName);
  const [patternStr, setPatternStr] = useState(startingPattern?.pattern);
  const [seq, setSeq] = useState(startingPattern?.currentSeq ?? 1);

  const parsePattern = (text: string | undefined) => {
    if (text === undefined) {
      return;
    }

    // Let's try and compile the pattern
    const lexingResult = lexer.tokenize(text as string);
    parser.input = lexingResult.tokens;
    const errors = [
      ...lexingResult.errors.map((e) => ({
        message: e.message,
        startLineNumber: e.line,
        endLineNumber: e.line,
        startColumn: e.column,
        endColumn: (e.column as number) + e.length,
      })),
      ...parser.errors.map((e) => ({
        message: e.message,
        startLineNumber: e.token.startLine,
        endLineNumber: e.token.endLine,
        startColumn: e.token.startColumn,
        endColumn: e.token.endColumn,
      })),
    ];

    // Show the errors on the monaco editor
    const monaco = monacoRef.current as any;
    const editor = monaco.editor;
    editor.setModelMarkers(editor.getModels()[0], "owner", errors);
    // @ts-expect-error
    setPattern((parser.pattern() as PatternSequence[]) || null);
    setPatternStr(text);
  };

  return (
    <form
      action={() => {
        delete localStore.patterns[patternName]; //Delete our starting pattern
        localStore.patterns;
        localStore.patterns[title] = {
          currentSeq: seq ?? 0,
          pattern: patternStr ?? "",
        };
        setLocalStore(localStore);
        redirect("/");
      }}
      className="items-center flex flex-col h-full m-auto pb-4"
    >
      <button
        type="submit"
        className="rounded-md bg-indigo-600 p-2 mt-4 ml-auto mr-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Save
      </button>
      <div className="flex p-4 w-full">
        <label
          className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
          htmlFor="title"
        >
          Title:
        </label>
        <input
          type="text"
          id="title"
          name="title"
          className="flex-grow"
          defaultValue={patternName}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          required
        />
      </div>
      <div className="flex pl-4 w-full">
        <label
          className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
          htmlFor="sequence"
        >
          Sequence:
        </label>
        <input
          type="number"
          id="sequence"
          name="sequence"
          defaultValue={seq}
          onChange={(e) => {
            setSeq(Number.parseInt(e.target.value));
          }}
          required
        />
      </div>

      {/* Editor / Parser section */}
      <div className="p-4 text-xs text-center">{patternDesc}</div>
      <Editor
        defaultValue={startingPattern?.pattern}
        beforeMount={(monaco) => {
          monaco.languages.register({ id: "pattern" });
          const keywords = ["Rnd"];
          monaco.languages.setMonarchTokensProvider("pattern", {
            keywords,
            tokenizer: {
              root: [
                [
                  /@?[a-zA-Z][\w$]*/,
                  {
                    cases: {
                      "@keywords": "keyword",
                      "@default": "variable",
                    },
                  },
                ],
                [/\(.*\)/, "comment"],
              ],
            },
          });
        }}
        onMount={(editor, monaco) => {
          // @ts-expect-error:  Yeah, no idea what the type should be here
          monacoRef.current = monaco;
          parsePattern(startingPattern?.pattern);
        }}
        language="pattern"
        onChange={parsePattern}
      />
      <input type="hidden" name="patternId" defaultValue={id} />
    </form>
  );
}
