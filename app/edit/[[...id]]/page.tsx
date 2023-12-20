"use client";

import { Editor } from "@monaco-editor/react";
import { redirect } from "next/navigation";
import { useRef, useState } from "react";
import * as PatternParse from "../../parse";
import { PatternSequence } from "../../types";

export default function Page({ params }: { params: { id: string[] } }) {
  // Custom language created with: https://ohdarling88.medium.com/4-steps-to-add-custom-language-support-to-monaco-editor-5075eafa156d

  // Load up the pattern parser
  const lexer = PatternParse.PatternLexer;
  const parser = new PatternParse.PatternParser();
  const [pattern, setPattern] = useState<PatternSequence[] | null>(null);

  const monacoRef = useRef(null);
  const editorRef = useRef(null);

  const id = 0;
  const title = "";
  const sequence = 0;
  // className="flex-grow h-full w-full"

  const patternDesc =
    pattern && pattern.length > 0 ? (
      <>
        <div>{`${pattern.length} stitches`}</div>
        <div>
          {`Last Instruction: ${pattern[pattern.length - 1].notes.join(" - ")}`}
        </div>
      </>
    ) : (
      "ERROR LOADING PATTERN"
    );

  return (
    <form
      action={() => {}}
      className="items-center flex flex-col h-full m-auto pb-4"
    >
      <button
        type="submit"
        className="rounded-md bg-indigo-600 p-2 mt-4 ml-auto mr-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Save
      </button>
      <div className="flex p-4">
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
          defaultValue={title}
          required
        />
      </div>
      <div className="flex">
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
          defaultValue={sequence}
          required
        />
      </div>

      {/* Editor / Parser section */}
      <div className="p-4 text-xs text-center">{patternDesc}</div>
      <Editor
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
          editorRef.current = editor;
          monacoRef.current = monaco;
        }}
        language="pattern"
        onChange={(value) => {
          // Let's try and compile the pattern
          const lexingResult = lexer.tokenize(value as string);
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
        }}
      />
      <input type="hidden" name="patternId" defaultValue={id} />
    </form>
  );
}
