import prisma from "@/lib/prisma";

export interface OfferLetterData {
  userId: string;
  title: string;
  fileUrl: string;
  status: string;
}

export interface OfferAnalysisData {
  offerLetterId: string;
  baseSalaryAmount?: string;
  bonusPolicy?: string;
  equityValue?: string;
  allowances?: string;
  totalCompensation?: string;
  jobTitle?: string;
  employmentType?: string;
  workingHours?: string;
  workLocation?: string;
  startDate?: string;
  probationTerms?: string;
  leavePolicy?: string;
  competitivenessScore?: number;
  competitivenessText?: string;
  clarityScore?: number;
  legalComplexity?: string;
  employerFavorability?: string;
  negotiationItems?: string;
  negotiationPhrases?: string;
  missingItems?: string;
}

export interface RedFlagData {
  offerLetterId: string;
  type: string;
  description: string;
  severity: string;
}

export class OfferingModel {
  static async createOfferLetter(data: OfferLetterData) {
    return await prisma.offerLetter.create({
      data,
    });
  }

  static async getAllOfferLetters(userId: string) {
    return await prisma.offerLetter.findMany({
      where: { userId },
      include: {
        analysis: true,
        redFlags: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getOfferLetterById(id: string, userId: string) {
    return await prisma.offerLetter.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        analysis: true,
        redFlags: true,
      },
    });
  }

  static async deleteOfferLetter(id: string, userId: string) {
    return await prisma.offerLetter.delete({
      where: {
        id,
        userId,
      },
      include: {
        analysis: true,
        redFlags: true,
      },
    });
  }

  static async updateOfferLetterStatus(id: string, status: string) {
    return await prisma.offerLetter.update({
      where: { id },
      data: { status },
    });
  }

  static async createOfferAnalysisWithRedFlags(
    analysisData: OfferAnalysisData,
    redFlags: RedFlagData[]
  ) {
    return await prisma.$transaction(async (tx) => {
      const analysis = await tx.offerAnalysis.create({
        data: analysisData,
      });

      if (redFlags.length > 0) {
        await tx.redFlag.createMany({
          data: redFlags,
        });
      }

      return analysis;
    });
  }
}
