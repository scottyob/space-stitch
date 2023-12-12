import { redirect } from "next/navigation";
import prisma from "../utils/prisma";
import AComponent from "./AComponent";
import { revalidatePath } from "next/cache";
import { isSuperuser } from "../server/access";

export default async function Index() {
  const patterns = await prisma.pattern.findMany();

  async function deleteProject(id: number) {
    "use server";
    if (!isSuperuser()) {
      throw new Error("Access denied");
    }

    await prisma.pattern.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/");
    redirect("/");
  }

  const superuser = isSuperuser();

  return (
    <div>
      <h1 className="text-2xl p-4 m-auto">SPACE-STITCH</h1>
      <h2 className="text-xl p-4">Projects</h2>
      <div className="m-4 pl-4">
        <ul className="list-disc">
          {patterns.map((p) => {
            const deleteMethod = deleteProject.bind(null, p.id);

            return (
              <li key={p.id.toString()}>
                <a href={`/play/${p.id}`}>{p.title}</a>
                {/* Only show edit delete buttons if we're a superuser */}
                {superuser && (
                  <span className="text-xs">
                    {" - "}
                    <a href={`/edit/${p.id}`}>(edit)</a>
                    <AComponent text={"(delete)"} onClick={deleteMethod} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {superuser && (
        <a href="/edit/" className="bg-green-300 rounded-lg p-1 ml-4">
          New Project
        </a>
      )}
    </div>
  );
}
