import { ConfidenceLevel, SpeechPace } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export interface QuestionData {
  text: string;
  order: number;
  voiceUrl?: string;
}

export interface QuestionSetData {
  userId: string;
  description: string;
  questions: QuestionData[];
}

export interface AnswerData {
  transcription: string;
  audioUrl?: string;
  feedbackContent: string;
  feedbackTone: string;
  score: number;
  speechPace: SpeechPace;
  confidentLevel: ConfidenceLevel;
  tips: string;
  interviewSessionId: string;
  questionId: string;
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

  static async getQuestionById(id: string) {
    return await prisma.question.findFirst({
      where: {
        id,
      },
    });
  }

  static async createQuestionSet(data: QuestionSetData) {
    return await prisma.$transaction(async (tx) => {
      return await tx.questionSet.create({
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

  static async createAnswer(data: AnswerData) {
    return await prisma.answer.create({
      data,
    });
  }
}
