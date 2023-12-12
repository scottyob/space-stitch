import { redirect } from "next/navigation";
import prisma from "../../../utils/prisma";
import { headers } from "next/headers";
import { isSuperuser } from "../../../server/access";

export default async function Page({ params }: { params: { id: string[] } }) {
  async function updatePattern(formData: FormData) {
    "use server";

    if (!isSuperuser()) {
      throw new Error("Access Denied");
    }

    const rawFormData = {
      patternId: formData.get("patternId") as string,
      title: formData.get("title") as string,
      sequence: Number.parseInt(formData.get("sequence") as string),
      pattern: formData.get("pattern") as string,
    };

    const id =
      Number.parseInt(rawFormData.patternId?.toString() || "") || undefined;

    let ret = undefined;
    const data = {
      currentSequence: rawFormData.sequence,
      pattern: rawFormData.pattern,
      title: rawFormData.title,
    };
    if (id) {
      ret = await prisma.pattern.update({
        where: {
          id: id,
        },
        data: data,
      });
    } else {
      ret = await prisma.pattern.create({
        data: data,
      });
    }

    redirect("/");
  }

  let title = "";
  let sequence = 1;
  let pattern = "";
  let id = params.id?.[0] || undefined;

  if (id) {
    const patternObject = await prisma.pattern.findUnique({
      where: {
        id: Number.parseInt(id),
      },
    });

    if (patternObject) {
      title = patternObject.title;
      sequence = patternObject.currentSequence;
      pattern = patternObject.pattern;
    }
  }

  return (
    <form
      action={updatePattern}
      className="items-center flex flex-col h-full max-w-[800px] m-auto pb-4"
    >
      <div className="flex w-full p-4">
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

        <label htmlFor="sequence">Sequence:</label>
        <input
          type="number"
          id="sequence"
          name="sequence"
          defaultValue={sequence}
          required
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 p-2 ml-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Save
        </button>
      </div>
      <textarea
        id="pattern"
        name="pattern"
        defaultValue={pattern}
        className="flex-grow h-full w-full"
      />
      <input type="hidden" name="patternId" defaultValue={id} />
    </form>
  );
}
