/*
  Warnings:

  - You are about to drop the column `userId` on the `OAuthClient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `OAuthClient` DROP FOREIGN KEY `OAuthClient_ibfk_2`;

-- AlterTable
ALTER TABLE `OAuthClient` DROP COLUMN `userId`;

-- CreateTable
CREATE TABLE `_OAuthClientToUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,
UNIQUE INDEX `_OAuthClientToUser_AB_unique`(`A`, `B`),
INDEX `_OAuthClientToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_OAuthClientToUser` ADD FOREIGN KEY (`A`) REFERENCES `OAuthClient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_OAuthClientToUser` ADD FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
