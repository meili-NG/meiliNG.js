/*
  Warnings:

  - You are about to drop the column `userId` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `oAuthClientAccessControlsId` on the `OAuthClient` table. All the data in the column will be lost.
  - You are about to drop the column `oAuthUserAccessControlsId` on the `OAuthClientAccessControls` table. All the data in the column will be lost.
  - You are about to drop the column `oAuthClientId` on the `OAuthClientAuthorization` table. All the data in the column will be lost.
  - You are about to drop the column `oAuthClientId` on the `OAuthClientRedirectUris` table. All the data in the column will be lost.
  - You are about to drop the column `oAuthClientId` on the `OAuthClientSecrets` table. All the data in the column will be lost.
  - You are about to drop the column `oAuthClientAuthorizationId` on the `OAuthToken` table. All the data in the column will be lost.
  - Added the required column `aclId` to the `OAuthClient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `OAuthClientAuthorization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorizationId` to the `OAuthToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Group` DROP FOREIGN KEY `Group_ibfk_1`;

-- DropForeignKey
ALTER TABLE `OAuthClient` DROP FOREIGN KEY `OAuthClient_ibfk_1`;

-- DropForeignKey
ALTER TABLE `OAuthClientAccessControls` DROP FOREIGN KEY `OAuthClientAccessControls_ibfk_1`;

-- DropForeignKey
ALTER TABLE `OAuthClientAuthorization` DROP FOREIGN KEY `OAuthClientAuthorization_ibfk_2`;

-- DropForeignKey
ALTER TABLE `OAuthClientRedirectUris` DROP FOREIGN KEY `OAuthClientRedirectUris_ibfk_1`;

-- DropForeignKey
ALTER TABLE `OAuthClientSecrets` DROP FOREIGN KEY `OAuthClientSecrets_ibfk_2`;

-- DropForeignKey
ALTER TABLE `OAuthToken` DROP FOREIGN KEY `OAuthToken_ibfk_1`;

-- AlterTable
ALTER TABLE `Group` DROP COLUMN `userId`;

-- AlterTable
ALTER TABLE `OAuthClient` DROP COLUMN `oAuthClientAccessControlsId`,
    ADD COLUMN     `aclId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `OAuthClientAccessControls` DROP COLUMN `oAuthUserAccessControlsId`,
    ADD COLUMN     `userAclId` VARCHAR(191);

-- AlterTable
ALTER TABLE `OAuthClientAuthorization` DROP COLUMN `oAuthClientId`,
    ADD COLUMN     `clientId` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191);

-- AlterTable
ALTER TABLE `OAuthClientRedirectUris` DROP COLUMN `oAuthClientId`,
    ADD COLUMN     `clientId` VARCHAR(191);

-- AlterTable
ALTER TABLE `OAuthClientSecrets` DROP COLUMN `oAuthClientId`,
    ADD COLUMN     `clientId` VARCHAR(191);

-- AlterTable
ALTER TABLE `OAuthToken` DROP COLUMN `oAuthClientAuthorizationId`,
    ADD COLUMN     `authorizationId` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('ACCESS_TOKEN', 'REFRESH_TOKEN', 'ACCOUNT_TOKEN', 'AUTHORIZATION_CODE', 'DEVICE_CODE') NOT NULL;

-- CreateTable
CREATE TABLE `_GroupToUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,
UNIQUE INDEX `_GroupToUser_AB_unique`(`A`, `B`),
INDEX `_GroupToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_GroupToUser` ADD FOREIGN KEY (`A`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GroupToUser` ADD FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthClient` ADD FOREIGN KEY (`aclId`) REFERENCES `OAuthClientAccessControls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthClientAccessControls` ADD FOREIGN KEY (`userAclId`) REFERENCES `OAuthUserAccessControls`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthClientAuthorization` ADD FOREIGN KEY (`clientId`) REFERENCES `OAuthClient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthClientRedirectUris` ADD FOREIGN KEY (`clientId`) REFERENCES `OAuthClient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthClientSecrets` ADD FOREIGN KEY (`clientId`) REFERENCES `OAuthClient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthToken` ADD FOREIGN KEY (`authorizationId`) REFERENCES `OAuthClientAuthorization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
