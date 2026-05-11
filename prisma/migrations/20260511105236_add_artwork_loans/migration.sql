-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ON_LOAN', 'RETURNED', 'OVERDUE');

-- CreateTable
CREATE TABLE "ArtworkLoan" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "borrowerContact" TEXT,
    "location" TEXT NOT NULL,
    "loanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'ON_LOAN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtworkLoan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtworkLoan_artworkId_idx" ON "ArtworkLoan"("artworkId");

-- CreateIndex
CREATE INDEX "ArtworkLoan_status_idx" ON "ArtworkLoan"("status");

-- CreateIndex
CREATE INDEX "ArtworkLoan_dueDate_idx" ON "ArtworkLoan"("dueDate");

-- AddForeignKey
ALTER TABLE "ArtworkLoan" ADD CONSTRAINT "ArtworkLoan_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "ArtWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
