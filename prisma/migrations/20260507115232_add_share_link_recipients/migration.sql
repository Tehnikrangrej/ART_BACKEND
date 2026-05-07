-- CreateTable
CREATE TABLE "_SharedWithRecipients" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SharedWithRecipients_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SharedWithRecipients_B_index" ON "_SharedWithRecipients"("B");

-- AddForeignKey
ALTER TABLE "_SharedWithRecipients" ADD CONSTRAINT "_SharedWithRecipients_A_fkey" FOREIGN KEY ("A") REFERENCES "ArtworkShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedWithRecipients" ADD CONSTRAINT "_SharedWithRecipients_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
