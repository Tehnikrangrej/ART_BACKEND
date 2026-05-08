-- AlterTable
ALTER TABLE "ArtWork" ADD COLUMN     "period" TEXT;

-- CreateTable
CREATE TABLE "RelatedWorkSettings" (
    "id" TEXT NOT NULL,
    "matchArtist" BOOLEAN NOT NULL DEFAULT true,
    "matchMedium" BOOLEAN NOT NULL DEFAULT true,
    "matchPeriod" BOOLEAN NOT NULL DEFAULT false,
    "maxResults" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelatedWorkSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtWork_artist_idx" ON "ArtWork"("artist");

-- CreateIndex
CREATE INDEX "ArtWork_medium_idx" ON "ArtWork"("medium");

-- CreateIndex
CREATE INDEX "ArtWork_period_idx" ON "ArtWork"("period");
