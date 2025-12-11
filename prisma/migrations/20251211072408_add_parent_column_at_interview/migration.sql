-- DropForeignKey
ALTER TABLE "answer" DROP CONSTRAINT "answer_interviewSessionId_fkey";

-- DropForeignKey
ALTER TABLE "answer" DROP CONSTRAINT "answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "interviewSession" DROP CONSTRAINT "interviewSession_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "interviewSession" DROP CONSTRAINT "interviewSession_userId_fkey";

-- AlterTable
ALTER TABLE "interviewSession" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "interviewSession" ADD CONSTRAINT "interviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviewSession" ADD CONSTRAINT "interviewSession_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "questionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviewSession" ADD CONSTRAINT "interviewSession_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "interviewSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "interviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
