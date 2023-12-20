"use client"

import AComponent from "./AComponent";

export default function Index() {

  const patterns: {id: number, title: string}[] = [];

  return (
    <div>
      <h1 className="text-2xl p-4 m-auto">SPACE-STITCH</h1>
      <h2 className="text-xl p-4">Projects</h2>
      <div className="m-4 pl-4">
        <ul className="list-disc">
          {patterns.map((p) => {
            const deleteMethod = () => {

            }

            return (
              <li key={p.id.toString()}>
                <a href={`/play/${p.id}`}>{p.title}</a>
                  <span className="text-xs">
                    {" - "}
                    <a href={`/edit/${p.id}`}>(edit)</a>
                    <AComponent text={"(delete)"} onClick={deleteMethod} />
                  </span>
              </li>
            );
          })}
        </ul>
      </div>

        <a href="/edit/" className="bg-green-300 rounded-lg p-1 ml-4">
          New Project
        </a>
    </div>
  );
}
