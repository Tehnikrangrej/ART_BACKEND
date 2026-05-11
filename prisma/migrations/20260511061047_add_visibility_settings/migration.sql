-- CreateTable
CREATE TABLE "ArtworkVisibilitySettings" (
    "id" TEXT NOT NULL DEFAULT 'global-visibility',
    "showTitle" BOOLEAN NOT NULL DEFAULT true,
    "showArtist" BOOLEAN NOT NULL DEFAULT true,
    "showYear" BOOLEAN NOT NULL DEFAULT true,
    "showMedium" BOOLEAN NOT NULL DEFAULT true,
    "showDimensions" BOOLEAN NOT NULL DEFAULT true,
    "showProvenance" BOOLEAN NOT NULL DEFAULT true,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "showPeriod" BOOLEAN NOT NULL DEFAULT true,
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "showPictures" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtworkVisibilitySettings_pkey" PRIMARY KEY ("id")
);
