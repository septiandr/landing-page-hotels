-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropIndex
DROP INDEX "Room_status_idx";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GalleryItem" ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Experience_scheduledPublishAt_idx" ON "Experience"("scheduledPublishAt");

-- CreateIndex
CREATE INDEX "GalleryItem_scheduledPublishAt_idx" ON "GalleryItem"("scheduledPublishAt");

-- CreateIndex
CREATE INDEX "Room_status_scheduledPublishAt_idx" ON "Room"("status", "scheduledPublishAt");

-- CreateIndex
CREATE INDEX "Testimonial_scheduledPublishAt_idx" ON "Testimonial"("scheduledPublishAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
