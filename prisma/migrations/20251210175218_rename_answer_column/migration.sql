/*
  Warnings:

  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_interviewSessionId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropTable
DROP TABLE "Answer";

-- CreateTable
CREATE TABLE "answer" (
    "id" TEXT NOT NULL,
    "transcription" TEXT NOT NULL,
    "feedbackContent" TEXT,
    "feedbackTone" TEXT,
    "score" INTEGER NOT NULL,
    "speechPace" "SpeechPace" NOT NULL,
    "confidentLevel" "ConfidenceLevel" NOT NULL,
    "tips" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "interviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
