-- CreateTable
CREATE TABLE "ArtworkShareLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtWorkToArtworkShareLink" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtWorkToArtworkShareLink_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkShareLink_token_key" ON "ArtworkShareLink"("token");

-- CreateIndex
CREATE INDEX "_ArtWorkToArtworkShareLink_B_index" ON "_ArtWorkToArtworkShareLink"("B");

-- AddForeignKey
ALTER TABLE "ArtworkShareLink" ADD CONSTRAINT "ArtworkShareLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtWorkToArtworkShareLink" ADD CONSTRAINT "_ArtWorkToArtworkShareLink_A_fkey" FOREIGN KEY ("A") REFERENCES "ArtWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtWorkToArtworkShareLink" ADD CONSTRAINT "_ArtWorkToArtworkShareLink_B_fkey" FOREIGN KEY ("B") REFERENCES "ArtworkShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
