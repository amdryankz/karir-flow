-- CreateEnum
CREATE TYPE "SpeechPace" AS ENUM ('TOO_FAST', 'NORMAL', 'TOO_SLOW');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "interviewSession" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalScore" INTEGER,
    "userId" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,

    CONSTRAINT "interviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "transcription" TEXT NOT NULL,
    "feedback_content" TEXT,
    "feedback_tone" TEXT,
    "score" INTEGER NOT NULL,
    "speech_pace" "SpeechPace" NOT NULL,
    "confidence_level" "ConfidenceLevel" NOT NULL,
    "tips" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interviewSession" ADD CONSTRAINT "interviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviewSession" ADD CONSTRAINT "interviewSession_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "questionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "interviewSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
