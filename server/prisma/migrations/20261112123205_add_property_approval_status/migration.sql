-- CreateEnum
CREATE TYPE "PropertyApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "approvalStatus" "PropertyApprovalStatus" NOT NULL DEFAULT 'pending';
