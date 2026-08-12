-- CreateTable
CREATE TABLE "Benefit" (
    "id" TEXT NOT NULL,
    "icon" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Benefit_pkey" PRIMARY KEY ("id")
);
