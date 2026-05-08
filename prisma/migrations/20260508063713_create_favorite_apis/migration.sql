-- CreateTable
CREATE TABLE "FavoriteArtwork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteArtwork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteArtwork_userId_idx" ON "FavoriteArtwork"("userId");

-- CreateIndex
CREATE INDEX "FavoriteArtwork_artworkId_idx" ON "FavoriteArtwork"("artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteArtwork_userId_artworkId_key" ON "FavoriteArtwork"("userId", "artworkId");

-- AddForeignKey
ALTER TABLE "FavoriteArtwork" ADD CONSTRAINT "FavoriteArtwork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteArtwork" ADD CONSTRAINT "FavoriteArtwork_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "ArtWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
