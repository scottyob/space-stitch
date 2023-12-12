import prisma from "../../../utils/prisma";
import Player from "./player";

export default async function PlayerContainer(props: {
  params: { id: string };
}) {
  // Pull the pattern from the database
  const pattern = await prisma.pattern.findUniqueOrThrow({
    where: {
      id: Number.parseInt(props.params.id),
    },
  });

  return <Player patternId={props.params.id} pattern={pattern} />;
}
