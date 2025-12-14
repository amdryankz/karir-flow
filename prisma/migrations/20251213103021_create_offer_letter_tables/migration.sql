-- CreateTable
CREATE TABLE "offerLetter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offerLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offerAnalysis" (
    "id" TEXT NOT NULL,
    "offerLetterId" TEXT NOT NULL,
    "baseSalaryAmount" TEXT,
    "bonusPolicy" TEXT,
    "equityValue" TEXT,
    "allowances" TEXT,
    "totalCompensation" TEXT,
    "jobTitle" TEXT,
    "employmentType" TEXT,
    "workingHours" TEXT,
    "workLocation" TEXT,
    "startDate" TEXT,
    "probationTerms" TEXT,
    "leavePolicy" TEXT,
    "competitivenessScore" INTEGER,
    "competitivenessText" TEXT,
    "clarityScore" INTEGER,
    "legalComplexity" TEXT,
    "employerFavorability" TEXT,
    "negotiationItems" TEXT,
    "negotiationPhrases" TEXT,
    "missingItems" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offerAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redFlag" (
    "id" TEXT NOT NULL,
    "offerLetterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,

    CONSTRAINT "redFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offerAnalysis_offerLetterId_key" ON "offerAnalysis"("offerLetterId");

-- AddForeignKey
ALTER TABLE "offerLetter" ADD CONSTRAINT "offerLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerAnalysis" ADD CONSTRAINT "offerAnalysis_offerLetterId_fkey" FOREIGN KEY ("offerLetterId") REFERENCES "offerLetter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redFlag" ADD CONSTRAINT "redFlag_offerLetterId_fkey" FOREIGN KEY ("offerLetterId") REFERENCES "offerLetter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
