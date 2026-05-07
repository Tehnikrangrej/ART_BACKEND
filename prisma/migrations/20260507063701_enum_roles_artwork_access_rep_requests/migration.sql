/*
  Warnings:

  - You are about to drop the column `Pictures` on the `ArtWork` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'CLIENT', 'CLIENT_REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "RepresentativeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- AlterTable
ALTER TABLE "ArtWork" DROP COLUMN "Pictures",
ADD COLUMN     "pictures" TEXT[],
ALTER COLUMN "dimensions" DROP NOT NULL,
ALTER COLUMN "provenance" DROP NOT NULL,
ALTER COLUMN "location" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roleId",
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CLIENT';

-- DropTable
DROP TABLE "Permission";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "RolePermission";

-- CreateTable
CREATE TABLE "ArtWorkAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtWorkAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepresentativeRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "requestedName" TEXT NOT NULL,
    "requestedEmail" TEXT NOT NULL,
    "status" "RepresentativeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepresentativeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtWorkAccess_userId_idx" ON "ArtWorkAccess"("userId");

-- CreateIndex
CREATE INDEX "ArtWorkAccess_artworkId_idx" ON "ArtWorkAccess"("artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtWorkAccess_userId_artworkId_key" ON "ArtWorkAccess"("userId", "artworkId");

-- CreateIndex
CREATE INDEX "RepresentativeRequest_clientId_idx" ON "RepresentativeRequest"("clientId");

-- CreateIndex
CREATE INDEX "RepresentativeRequest_status_idx" ON "RepresentativeRequest"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtWorkAccess" ADD CONSTRAINT "ArtWorkAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtWorkAccess" ADD CONSTRAINT "ArtWorkAccess_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "ArtWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeRequest" ADD CONSTRAINT "RepresentativeRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepresentativeRequest" ADD CONSTRAINT "RepresentativeRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
