-- AlterTable
ALTER TABLE "RelatedWorkSettings" ADD COLUMN     "matchLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchProvenance" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ArtWork_location_idx" ON "ArtWork"("location");

-- CreateIndex
CREATE INDEX "ArtWork_provenance_idx" ON "ArtWork"("provenance");
