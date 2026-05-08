-- CreateTable
CREATE TABLE "ShortlistedArtwork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortlistedArtwork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShortlistedArtwork_userId_idx" ON "ShortlistedArtwork"("userId");

-- CreateIndex
CREATE INDEX "ShortlistedArtwork_artworkId_idx" ON "ShortlistedArtwork"("artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortlistedArtwork_userId_artworkId_key" ON "ShortlistedArtwork"("userId", "artworkId");

-- AddForeignKey
ALTER TABLE "ShortlistedArtwork" ADD CONSTRAINT "ShortlistedArtwork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortlistedArtwork" ADD CONSTRAINT "ShortlistedArtwork_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "ArtWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
