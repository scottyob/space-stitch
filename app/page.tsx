"use client";

import { useLocalStorage } from "@uidotdev/usehooks";
import AComponent from "./AComponent";
import { AppStorage, DefaultAppState } from "./types";
import { kebabCase } from "lodash";

export default function Index() {
  let [localStore, setLocalStore] = useLocalStorage<AppStorage>(
    "stitch",
    DefaultAppState
  );

  return (
    <div>
      <h1 className="text-6xl p-6 text-center font-bold shadow-md text-orange-800">SPACE-STITCH</h1>
      <h2 className="text-xl p-4">Projects</h2>
      <div className="m-4 pl-4">
        <ul className="list-disc">
          {Object.keys(localStore.patterns).map((patternName) => {
            const deleteMethod = () => {};

            return (
              <li key={patternName}>
                <a href={`/play/${kebabCase(patternName)}`} className="underline text-orange-500 decoration-orange-200">{patternName}</a>
                <span className="text-xs">
                  {" - "}
                  <a href={`/edit/${kebabCase(patternName)}`}>(edit)</a>
                  <AComponent text={"(delete)"} onClick={deleteMethod} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <a href="/edit/" className="bg-blue-300 rounded-lg p-2 m-8">
        New Project
      </a>
    </div>
  );
}
