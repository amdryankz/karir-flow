/*
  Warnings:

  - Added the required column `title` to the `offerLetter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "offerLetter" ADD COLUMN     "title" TEXT NOT NULL;
