import prisma from "@/lib/prisma";

export interface InterviewData {
  userId: string;
  questionSetId: string;
  title: string;
}

export class InterviewModel {
  static async getAll(userId: string) {
    return await prisma.interviewSession.findMany({
      where: {
        userId,
      },
    });
  }

  static async createInterview(data: InterviewData) {
    return await prisma.interviewSession.create({
      data,
    });
  }
}
