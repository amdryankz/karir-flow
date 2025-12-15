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

  /**
   * Create offer analysis (without transaction)
   */
  static async createOfferAnalysis(data: OfferAnalysisData) {
    return await prisma.offerAnalysis.create({
      data,
    });
  }

  /**
   * Create red flags
   */
  static async createRedFlags(redFlags: RedFlagData[]) {
    return await prisma.redFlag.createMany({
      data: redFlags,
    });
  }

  static async getDashboardStats(userId: string) {
    // Get latest 5 offer letters
    const offers = await prisma.offerLetter.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    
    // Get total count
    const totalCount = await prisma.offerLetter.count({
      where: { userId },
    });

    return { offers, totalCount };
  }
}
