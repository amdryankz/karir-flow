-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "pdfDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdfDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extractedText" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "extractedText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "extractedText_documentId_key" ON "extractedText"("documentId");

-- CreateIndex
CREATE INDEX "extractedText_content_idx" ON "extractedText" USING GIN ("content" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "pdfDocument" ADD CONSTRAINT "pdfDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extractedText" ADD CONSTRAINT "extractedText_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "pdfDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
