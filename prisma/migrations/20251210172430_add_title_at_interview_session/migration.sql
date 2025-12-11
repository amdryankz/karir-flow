/*
  Warnings:

  - Added the required column `title` to the `interviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "interviewSession" ADD COLUMN     "title" TEXT NOT NULL;
