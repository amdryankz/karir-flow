import prisma from "@/lib/prisma";

export interface QuestionData {
  text: string;
  order: number;
}

export interface QuestionSetData {
  userId: string;
  description: string;
  questions: QuestionData[];
}

export class QuestionModel {
  static async getQuestionSetsByUserId(userId: string) {
    return await prisma.questionSet.findMany({
      where: {
        userId: userId,
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
          select: {
            text: true,
            order: true,
          },
        },
      },
    });
  }

  static async getQuestionSetById(id: string) {
    return await prisma.questionSet.findFirst({
      where: {
        id,
      },
    });
  }

  static async createQuestionSet(data: QuestionSetData) {
    return await prisma.questionSet.create({
      data: {
        userId: data.userId,
        description: data.description,
        questions: {
          createMany: {
            data: data.questions,
          },
        },
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  static async getPdfDocumentWithText(userId: string) {
    return await prisma.pdfDocument.findFirst({
      where: {
        userId: userId,
      },
      include: {
        extractedText: true,
      },
    });
  }
}
