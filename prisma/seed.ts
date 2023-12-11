import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
await prisma.pattern.create({
    data: {
        title: "Test pattern 1",
        pattern: "Rnd 1: 10 sc\n",
        currentSequence: 1,
    }
});

await prisma.pattern.create({
    data: {
        title: "Test pattern 2",
        pattern: `
            Rnd 1: sc
            Rnd 2-3: [2 sc, inc] x 6 (18 sts)
            Rnd 4: sc
        `,
        currentSequence: 1,
    }
});
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });