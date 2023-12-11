-- CreateTable
CREATE TABLE "Pattern" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "currentSequence" INTEGER NOT NULL DEFAULT 1
);
